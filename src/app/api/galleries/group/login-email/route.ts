import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateParentToken } from '@/lib/auth/parent-jwt';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

/**
 * POST /api/galleries/group/login-email
 * Login existing parent profile by email in a specific group gallery.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`group-login-email:${clientIp}`, 15, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
        { status: 429 }
      );
    }

    const { gallery_id, access_code, parent_email } = await request.json();

    if (!gallery_id || !access_code || !parent_email) {
      return NextResponse.json(
        { error: 'ID galerii, kod dostępu i email są wymagane' },
        { status: 400 }
      );
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

    const gallery = await prisma.clientGallery.findFirst({
      where: {
        id: galleryId,
        group_access_code: String(access_code).trim().toUpperCase(),
        gallery_mode: 'GROUP',
        is_active: true,
      },
      select: {
        id: true,
        expires_at: true,
      },
    });

    if (!gallery) {
      return NextResponse.json({ error: 'Nieprawidłowy kod dostępu' }, { status: 404 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    const participant = await prisma.galleryParticipant.findFirst({
      where: {
        gallery_id: galleryId,
        parent_email: { equals: normalizedEmail, mode: 'insensitive' },
      },
      select: {
        id: true,
        parent_identifier: true,
        parent_name: true,
        avatar: true,
        max_selections: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Nie znaleziono profilu rodzica dla tego emaila w tej galerii' },
        { status: 404 }
      );
    }

    const token = await generateParentToken({
      participant_id: participant.id,
      gallery_id: galleryId,
      parent_identifier: participant.parent_identifier || `P-${participant.id}`,
    });

    return NextResponse.json({
      participant_id: participant.id,
      parent_identifier: participant.parent_identifier,
      parent_name: participant.parent_name,
      avatar: participant.avatar,
      max_selections: participant.max_selections,
      token,
    });
  } catch (error) {
    console.error('Group email login error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas logowania po emailu' },
      { status: 500 }
    );
  }
}
