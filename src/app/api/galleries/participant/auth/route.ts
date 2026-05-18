// API Route: POST /api/galleries/participant/auth
// Verify participant access code and optionally save parent data on first login

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
    try {
        const { code, parent_name, parent_email, parent_phone } = await request.json();

        if (!code) {
            return NextResponse.json(
                { error: 'Kod dostępu jest wymagany' },
                { status: 400 }
            );
        }

        // Find participant by code
        const participant = await prisma.galleryParticipant.findUnique({
            where: { participant_code: code },
            include: {
                gallery: {
                    select: {
                        id: true,
                        client_name: true,
                        description: true,
                        is_active: true,
                        expires_at: true,
                    }
                },
                selections: {
                    select: {
                        photo_id: true,
                        selected_at: true,
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

        // Check if gallery is active
        if (!participant.gallery.is_active) {
            return NextResponse.json(
                { error: 'Galeria jest nieaktywna' },
                { status: 403 }
            );
        }

        // Check if expired
        if (participant.gallery.expires_at && new Date(participant.gallery.expires_at) < new Date()) {
            return NextResponse.json(
                { error: 'Galeria wygasła' },
                { status: 403 }
            );
        }

        // If parent data provided (first login), save it
        if (parent_name && !participant.parent_name) {
            await prisma.galleryParticipant.update({
                where: { id: participant.id },
                data: {
                    parent_name,
                    parent_email: parent_email || null,
                    parent_phone: parent_phone || null,
                    first_login_at: new Date(),
                }
            });
        }

        return NextResponse.json({
            success: true,
            participant: {
                id: participant.id,
                name: participant.name,
                max_selections: participant.max_selections,
                publication_consent: participant.publication_consent,
                gallery_name: participant.gallery.client_name,
                gallery_description: participant.gallery.description,
                selected_count: participant.selections.length,
                selected_photo_ids: participant.selections.map(s => s.photo_id),
                needs_parent_data: !participant.parent_name, // Frontend should ask for parent data
                parent_name: participant.parent_name,
            }
        });

    } catch (error) {
        console.error('Error authenticating participant:', error);
        return NextResponse.json(
            { error: 'Błąd serwera' },
            { status: 500 }
        );
    }
}
