import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const authError = await requireAuth(request);
        if (authError) return authError;

        // Fetch recent system logs related to clients, offers, and contracts
        const logs = await prisma.systemLog.findMany({
            where: {
                OR: [
                    { module: { in: ['OFFERS', 'CONTRACTS', 'CLIENTS', 'GALLERIES', 'SYSTEM'] } },
                    { message: { contains: 'ofert', mode: 'insensitive' } },
                    { message: { contains: 'umow', mode: 'insensitive' } },
                    { message: { contains: 'klient', mode: 'insensitive' } },
                    { message: { contains: 'galer', mode: 'insensitive' } }
                ]
            },
            orderBy: { created_at: 'desc' },
            take: 15
        });

        return NextResponse.json({ success: true, logs });
    } catch (error) {
        console.error('Error fetching dashboard activity:', error);
        return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
    }
}
