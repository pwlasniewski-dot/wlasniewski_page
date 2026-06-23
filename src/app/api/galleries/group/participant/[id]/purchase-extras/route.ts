import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';
import { createPayUOrder, extractClientIpv4 } from '@/lib/payu';

const DEFAULT_GROUP_PRINT_PRICE_10X15 = 150;
const DEFAULT_GROUP_PRINT_PRICE_15X21 = 250;

const GROUP_EXTRA_PRINT_SIZES = {
  '10x15': { label: '10x15 cm' },
  '15x21': { label: '15x21 cm' },
} as const;

type GroupExtraPrintSize = keyof typeof GROUP_EXTRA_PRINT_SIZES;

type GroupExtraPrintLine = {
  photo_id: number;
  print_size: GroupExtraPrintSize;
  quantity: number;
};

function isGroupExtraPrintSize(value: string): value is GroupExtraPrintSize {
  return value === '10x15' || value === '15x21';
}

function normalizeRequestedLines(body: any): GroupExtraPrintLine[] {
  const normalizedFromLines = Array.isArray(body?.order_lines) ? body.order_lines : [];

  const aggregated = new Map<string, GroupExtraPrintLine>();

  normalizedFromLines.forEach((rawLine: any) => {
    const photoId = Number(rawLine?.photo_id);
    const printSize = String(rawLine?.print_size || '').trim();
    const quantity = Number(rawLine?.quantity);

    if (!Number.isInteger(photoId) || photoId <= 0) return;
    if (!isGroupExtraPrintSize(printSize)) return;
    if (!Number.isInteger(quantity) || quantity <= 0) return;

    const safeQuantity = Math.min(quantity, 99);
    const key = `${photoId}:${printSize}`;
    const current = aggregated.get(key);
    if (current) {
      current.quantity = Math.min(current.quantity + safeQuantity, 99);
      return;
    }

    aggregated.set(key, {
      photo_id: photoId,
      print_size: printSize,
      quantity: safeQuantity,
    });
  });

  if (aggregated.size > 0) {
    return Array.from(aggregated.values());
  }

  const fallbackPhotoIds = Array.isArray(body?.photo_ids)
    ? body.photo_ids.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
    : [];
  const fallbackPrintSize = String(body?.print_size || '').trim() || '10x15';
  if (!isGroupExtraPrintSize(fallbackPrintSize)) {
    return [];
  }

  const fallbackMap = new Map<number, number>();
  fallbackPhotoIds.forEach((photoId: number) => {
    if (!Number.isInteger(photoId) || photoId <= 0) return;
    fallbackMap.set(photoId, (fallbackMap.get(photoId) || 0) + 1);
  });

  return Array.from(fallbackMap.entries()).map(([photo_id, quantity]) => ({
    photo_id,
    print_size: fallbackPrintSize,
    quantity: Math.min(quantity, 99),
  }));
}

