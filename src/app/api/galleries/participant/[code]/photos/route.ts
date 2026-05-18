// API Route: GET /api/galleries/participant/[code]/photos
// Get all photos for a participant (parent can download all, but must select max X for print)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;

        // Find participant
        const participant = await prisma.galleryParticipant.findUnique({
            where: { participant_code: code },
            include: {
                gallery: {
                    include: {
                        photos: {
                            orderBy: { order_index: 'asc' }
                        }
                    }
                },
                selections: {
                    select: { photo_id: true }
                }
            }
        });

        if (!participant) {
            return NextResponse.json(
                { error: 'Nieprawidłowy kod dostępu' },
                { status: 404 }
            );
        }

        // Check gallery status
        if (!participant.gallery.is_active) {
            return NextResponse.json(
                { error: 'Galeria jest nieaktywna' },
                { status: 403 }
            );
        }

        if (participant.gallery.expires_at && new Date(participant.gallery.expires_at) < new Date()) {
            return NextResponse.json(
                { error: 'Galeria wygasła' },
                { status: 403 }
            );
        }

        const selectedPhotoIds = participant.selections.map(s => s.photo_id);

        return NextResponse.json({
            success: true,
            participant: {
                name: participant.name,
                max_selections: participant.max_selections,
                selected_count: selectedPhotoIds.length,
                publication_consent: participant.publication_consent,
            },
            photos: participant.gallery.photos.map(photo => ({
                id: photo.id,
                file_url: photo.file_url,
                thumbnail_url: photo.thumbnail_url,
                width: photo.width,
                height: photo.height,
                is_selected: selectedPhotoIds.includes(photo.id),
            })),
            gallery: {
                name: participant.gallery.client_name,
                description: participant.gallery.description,
            }
        });

    } catch (error) {
        console.error('Error fetching participant photos:', error);
        return NextResponse.json(
            { error: 'Błąd serwera' },
            { status: 500 }
        );
    }
}
