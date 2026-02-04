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

        // Fetch contracts associated with this client
        const contracts = await prisma.contract.findMany({
            where: {
                OR: [
                    { offer: { client_id: decoded.id } },
                    { offer: { client_email: decoded.email } },
                ],
            },
            include: {
                offer: {
                    include: {
                        sections: {
                            include: {
                                items: true,
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
        });

        return NextResponse.json({ contracts });
    } catch (error) {
        console.error('Error fetching client contracts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch contracts' },
            { status: 500 }
        );
    }
}