async function getGroupPrintPrices() {
  const rows = await prisma.setting.findMany({
    where: {
      setting_key: {
        in: ['group_print_price_10x15', 'group_print_price_15x21'],
      },
    },
    select: {
      setting_key: true,
      setting_value: true,
    },
  });

  const byKey = new Map(rows.map((row) => [row.setting_key, row.setting_value]));
  const price10x15 = Number(byKey.get('group_print_price_10x15'));
  const price15x21 = Number(byKey.get('group_print_price_15x21'));

  return {
    '10x15': Number.isFinite(price10x15) && price10x15 > 0 ? Math.round(price10x15) : DEFAULT_GROUP_PRINT_PRICE_10X15,
    '15x21': Number.isFinite(price15x21) && price15x21 > 0 ? Math.round(price15x21) : DEFAULT_GROUP_PRINT_PRICE_15X21,
  } as const;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participantId = parseInt(params.id, 10);
    if (Number.isNaN(participantId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID uczestnika' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const payload = await verifyParentToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Nieprawidłowy token autoryzacyjny' }, { status: 401 });
    }

    if (payload.participant_id !== participantId) {
      return NextResponse.json({ error: 'Brak dostępu do tego uczestnika' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const requestedLines = normalizeRequestedLines(body);

    if (requestedLines.length === 0) {
      return NextResponse.json({ error: 'Brak poprawnych pozycji zamówienia' }, { status: 400 });
    }

    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      include: {
        gallery: {
          select: {
            id: true,
            client_name: true,
            client_email: true,
            group_access_code: true,
            gallery_mode: true,
            is_active: true,
            expires_at: true,
            price_per_premium: true,
            allow_extra_photo_purchase: true,
          },
        },
      },
    });

    if (!participant || !participant.gallery || participant.gallery.gallery_mode !== 'GROUP') {
      return NextResponse.json({ error: 'Uczestnik nie istnieje' }, { status: 404 });
    }

    if (!participant.gallery.is_active) {
      return NextResponse.json({ error: 'Galeria jest nieaktywna' }, { status: 403 });
    }

    if (participant.gallery.expires_at && new Date(participant.gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    if (!participant.allow_extra_photo_purchase && !participant.gallery.allow_extra_photo_purchase) {
      return NextResponse.json({ error: 'Ta opcja nie jest włączona dla tego rodzica' }, { status: 403 });
    }

    const uniquePhotoIds = Array.from(new Set(requestedLines.map((line) => line.photo_id)));

    const photos = await prisma.galleryPhoto.findMany({
      where: {
        id: { in: uniquePhotoIds },
        gallery_id: participant.gallery_id,
      },
      select: { id: true },
    });

    if (photos.length !== uniquePhotoIds.length) {
      return NextResponse.json({ error: 'Niektóre zdjęcia nie należą do tej galerii' }, { status: 400 });
    }

    const printPrices = await getGroupPrintPrices();
    const basePricePerPhoto = participant.gallery.price_per_premium || printPrices['15x21'];

    const normalizedLines = requestedLines.map((line) => {
      const unitAmount = printPrices[line.print_size];
      return {
        ...line,
        print_size_label: GROUP_EXTRA_PRINT_SIZES[line.print_size].label,
        unit_amount: unitAmount,
        line_total: unitAmount * line.quantity,
      };
    });

    const totalAmount = normalizedLines.reduce((sum, line) => sum + line.line_total, 0);
    const totalQuantity = normalizedLines.reduce((sum, line) => sum + line.quantity, 0);
    const expandedPhotoIds = normalizedLines.flatMap((line) => Array.from({ length: line.quantity }, () => line.photo_id));

    const uniqueSizes = Array.from(new Set(normalizedLines.map((line) => line.print_size)));
    const singleSize = uniqueSizes.length === 1 ? uniqueSizes[0] : null;

    const linesBySize = normalizedLines.reduce<Record<GroupExtraPrintSize, { quantity: number; unit_amount: number }>>(
      (acc, line) => {
        const current = acc[line.print_size];
        acc[line.print_size] = {
          quantity: current.quantity + line.quantity,
          unit_amount: line.unit_amount,
        };
        return acc;
      },
      {
        '10x15': { quantity: 0, unit_amount: printPrices['10x15'] },
        '15x21': { quantity: 0, unit_amount: printPrices['15x21'] },
      }
    );

    const metadataPayload = {
      kind: 'group_extra_prints' as const,
      version: 2,
      print_size: singleSize || undefined,
      print_size_label: singleSize ? GROUP_EXTRA_PRINT_SIZES[singleSize].label : undefined,
      unit_amount: singleSize ? printPrices[singleSize] : undefined,
      base_unit_amount: basePricePerPhoto,
      lines: normalizedLines,
    };

    const order = await prisma.photoOrder.create({
      data: {
        gallery_id: participant.gallery_id,
        participant_id: participant.id,
        photo_ids: JSON.stringify(expandedPhotoIds),
        product_ids: JSON.stringify(metadataPayload),
        photo_count: totalQuantity,
        total_amount: totalAmount,
        payment_status: 'pending',
      },
    });

    try {
      const ip = extractClientIpv4(
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      );
      const requestOrigin = new URL(request.url).origin;
      const continueUrl = `${requestOrigin}/galeria/grupowa?code=${encodeURIComponent(participant.gallery.group_access_code || '')}`;

      const payuProducts = (Object.entries(linesBySize) as Array<[GroupExtraPrintSize, { quantity: number; unit_amount: number }]>)
        .filter(([, entry]) => entry.quantity > 0)
        .map(([size, entry]) => ({
          name: `Dodatkowe odbitki ${GROUP_EXTRA_PRINT_SIZES[size].label}`,
          unitPrice: entry.unit_amount,
          quantity: entry.quantity,
        }));

      const payuResponse = await createPayUOrder({
        description: `Dodatkowe zdjęcia - ${participant.parent_name || participant.parent_identifier || participant.gallery.client_name}`,
        currencyCode: 'PLN',
        totalAmount,
        extOrderId: `GALLERY_${order.id}_${Date.now()}`,
        buyer: {
          email: participant.parent_email || participant.gallery.client_email,
          firstName: (participant.parent_name || participant.gallery.client_name || 'Rodzic').split(' ')[0] || 'Rodzic',
          lastName: (participant.parent_name || participant.gallery.client_name || '').split(' ').slice(1).join(' ') || 'Galeria',
          language: 'pl',
        },
        products: payuProducts,
        continueUrl,
      }, ip);

      const paymentUrl = payuResponse.redirectUri || payuResponse.links?.find((link: any) => link.rel === 'redirect_uri')?.href;
      const paymentId = payuResponse.orderId || payuResponse.orders?.[0]?.orderId || null;

      if (paymentUrl) {
        await prisma.photoOrder.update({
          where: { id: order.id },
          data: {
            payment_id: paymentId,
            payment_url: paymentUrl,
          },
        });
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          photo_count: order.photo_count,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          payment_url: paymentUrl || null,
          order_lines: normalizedLines,
        },
        paymentUrl: paymentUrl || null,
      });
    } catch (payuError: any) {
      console.error('PayU extra purchase error:', payuError);
      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          photo_count: order.photo_count,
          total_amount: order.total_amount,
          payment_status: 'failed_init',
        },
        message: 'Zamówienie utworzone, ale błąd inicjalizacji płatności (PayU).',
      });
    }
  } catch (error) {
    console.error('Extra purchase error:', error);
    return NextResponse.json({ error: 'Nie udało się utworzyć zamówienia' }, { status: 500 });
  }
}
