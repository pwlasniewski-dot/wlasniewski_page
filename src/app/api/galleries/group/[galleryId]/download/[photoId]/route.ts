// API Route: GET /api/galleries/group/[galleryId]/download/[photoId]
// Parent: pobiera pojedyncze zdjęcie z galerii grupowej (pełna rozdzielczość)
// REQUIRES: Valid parent JWT token

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string; photoId: string }> }
) {
  try {
    const { galleryId: gIdRaw, photoId: pIdRaw } = await params;
    const galleryId = parseInt(gIdRaw);
    const photoId = parseInt(pIdRaw);

    if (isNaN(galleryId) || isNaN(photoId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const payload = await verifyParentToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Nieprawidłowy token' }, { status: 401 });
    }

    if (payload.gallery_id !== galleryId) {
      return NextResponse.json({ error: 'Brak dostępu' }, { status: 403 });
    }

    const gallery = await prisma.clientGallery.findFirst({
      where: { id: galleryId, gallery_mode: 'GROUP', is_active: true },
      select: { id: true, expires_at: true },
    });

    if (!gallery) {
      return NextResponse.json({ error: 'Galeria niedostępna' }, { status: 403 });
    }

    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }

    const photo = await prisma.galleryPhoto.findFirst({
      where: { id: photoId, gallery_id: galleryId },
      select: { id: true, file_url: true },
    });

    if (!photo) {
      return NextResponse.json({ error: 'Zdjęcie nie istnieje' }, { status: 404 });
    }

    const s3Response = await fetch(photo.file_url);
    if (!s3Response.ok || !s3Response.body) {
      return NextResponse.json({ error: 'Nie udało się pobrać pliku' }, { status: 502 });
    }

    const ext = (photo.file_url.split('.').pop() || 'jpg').split('?')[0].toLowerCase();
    const filename = `zdjecie-${photo.id}.${ext}`;

    return new Response(s3Response.body, {
      headers: {
        'Content-Type': s3Response.headers.get('Content-Type') || 'image/jpeg',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Parent download photo error:', error);
    return NextResponse.json({ error: 'Błąd pobierania' }, { status: 500 });
  }
}
