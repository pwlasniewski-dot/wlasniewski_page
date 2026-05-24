import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateParentToken } from '@/lib/auth/parent-jwt';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

/**
 * POST /api/galleries/group/login
 * Login existing parent profile from another device.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`group-login:${clientIp}`, 15, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.' },
        { status: 429 }
      );
    }

    const { gallery_id, access_code, parent_identifier, parent_name } = await request.json();

    if (!gallery_id || !access_code || !parent_identifier || !parent_name) {
      return NextResponse.json(
        { error: 'ID galerii, kod, ID rodzica i imię i nazwisko są wymagane' },
        { status: 400 }
      );
    }

    const galleryId = Number(gallery_id);
    if (!Number.isFinite(galleryId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID galerii' }, { status: 400 });
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
        parent_identifier: String(parent_identifier).trim().toUpperCase(),
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
        { error: 'Nie znaleziono rodzica o podanym ID w tej galerii' },
        { status: 404 }
      );
    }

    const providedName = String(parent_name).trim().toLowerCase();
    const savedName = String(participant.parent_name || '').trim().toLowerCase();
    if (!savedName || providedName !== savedName) {
      return NextResponse.json(
        { error: 'Imię i nazwisko nie zgadza się z tym profilem rodzica' },
        { status: 401 }
      );
    }

    const token = await generateParentToken({
      participant_id: participant.id,
      gallery_id: galleryId,
      parent_identifier: participant.parent_identifier,
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
    console.error('Group existing parent login error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas logowania do istniejącego profilu' },
      { status: 500 }
    );
  }
}
