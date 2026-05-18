// API Route: POST /api/galleries/participant/[code]/consent
// Submit publication consent for selected photos (electronic signature with parent data)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ code: string }> }
) {
    try {
        const { code } = await params;
        const { consent } = await request.json(); // Boolean

        if (typeof consent !== 'boolean') {
            return NextResponse.json(
                { error: 'Zgoda musi być wartością true/false' },
                { status: 400 }
            );
        }

        // Find participant
        const participant = await prisma.galleryParticipant.findUnique({
            where: { participant_code: code }
        });

        if (!participant) {
            return NextResponse.json(
                { error: 'Nieprawidłowy kod dostępu' },
                { status: 404 }
            );
        }

        // Verify parent data exists (required for consent)
        if (consent && !participant.parent_name) {
            return NextResponse.json(
                { error: 'Dane rodzica są wymagane przed wyrażeniem zgody' },
                { status: 400 }
            );
        }

        // Update consent
        await prisma.galleryParticipant.update({
            where: { participant_code: code },
            data: {
                publication_consent: consent,
                consent_given_at: consent ? new Date() : null,
            }
        });

        return NextResponse.json({
            success: true,
            message: consent 
                ? `Zgoda na publikację została zapisana. Wyrażona przez: ${participant.parent_name}` 
                : 'Zgoda na publikację została cofnięta',
            publication_consent: consent,
            consent_given_by: participant.parent_name,
            consent_given_at: consent ? new Date().toISOString() : null,
        });

    } catch (error) {
        console.error('Error updating consent:', error);
        return NextResponse.json(
            { error: 'Błąd serwera' },
            { status: 500 }
        );
    }
}
