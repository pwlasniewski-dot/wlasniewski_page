// API Route: GET /api/admin/galleries/[id]/selections-summary
// Get summary of all participant selections for admin view

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

            // Fetch all participants with their selections
            const participants = await prisma.galleryParticipant.findMany({
                where: { gallery_id: galleryId },
                include: {
                    selections: {
                        include: {
                            photo: {
                                select: {
                                    id: true,
                                    thumbnail_url: true,
                                    file_url: true,
                                }
                            }
                        },
                        orderBy: { selected_at: 'asc' }
                    }
                },
                orderBy: { name: 'asc' }
            });

            // Calculate stats
            const totalParticipants = participants.length;
            const participantsWithSelections = participants.filter(p => p.selections.length > 0).length;
            const participantsWithConsent = participants.filter(p => p.publication_consent).length;
            const totalSelections = participants.reduce((sum, p) => sum + p.selections.length, 0);

            // Photo selection frequency (which photos are most selected)
            const photoSelectionCount: Record<number, number> = {};
            participants.forEach(p => {
                p.selections.forEach(s => {
                    photoSelectionCount[s.photo_id] = (photoSelectionCount[s.photo_id] || 0) + 1;
                });
            });

            return NextResponse.json({
                success: true,
                summary: {
                    total_participants: totalParticipants,
                    participants_with_selections: participantsWithSelections,
                    participants_with_consent: participantsWithConsent,
                    total_selections: totalSelections,
                    completion_rate: totalParticipants > 0 
                        ? Math.round((participantsWithSelections / totalParticipants) * 100) 
                        : 0,
                },
                participants: participants.map(p => ({
                    id: p.id,
                    name: p.name,
                    participant_code: p.participant_code,
                    max_selections: p.max_selections,
                    selected_count: p.selections.length,
                    publication_consent: p.publication_consent,
                    consent_given_at: p.consent_given_at,
                    selections: p.selections.map(s => ({
                        photo_id: s.photo_id,
                        thumbnail_url: s.photo.thumbnail_url,
                        file_url: s.photo.file_url,
                        selected_at: s.selected_at,
                    }))
                })),
                photo_selection_frequency: photoSelectionCount,
            });

        } catch (error) {
            console.error('Error fetching selections summary:', error);
            return NextResponse.json(
                { error: 'Błąd pobierania podsumowania' },
                { status: 500 }
            );
        }
    });
}
