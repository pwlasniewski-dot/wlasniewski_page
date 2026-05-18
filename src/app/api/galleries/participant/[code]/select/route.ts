// API Route: POST /api/galleries/participant/[code]/select
// Select or deselect a photo for print

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const { photo_id, action } = await request.json(); // action: 'select' | 'deselect'

        if (!photo_id) {
            return NextResponse.json(
                { error: 'Photo ID jest wymagane' },
                { status: 400 }
            );
        }

        // Find participant
        const participant = await prisma.galleryParticipant.findUnique({
            where: { participant_code: code },
            include: {
                selections: true,
                gallery: {
                    select: {
                        id: true,
                        is_active: true,
                        expires_at: true,
                    }
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

        // Verify photo belongs to this gallery
        const photo = await prisma.galleryPhoto.findFirst({
            where: {
                id: photo_id,
                gallery_id: participant.gallery.id,
            }
        });

        if (!photo) {
            return NextResponse.json(
                { error: 'Zdjęcie nie znalezione w tej galerii' },
                { status: 404 }
            );
        }

        if (action === 'select') {
            // Check if max selections reached
            if (participant.selections.length >= participant.max_selections) {
                return NextResponse.json(
                    { error: `Osiągnięto maksymalny limit ${participant.max_selections} zdjęć` },
                    { status: 400 }
                );
            }

            // Check if already selected
            const existing = participant.selections.find(s => s.photo_id === photo_id);
            if (existing) {
                return NextResponse.json(
                    { error: 'Zdjęcie jest już zaznaczone' },
                    { status: 400 }
                );
            }

            // Create selection
            await prisma.photoSelection.create({
                data: {
                    participant_id: participant.id,
                    photo_id,
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Zdjęcie zaznaczone',
                selected_count: participant.selections.length + 1,
            });

        } else if (action === 'deselect') {
            // Remove selection
            await prisma.photoSelection.deleteMany({
                where: {
                    participant_id: participant.id,
                    photo_id,
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Zdjęcie odznaczone',
                selected_count: Math.max(0, participant.selections.length - 1),
            });

        } else {
            return NextResponse.json(
                { error: 'Nieprawidłowa akcja' },
                { status: 400 }
            );
        }

    } catch (error) {
        console.error('Error selecting/deselecting photo:', error);
        return NextResponse.json(
            { error: 'Błąd serwera' },
            { status: 500 }
        );
    }
}
