import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';
import { sendEmail } from '@/lib/email/sender';

/**
 * POST /api/galleries/group/remind-identifier
 * Sends parent identifier reminder email for a group gallery.
 * Always returns generic success for privacy (prevents account enumeration).
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`group-remind-id:${clientIp}`, 8, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób. Spróbuj ponownie za 15 minut.' },
        { status: 429 }
      );
    }

    const { gallery_id, access_code, parent_email } = await request.json();

    if (!gallery_id || !access_code || !parent_email) {
      return NextResponse.json({ error: 'Brak wymaganych danych' }, { status: 400 });
    }

    const galleryId = Number(gallery_id);
    if (!Number.isFinite(galleryId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
    }

    const normalizedEmail = String(parent_email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Nieprawidłowy format email' }, { status: 400 });
    }

    const normalizedCode = String(access_code).trim().toUpperCase();

    const gallery = await prisma.clientGallery.findUnique({
      where: {
        group_access_code: normalizedCode,
      },
      select: {
        id: true,
        client_name: true,
        expires_at: true,
        gallery_mode: true,
        is_active: true,
      },
    });

    if (!gallery || gallery.id !== galleryId || gallery.gallery_mode !== 'GROUP' || !gallery.is_active) {
      return NextResponse.json({ error: 'Nieprawidłowy kod dostępu' }, { status: 404 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    let participant = await prisma.galleryParticipant.findFirst({
      where: {
        gallery_id: galleryId,
        parent_email: normalizedEmail,
      },
      select: {
        parent_name: true,
        parent_identifier: true,
      },
    });

    if (!participant) {
      participant = await prisma.galleryParticipant.findFirst({
        where: {
          gallery_id: galleryId,
          parent_email: { equals: normalizedEmail, mode: 'insensitive' },
        },
        select: {
          parent_name: true,
          parent_identifier: true,
        },
      });
    }

    if (participant?.parent_identifier) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wlasniewski.pl';
      const galleryUrl = `${appUrl}/galeria/grupowa?code=${encodeURIComponent(String(access_code).trim().toUpperCase())}`;

      await sendEmail({
        to: normalizedEmail,
        subject: `Przypomnienie identyfikatora do galerii grupowej`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111;max-width:640px;margin:0 auto;padding:24px;">
            <h2 style="margin:0 0 12px;">Przypomnienie identyfikatora rodzica</h2>
            <p>Cześć ${participant.parent_name || 'Rodzicu'},</p>
            <p>to jest Twój identyfikator w galerii grupowej:</p>
            <div style="background:#f5f5f5;border:1px solid #e5e5e5;border-radius:10px;padding:14px 16px;margin:16px 0;">
              <p style="margin:0;font-size:22px;letter-spacing:1px;"><strong>${participant.parent_identifier}</strong></p>
            </div>
            <p>Możesz logować się po emailu albo po tym identyfikatorze.</p>
            <p><a href="${galleryUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;">Przejdź do galerii</a></p>
          </div>
        `,
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, message: 'Jeśli email istnieje, przypomnienie zostało wysłane.' });
  } catch (error) {
    console.error('Group remind identifier error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas wysyłania przypomnienia' },
      { status: 500 }
    );
  }
}
