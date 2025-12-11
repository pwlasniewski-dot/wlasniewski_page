import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;
        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link }
        });

        if (!challenge) {
            return NextResponse.json(
                { success: false, error: 'Challenge not found' },
                { status: 404 }
            );
        }

        // Update status to viewed (if not already)
        await prisma.photoChallenge.update({
            where: { unique_link },
            data: {
                status: 'viewed',
                viewed_at: new Date()
            }
        });

        return NextResponse.json({
            success: true
        });
    } catch (error) {
        console.error('Error accepting invite:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
