// API Route: GET/PUT /api/photo-challenge/admin/[id]
// Admin endpoint for managing challenges

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { withAuth } from '@/lib/auth/middleware';

const prisma = new PrismaClient();

// GET - Fetch challenge details with timeline
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const challengeId = Number(id);

            const challenge = await prisma.photoChallenge.findUnique({
                where: { id: challengeId },
                include: {
                    package: true,
                    location: true,
                    invitee_user: true,
                    timeline: {
                        orderBy: { created_at: 'asc' },
                    },
                },
            });

            if (!challenge) {
                return NextResponse.json(
                    { success: false, error: 'Wyzwanie nie znalezione' },
                    { status: 404 }
                );
            }

            // Parse JSON fields
            const responseChallenge = {
                ...challenge,
                package: {
                    ...challenge.package,
                    included_items: challenge.package.included_items
                        ? JSON.parse(challenge.package.included_items)
                        : [],
                },
                preferred_dates: challenge.preferred_dates
                    ? JSON.parse(challenge.preferred_dates)
                    : [],
            };

            return NextResponse.json({
                success: true,
                challenge: responseChallenge,
            });
        } catch (error) {
            console.error('Error fetching challenge:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się pobrać wyzwania' },
                { status: 500 }
            );
        }
    });
}

// PUT - Update challenge
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const { id } = await params;
            const challengeId = Number(id);
            const body = await request.json();
            const { status, session_date, admin_notes } = body;

            const updateData: any = {};

            if (status) updateData.status = status;
            if (session_date) updateData.session_date = new Date(session_date);
            if (admin_notes !== undefined) updateData.admin_notes = admin_notes;

            if (Object.keys(updateData).length > 0) {
                await prisma.$transaction(async (tx) => {
                    // Get challenge details for booking creation
                    const challenge = await tx.photoChallenge.findUnique({
                        where: { id: challengeId },
                        include: {
                            package: true,
                            location: true,
                        },
                    });

                    if (!challenge) {
                        throw new Error('Challenge not found');
                    }

                    // Update challenge
                    await tx.photoChallenge.update({
                        where: { id: challengeId },
                        data: updateData,
                    });

                    // Create timeline event
                    if (status) {
                        await tx.challengeTimelineEvent.create({
                            data: {
                                challenge_id: challengeId,
                                event_type: `status_${status}`,
                                event_description: `Status zmieniony przez admina na: ${status}`,
                            },
                        });
                    }

                    // Create booking if session_date is set and status is scheduled
                    if (session_date && status === 'scheduled') {
                        const sessionDateTime = new Date(session_date);

                        // Check if booking already exists for this challenge
                        const existingBooking = await tx.booking.findFirst({
                            where: { challenge_id: challengeId }
                        });

                        if (!existingBooking) {
                            await tx.booking.create({
                                data: {
                                    service: 'Sesja zdjęciowa',
                                    package: challenge.package.name,
                                    price: challenge.package.challenge_price,
                                    date: sessionDateTime,
                                    start_time: sessionDateTime.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
                                    end_time: null,
                                    client_name: `${challenge.inviter_name} & ${challenge.invitee_name}`,
                                    email: challenge.inviter_contact_type === 'email' ? challenge.inviter_contact : '',
                                    phone: challenge.inviter_contact_type === 'phone' ? challenge.inviter_contact : challenge.invitee_contact_type === 'phone' ? challenge.invitee_contact : null,
                                    venue_city: challenge.location?.name || null,
                                    venue_place: challenge.custom_location || challenge.location?.name || null,
                                    notes: `📸 Foto Wyzwanie #${challengeId}\nRabat: ${challenge.discount_amount} zł (${challenge.discount_percentage}%)`,
                                    challenge_id: challengeId,
                                    status: 'confirmed',
                                },
                            });

                            await tx.challengeTimelineEvent.create({
                                data: {
                                    challenge_id: challengeId,
                                    event_type: 'booking_created',
                                    event_description: 'Automatycznie utworzono rezerwację w systemie',
                                },
                            });
                        }
                    }
                });
            }

            return NextResponse.json({
                success: true,
                message: 'Wyzwanie zaktualizowane',
            });
        } catch (error) {
            console.error('Error updating challenge:', error);
            return NextResponse.json(
                { success: false, error: 'Nie udało się zaktualizować wyzwania' },
                { status: 500 }
            );
        }
    });
}
