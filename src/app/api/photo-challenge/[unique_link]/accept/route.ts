import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { sendEmail } from '@/lib/email/sender';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;
        const body = await request.json();
        const { name, date, hour } = body;

        if (!date || hour === null) {
            return NextResponse.json(
                { success: false, error: 'Missing date or hour' },
                { status: 400 }
            );
        }

        // Fetch challenge
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: { package: true, location: true }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Check if a booking already exists for this challenge
        const existingBooking = await prisma.booking.findFirst({
            where: { challenge_id: challenge.id }
        });

        const startTimeText = `${String(hour).padStart(2, '0')}:00`;
        const endTimeText = `${String(hour + 1).padStart(2, '0')}:00`;
        const sessionDate = new Date(`${date}T00:00:00.000Z`);

        let booking;
        if (existingBooking) {
            // Update existing booking
            booking = await prisma.booking.update({
                where: { id: existingBooking.id },
                data: {
                    date: sessionDate,
                    start_time: startTimeText,
                    end_time: endTimeText,
                    client_name: name,
                    status: 'confirmed'
                }
            });
        } else {
            // Create new booking (fallback)
            booking = await prisma.booking.create({
                data: {
                    service: 'Foto-wyzwanie',
                    package: challenge.package?.name || 'Challenge',
                    price: challenge.package?.challenge_price || 0,
                    date: sessionDate,
                    start_time: startTimeText,
                    end_time: endTimeText,
                    client_name: name,
                    email: challenge.invitee_contact,
                    phone: challenge.inviter_contact, // Use inviter phone for contact
                    status: 'confirmed',
                    challenge_id: challenge.id
                }
            });
        }

        // Create or find ChallengeUser for the invitee
        let userId = challenge.invitee_user_id;
        if (!userId) {
            const user = await prisma.challengeUser.upsert({
                where: { email: challenge.invitee_contact },
                update: { name: name },
                create: {
                    email: challenge.invitee_contact,
                    name: name,
                    phone: challenge.inviter_contact // Default to inviter contact for safety, or leave null
                }
            });
            userId = user.id;
        }

        // Update challenge status and link user
        await prisma.photoChallenge.update({
            where: { unique_link },
            data: {
                status: 'accepted',
                accepted_at: new Date(),
                session_date: sessionDate,
                invitee_user_id: userId
            } as any
        });

        // Send confirmation email to invitee
        // Send confirmation e-mails
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const galleryLink = `${baseUrl}/foto-wyzwanie/gallery/${challenge.id}`;
        const formattedDate = sessionDate.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const locationName = challenge.location?.name || challenge.custom_location || 'Będzie podane wkrótce';

        // 1. Notify Invitee (the one who just accepted)
        try {
            await sendEmail({
                to: challenge.invitee_contact, // Assuming email is in contact
                subject: '✅ Wyzwanie zaakceptowane! Szczegóły sesji',
                template: 'challenge-accepted-invitee',
                data: {
                    inviteeName: name,
                    inviterName: challenge.inviter_name,
                    sessionDate: formattedDate,
                    sessionTime: startTimeText,
                    location: locationName,
                    galleryLink
                }
            });
        } catch (emailError) {
            console.error('Failed to send acceptance email to invitee:', emailError);
        }

        // 2. Notify Inviter
        if (challenge.inviter_email) {
            try {
                const isDifferentDate = existingBooking && (
                    new Date(existingBooking.date).toISOString().split('T')[0] !== date ||
                    existingBooking.start_time !== startTimeText
                );

                await sendEmail({
                    to: challenge.inviter_email,
                    subject: isDifferentDate
                        ? `📅 ${name} zaakceptował(a) wyzwanie, ale wybrał(a) inny termin!`
                        : `🎉 ${name} właśnie zaakceptował(a) Twoje Foto Wyzwanie!`,
                    template: 'challenge-accepted-inviter',
                    data: {
                        inviterName: challenge.inviter_name,
                        inviteeName: name,
                        sessionDate: formattedDate,
                        sessionTime: startTimeText,
                        location: locationName,
                        isDifferentDate
                    }
                });
            } catch (inviterEmailError) {
                console.error('Failed to send notification email to inviter:', inviterEmailError);
            }
        }

        return NextResponse.json({
            success: true,
            booking_id: booking.id
        });
    } catch (error) {
        console.error('Error accepting challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
