// API Route: /api/admin/galleries/[id]/participants/[participantId]/selections
// Get all selected photos for a specific participant (admin view)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id, participantId } = await params;
      const galleryId = Number(id);
      const pId = Number(participantId);

      if (isNaN(galleryId) || isNaN(pId)) {
        return NextResponse.json(
          { error: 'Nieprawidłowe ID' },
          { status: 400 }
        );
      }

      // Verify participant belongs to gallery
      const participant = await prisma.galleryParticipant.findFirst({
        where: {
          id: pId,
          gallery_id: galleryId,
        },
        include: {
          selections: {
            include: {
              photo: {
                select: {
                  id: true,
                  file_url: true,
                  thumbnail_url: true,
                  width: true,
                  height: true,
                  order_index: true,
                },
              },
            },
            orderBy: { selected_at: 'asc' },
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
        participant: {
          id: participant.id,
          parent_identifier: participant.parent_identifier,
          parent_name: participant.parent_name,
          parent_email: participant.parent_email,
          parent_phone: participant.parent_phone,
          child_name: participant.name, // Imię dziecka (przechowywane w polu name)
          max_selections: participant.max_selections,
          publication_consent: participant.publication_consent,
          consent_scope: participant.consent_scope,
          consent_given_at: participant.consent_given_at,
          first_login_at: participant.first_login_at,
        },
        selections: participant.selections.map(s => ({
          selection_id: s.id,
          photo_id: s.photo.id,
          file_url: s.photo.file_url,
          thumbnail_url: s.photo.thumbnail_url,
          width: s.photo.width,
          height: s.photo.height,
          selected_at: s.selected_at,
        })),
        total_selected: participant.selections.length,
      });

    } catch (error) {
      console.error('Get participant selections error:', error);
      return NextResponse.json(
        { error: 'Błąd pobierania wyborów' },
        { status: 500 }
      );
    }
  });
}
