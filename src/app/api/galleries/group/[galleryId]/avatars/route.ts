// API Route: /api/galleries/group/[galleryId]/avatars
// Returns list of available (unused) avatars for a gallery
// Public endpoint - parent needs this before registration

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { AVAILABLE_AVATARS } from '@/lib/gallery/avatars';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ galleryId: string }> }
) {
  try {
    const { galleryId: galleryIdParam } = await params;
    const galleryId = parseInt(galleryIdParam);

    if (isNaN(galleryId)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe ID galerii' },
        { status: 400 }
      );
    }

    // Verify gallery exists and is GROUP mode
    const gallery = await prisma.clientGallery.findFirst({
      where: {
        id: galleryId,
        gallery_mode: 'GROUP',
        is_active: true,
      },
      select: { id: true },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Galeria nie istnieje' },
        { status: 404 }
      );
    }

    // Get list of already-used avatars in this gallery
    const usedParticipants = await prisma.galleryParticipant.findMany({
      where: {
        gallery_id: galleryId,
        avatar: { not: null },
      },
      select: { avatar: true },
    });

    const usedAvatars = new Set(usedParticipants.map(p => p.avatar));

    // Return all avatars with availability flag
    return NextResponse.json({
      avatars: AVAILABLE_AVATARS.map(emoji => ({
        emoji,
        available: !usedAvatars.has(emoji),
      })),
      total: AVAILABLE_AVATARS.length,
      available_count: AVAILABLE_AVATARS.length - usedAvatars.size,
    });

  } catch (error) {
    console.error('Get avatars error:', error);
    return NextResponse.json(
      { error: 'Błąd pobierania awatarów' },
      { status: 500 }
    );
  }
}
