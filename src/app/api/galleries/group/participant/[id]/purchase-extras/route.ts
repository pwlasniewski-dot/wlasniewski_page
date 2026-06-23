import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';
import { createPayUOrder, extractClientIpv4 } from '@/lib/payu';

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
    const photoIds = Array.isArray(body?.photo_ids)
      ? body.photo_ids.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : [];

    if (photoIds.length === 0) {
      return NextResponse.json({ error: 'Brak wybranych zdjęć' }, { status: 400 });
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

    const photos = await prisma.galleryPhoto.findMany({
      where: {
        id: { in: photoIds },
        gallery_id: participant.gallery_id,
      },
      select: { id: true },
    });

    if (photos.length !== photoIds.length) {
      return NextResponse.json({ error: 'Niektóre zdjęcia nie należą do tej galerii' }, { status: 400 });
    }

    const pricePerPhoto = participant.gallery.price_per_premium || 2000;
    const totalAmount = pricePerPhoto * photoIds.length;

    const order = await prisma.photoOrder.create({
      data: {
        gallery_id: participant.gallery_id,
        participant_id: participant.id,
        photo_ids: JSON.stringify(photoIds),
        photo_count: photoIds.length,
        total_amount: totalAmount,
        payment_status: 'pending',
      },
    });

    try {
      const ip = extractClientIpv4(
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      );
      const continueUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/galeria/grupowa?code=${encodeURIComponent(participant.gallery.group_access_code || '')}`;

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
        products: [{
          name: `Dodatkowe zdjęcia (${photoIds.length} szt.)`,
          unitPrice: pricePerPhoto,
          quantity: photoIds.length,
        }],
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
