import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            include: {
                package: true,
                location: true
            }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Update viewed_at if not already viewed
        if (!challenge.viewed_at) {
            await prisma.photoChallenge.update({
                where: { unique_link },
                data: { viewed_at: new Date(), status: 'viewed' }
            });
        }

        // Fetch associated booking to get session times
        const booking = await prisma.booking.findFirst({
            where: { challenge_id: challenge.id }
        });

        return NextResponse.json({
            success: true,
            challenge: {
                ...challenge,
                package: challenge.package,
                location: challenge.location,
                booking: booking ? {
                    date: booking.date,
                    start_time: booking.start_time,
                    end_time: booking.end_time,
                    status: booking.status
                } : null
            }
        });
    } catch (error) {
        console.error('Error fetching challenge:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
