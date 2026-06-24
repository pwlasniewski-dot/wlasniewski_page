import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';

type OrderLine = {
  photo_id: number;
  print_size?: string;
  print_size_label?: string;
  quantity?: number;
  unit_amount?: number;
  line_total?: number;
  thumbnail_url?: string | null;
};

// GET /api/galleries/group/participant/[id]/orders
// Zwraca zamówienia dodatkowych odbitek danego rodzica (z miniaturami zdjęć),
// opcjonalnie pojedyncze zamówienie po ?order_id=N (do ekranu potwierdzenia po PayU).
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participantId = parseInt(params.id, 10);
    if (Number.isNaN(participantId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID uczestnika' }, { status: 400 });
    }

    const token = extractTokenFromHeader(request.headers.get('Authorization'));
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

    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      select: { id: true, gallery_id: true },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Uczestnik nie istnieje' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const orderIdParam = searchParams.get('order_id');
    const orderIdFilter = orderIdParam ? Number(orderIdParam) : null;

    const orders = await prisma.photoOrder.findMany({
      where: {
        gallery_id: participant.gallery_id,
        participant_id: participant.id,
        ...(orderIdFilter && Number.isInteger(orderIdFilter) ? { id: orderIdFilter } : {}),
      },
      orderBy: { created_at: 'desc' },
    });

    const allPhotoIds = new Set<number>();
    const parsed = orders.map((order) => {
      let meta: any = {};
      try {
        meta = order.product_ids ? JSON.parse(order.product_ids) : {};
      } catch {
        meta = {};
      }
      const lines: OrderLine[] = Array.isArray(meta?.lines) ? meta.lines : [];
      lines.forEach((line) => {
        const pid = Number(line?.photo_id);
        if (Number.isInteger(pid)) allPhotoIds.add(pid);
      });
      return { order, meta, lines };
    });

    const photos = allPhotoIds.size > 0
      ? await prisma.galleryPhoto.findMany({
          where: { id: { in: Array.from(allPhotoIds) } },
          select: { id: true, thumbnail_url: true, file_url: true },
        })
      : [];
    const photoMap = new Map(photos.map((p) => [p.id, p]));

    // Numer kadru = pozycja zdjęcia w galerii wg order_index (1-based), tak jak widzi je rodzic.
    const orderedPhotos = await prisma.galleryPhoto.findMany({
      where: { gallery_id: participant.gallery_id },
      orderBy: { order_index: 'asc' },
      select: { id: true },
    });
    const frameMap = new Map<number, number>();
    orderedPhotos.forEach((p, idx) => frameMap.set(p.id, idx + 1));

    const result = parsed.map(({ order, meta, lines }) => ({
      id: order.id,
      payment_status: order.payment_status,
      photo_count: order.photo_count,
      total_amount: order.total_amount,
      created_at: order.created_at,
      paid_at: order.paid_at,
      kind: meta?.kind || null,
      lines: lines.map((line) => {
        const pid = Number(line.photo_id);
        const photo = photoMap.get(pid);
        return {
          photo_id: pid,
          frame_number: frameMap.get(pid) ?? null,
          print_size: line.print_size || null,
          print_size_label: line.print_size_label || line.print_size || null,
          quantity: line.quantity || 1,
          unit_amount: line.unit_amount ?? null,
          line_total: line.line_total ?? null,
          thumbnail_url: photo?.thumbnail_url || photo?.file_url || null,
        };
      }),
    }));

    if (orderIdParam) {
      return NextResponse.json({ success: true, order: result[0] || null });
    }

    return NextResponse.json({ success: true, orders: result });
  } catch (error) {
    console.error('Get participant orders error:', error);
    return NextResponse.json({ error: 'Nie udało się pobrać zamówień' }, { status: 500 });
  }
}
