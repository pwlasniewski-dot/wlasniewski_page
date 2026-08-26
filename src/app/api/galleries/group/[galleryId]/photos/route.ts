import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyParentToken, extractTokenFromHeader } from '@/lib/auth/parent-jwt';

/**
 * GET /api/galleries/group/[galleryId]/photos
 * Get all photos from a GROUP mode gallery
 * REQUIRES: Valid parent JWT token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId: galleryIdStr } = await params;
    const galleryId = parseInt(galleryIdStr);

    if (isNaN(galleryId)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe ID galerii' },
        { status: 400 }
      );
    }

    // SECURITY: Verify parent JWT token
    const authHeader = request.headers.get('Authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Brak autoryzacji' },
        { status: 401 }
      );
    }

    const payload = await verifyParentToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Nieprawidłowy token autoryzacyjny' },
        { status: 401 }
      );
    }

    // SECURITY: Verify token gallery_id matches requested gallery_id
    if (payload.gallery_id !== galleryId) {
      return NextResponse.json(
        { error: 'Brak dostępu do tej galerii' },
        { status: 403 }
      );
    }

    // Verify gallery exists and is in GROUP mode
    const gallery = await prisma.clientGallery.findFirst({
      where: {
        id: galleryId,
        gallery_mode: 'GROUP',
        is_active: true,
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galeria nie istnieje lub nie jest dostępna' },
        { status: 404 }
      );
    }
    if (gallery.expires_at && gallery.expires_at <= new Date()) {
      return NextResponse.json({ error: 'Galeria wygasła' }, { status: 403 });
    }
    if (payload.participant_id > 0) {
      const participant = await prisma.galleryParticipant.findFirst({
        where: {
          id: payload.participant_id,
          gallery_id: galleryId,
          parent_identifier: payload.parent_identifier,
        },
        select: { id: true },
      });
      if (!participant) {
        return NextResponse.json({ error: 'Sesja profilu nie jest już aktywna' }, { status: 403 });
      }
    }

    // Get all photos
    const photos = await prisma.galleryPhoto.findMany({
      where: {
        gallery_id: galleryId,
      },
      orderBy: {
        order_index: 'asc',
      },
      select: {
        id: true,
        file_url: true,
        thumbnail_url: true,
        width: true,
        height: true,
        order_index: true,
      },
    });

    return NextResponse.json({
      gallery_id: galleryId,
      gallery_name: gallery.client_name,
      photos: photos,
      total_photos: photos.length,
    });

  } catch (error) {
    console.error('Get group photos error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania zdjęć' },
      { status: 500 }
    );
  }
}
