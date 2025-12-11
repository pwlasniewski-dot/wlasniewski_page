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

        // Create booking
        const startTime = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`);
        // Assume 1 hour session (can be configurable)
        const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

        const booking = await prisma.booking.create({
            data: {
                service: 'Foto-wyzwanie',
                package: (challenge.package as any)?.name || 'Challenge',
                price: (challenge.package as any)?.challenge_price || 0,
                date: startTime,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                client_name: name,
                email: challenge.invitee_contact,
                phone: '',
                status: 'confirmed',
                challenge_id: challenge.id
            }
        });

        // Update challenge status
        await prisma.photoChallenge.update({
            where: { unique_link },
            data: {
                status: 'accepted',
                accepted_at: new Date(),
                session_date: startTime
            }
        });

        // Send confirmation email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const galleryLink = `${baseUrl}/foto-wyzwanie/gallery/${challenge.id}`;

        try {
            await sendEmail({
                to: challenge.invitee_contact,
                subject: '✅ Wyzwanie zaakceptowane! Szczegóły sesji',
                template: 'challenge-accepted',
                data: {
                    sessionDate: startTime.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
                    sessionTime: `${String(hour).padStart(2, '0')}:00`,
                    location: challenge.location?.name || 'Będzie podane wkrótce',
                    galleryLink
                }
            });
        } catch (emailError) {
            console.error('Failed to send acceptance email:', emailError);
            // Don't fail the request if email fails
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
