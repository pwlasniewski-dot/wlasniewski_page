import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { unique_link: string } }
) {
    try {
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link: params.unique_link },
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
                where: { unique_link: params.unique_link },
                data: { viewed_at: new Date(), status: 'viewed' }
            });
        }

        return NextResponse.json({
            success: true,
            challenge: {
                ...challenge,
                package: challenge.package,
                location: challenge.location
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
