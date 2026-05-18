// API Route: /api/admin/galleries/[id]/print-summary
// Get comprehensive print order summary for admin
// Returns: each photo + which children/parents selected it
// Critical for admin to know what to print and for whom

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id } = await params;
      const galleryId = Number(id);

      if (isNaN(galleryId)) {
        return NextResponse.json(
          { error: 'Nieprawidłowe ID galerii' },
          { status: 400 }
        );
      }

      // Get gallery info
      const gallery = await prisma.clientGallery.findUnique({
        where: { id: galleryId },
        select: {
          id: true,
          client_name: true,
          gallery_mode: true,
          max_photos_for_print: true,
        },
      });

      if (!gallery) {
        return NextResponse.json(
          { error: 'Galeria nie istnieje' },
          { status: 404 }
        );
      }

      // Get all selections with full participant + photo data
      const selections = await prisma.photoSelection.findMany({
        where: {
          participant: { gallery_id: galleryId },
        },
        include: {
          participant: {
            select: {
              id: true,
              parent_identifier: true,
              avatar: true,
              parent_name: true,
              parent_email: true,
              parent_phone: true,
              name: true,
              publication_consent: true,
              consent_scope: true,
            },
          },
          photo: {
            select: {
              id: true,
              file_url: true,
              thumbnail_url: true,
              order_index: true,
            },
          },
        },
        orderBy: [
          { photo: { order_index: 'asc' } },
          { selected_at: 'asc' },
        ],
      });

      // Group by participant (rodzic → jego wybory)
      const byParticipant = new Map<number, any>();
      // Group by photo (zdjęcie → którzy je wybrali)
      const byPhoto = new Map<number, any>();

      for (const sel of selections) {
        // By participant
        if (!byParticipant.has(sel.participant.id)) {
          byParticipant.set(sel.participant.id, {
            participant_id: sel.participant.id,
            parent_identifier: sel.participant.parent_identifier,
            avatar: sel.participant.avatar,
            parent_name: sel.participant.parent_name,
            parent_email: sel.participant.parent_email,
            parent_phone: sel.participant.parent_phone,
            child_name: sel.participant.name,
            publication_consent: sel.participant.publication_consent,
            consent_scope: sel.participant.consent_scope,
            selections: [],
          });
        }
        byParticipant.get(sel.participant.id).selections.push({
          photo_id: sel.photo.id,
          file_url: sel.photo.file_url,
          thumbnail_url: sel.photo.thumbnail_url,
          selected_at: sel.selected_at,
        });

        // By photo
        if (!byPhoto.has(sel.photo.id)) {
          byPhoto.set(sel.photo.id, {
            photo_id: sel.photo.id,
            file_url: sel.photo.file_url,
            thumbnail_url: sel.photo.thumbnail_url,
            order_index: sel.photo.order_index,
            selected_by: [],
            total_orders: 0,
          });
        }
        const photoData = byPhoto.get(sel.photo.id);
        photoData.selected_by.push({
          participant_id: sel.participant.id,
          parent_identifier: sel.participant.parent_identifier,
          avatar: sel.participant.avatar,
          parent_name: sel.participant.parent_name,
          child_name: sel.participant.name,
        });
        photoData.total_orders++;
      }

      // Statistics
      const totalParticipants = byParticipant.size;
      const totalUniquePhotos = byPhoto.size;
      const totalSelections = selections.length;
      const participantsWithConsent = Array.from(byParticipant.values()).filter(p => p.publication_consent).length;

      return NextResponse.json({
        gallery: {
          id: gallery.id,
          name: gallery.client_name,
          mode: gallery.gallery_mode,
          max_photos_per_participant: gallery.max_photos_for_print,
        },
        statistics: {
          total_participants: totalParticipants,
          total_unique_photos: totalUniquePhotos,
          total_selections: totalSelections,
          participants_with_consent: participantsWithConsent,
        },
        by_participant: Array.from(byParticipant.values()).sort((a, b) => {
          return (a.parent_identifier || '').localeCompare(b.parent_identifier || '');
        }),
        by_photo: Array.from(byPhoto.values()).sort((a, b) => b.total_orders - a.total_orders),
      });

    } catch (error) {
      console.error('Print summary error:', error);
      return NextResponse.json(
        { error: 'Błąd generowania podsumowania' },
        { status: 500 }
      );
    }
  });
}
