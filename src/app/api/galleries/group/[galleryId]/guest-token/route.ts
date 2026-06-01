// POST /api/galleries/group/[galleryId]/guest-token
// Returns a read-only JWT for anonymous gallery browsing (no account created).
// Requires valid access_code (and password if gallery has one).

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateParentToken } from '@/lib/auth/parent-jwt';
import { checkRateLimit, getClientIp } from '@/lib/auth/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`guest-token:${clientIp}`, 20, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Zbyt wiele prób. Spróbuj za 15 minut.' }, { status: 429 });
    }

    const { galleryId: gIdRaw } = await params;
    const galleryId = parseInt(gIdRaw);
    if (isNaN(galleryId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
    }

    const { access_code, password } = await request.json();
    if (!access_code) {
      return NextResponse.json({ error: 'Kod dostępu jest wymagany' }, { status: 400 });
    }

    const normalizedCode = String(access_code).trim().toUpperCase();

    const gallery = await prisma.clientGallery.findUnique({
      where: { group_access_code: normalizedCode },
      select: {
        id: true,
        gallery_mode: true,
        is_active: true,
        expires_at: true,
        group_password: true,
      },
    });

    if (!gallery || gallery.id !== galleryId || gallery.gallery_mode !== 'GROUP' || !gallery.is_active) {
      return NextResponse.json({ error: 'Nieprawidłowy kod dostępu' }, { status: 404 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    if (gallery.group_password) {
      if (!password) {
        return NextResponse.json({ error: 'Hasło jest wymagane' }, { status: 401 });
      }
      if (String(password).trim().toLowerCase() !== gallery.group_password.toLowerCase()) {
        return NextResponse.json({ error: 'Nieprawidłowe hasło' }, { status: 401 });
      }
    }

    // participant_id = 0 signals guest mode — no real participant row
    const token = await generateParentToken({
      participant_id: 0,
      gallery_id: galleryId,
      parent_identifier: 'GUEST',
    });

    return NextResponse.json({ token, guest: true });
  } catch (error) {
    console.error('Guest token error:', error);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
