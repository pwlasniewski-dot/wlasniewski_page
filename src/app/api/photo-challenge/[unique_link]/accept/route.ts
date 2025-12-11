import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: { unique_link: string } }
) {
    try {
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
            where: { unique_link: params.unique_link },
            include: { package: true }
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
                package: (challenge.package as any)?.package_name || 'Challenge',
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
            where: { unique_link: params.unique_link },
            data: {
                status: 'accepted',
                accepted_at: new Date(),
                session_date: startTime
            }
        });

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
