import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Extract and verify token
        const token = extractToken(request.headers.get('authorization')) || 
                     request.cookies.get('client_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Fetch all offers for this client (both by user_id and client_email)
        const offers = await prisma.offer.findMany({
            where: {
                OR: [
                    { client_id: decoded.id },
                    { client_email: decoded.email },
                ],
            },
            include: {
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json({ offers });
    } catch (error) {
        console.error('Error fetching client offers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch offers' },
            { status: 500 }
        );
    }
}
