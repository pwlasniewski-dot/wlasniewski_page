import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

/**
 * POST /api/galleries/group/participant/[id]/select
 * Toggle photo selection for a participant
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participantId = parseInt(params.id);
    const { photo_id } = await request.json();

    if (isNaN(participantId) || !photo_id) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane' },
        { status: 400 }
      );
    }

    // Get participant info
    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      include: {
        selections: true,
        gallery: {
          select: {
            gallery_mode: true,
            is_active: true,
          },
        },
      },
    });

    if (!participant || participant.gallery.gallery_mode !== 'GROUP') {
      return NextResponse.json(
        { error: 'Uczestnik nie istnieje' },
        { status: 404 }
      );
    }

    if (!participant.gallery.is_active) {
      return NextResponse.json(
        { error: 'Galeria jest nieaktywna' },
        { status: 403 }
      );
    }

    // Check if photo already selected
    const existingSelection = await prisma.photoSelection.findUnique({
      where: {
        participant_id_photo_id: {
          participant_id: participantId,
          photo_id: photo_id,
        },
      },
    });

    if (existingSelection) {
      // Remove selection (toggle off)
      await prisma.photoSelection.delete({
        where: { id: existingSelection.id },
      });

      return NextResponse.json({
        action: 'removed',
        selected_count: participant.selections.length - 1,
        max_selections: participant.max_selections,
      });
    } else {
      // Check selection limit
      if (participant.selections.length >= participant.max_selections) {
        return NextResponse.json(
          { 
            error: `Możesz wybrać maksymalnie ${participant.max_selections} zdjęć`,
            max_selections: participant.max_selections,
            current_count: participant.selections.length,
          },
          { status: 400 }
        );
      }

      // Add selection
      await prisma.photoSelection.create({
        data: {
          participant_id: participantId,
          photo_id: photo_id,
        },
      });

      return NextResponse.json({
        action: 'added',
        selected_count: participant.selections.length + 1,
        max_selections: participant.max_selections,
      });
    }

  } catch (error) {
    console.error('Select photo error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas zapisywania wyboru' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/galleries/group/participant/[id]/select
 * Get all selected photos for a participant
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const participantId = parseInt(params.id);

    if (isNaN(participantId)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe ID uczestnika' },
        { status: 400 }
      );
    }

    const participant = await prisma.galleryParticipant.findUnique({
      where: { id: participantId },
      include: {
        selections: {
          include: {
            photo: {
              select: {
                id: true,
                file_url: true,
                thumbnail_url: true,
              },
            },
          },
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Uczestnik nie istnieje' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      selected_photos: participant.selections.map(s => ({
        photo_id: s.photo_id,
        file_url: s.photo.file_url,
        thumbnail_url: s.photo.thumbnail_url,
        selected_at: s.selected_at,
      })),
      selected_count: participant.selections.length,
      max_selections: participant.max_selections,
      publication_consent: participant.publication_consent,
      consent_scope: participant.consent_scope,
    });

  } catch (error) {
    console.error('Get selections error:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas pobierania wyborów' },
      { status: 500 }
    );
  }
}
