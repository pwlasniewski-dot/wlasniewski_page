import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/galleries/group/[galleryId]/photos
 * Get all photos from a GROUP mode gallery
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { galleryId: string } }
) {
  try {
    const galleryId = parseInt(params.galleryId);

    if (isNaN(galleryId)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe ID galerii' },
        { status: 400 }
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
