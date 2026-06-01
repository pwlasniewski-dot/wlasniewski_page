// API Route: /api/admin/galleries/[id]/participants
// Manage gallery participants (for group galleries like communion)

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import crypto from 'crypto';

// Generate unique participant code
function generateParticipantCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-character code (e.g., "A3F7B2E9")
}

// GET: Fetch all participants for a gallery
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);

            const participants = await prisma.galleryParticipant.findMany({
                where: { gallery_id: galleryId },
                include: {
                    _count: {
                        select: { selections: true }
                    }
                },
                orderBy: { created_at: 'asc' }
            });

            return NextResponse.json({
                success: true,
                participants: participants.map(p => ({
                    id: p.id,
                    name: p.name,
                    participant_code: p.participant_code,
                    parent_identifier: p.parent_identifier,
                    parent_name: p.parent_name,
                    parent_email: p.parent_email,
                    parent_phone: p.parent_phone,
                    avatar: p.avatar,
                    max_selections: p.max_selections,
                    selections_count: p._count.selections,
                    publication_consent: p.publication_consent,
                    consent_scope: p.consent_scope,
                    consent_given_at: p.consent_given_at,
                    notes: p.notes,
                    created_at: p.created_at,
                }))
            });

        } catch (error) {
            console.error('Error fetching participants:', error);
            return NextResponse.json(
                { error: 'Błąd pobierania uczestników' },
                { status: 500 }
            );
        }
    });
}

// POST: Add new participant
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const galleryId = Number(id);
            const { name, max_selections, notes } = await request.json();

            if (!name) {
                return NextResponse.json(
                    { error: 'Nazwa uczestnika jest wymagana' },
                    { status: 400 }
                );
            }

            // Generate unique code
            let participantCode: string;
            let codeExists = true;
            
            while (codeExists) {
                participantCode = generateParticipantCode();
                const existing = await prisma.galleryParticipant.findUnique({
                    where: { participant_code: participantCode }
                });
                codeExists = !!existing;
            }

            const participant = await prisma.galleryParticipant.create({
                data: {
                    gallery_id: galleryId,
                    name,
                    participant_code: participantCode!,
                    max_selections: max_selections || 5,
                    notes: notes || null,
                }
            });

            return NextResponse.json({
                success: true,
                message: 'Uczestnik dodany',
                participant: {
                    id: participant.id,
                    name: participant.name,
                    participant_code: participant.participant_code,
                    max_selections: participant.max_selections,
                    notes: participant.notes,
                }
            });

        } catch (error) {
            console.error('Error creating participant:', error);
            return NextResponse.json(
                { error: 'Błąd dodawania uczestnika' },
                { status: 500 }
            );
        }
    });
}
