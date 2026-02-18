import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    return withAuth(request, async () => {
        try {
            const logs = await prisma.systemLog.findMany({
                orderBy: { created_at: 'desc' },
                take: 100,
            });
            return NextResponse.json({ success: true, logs });
        } catch (error) {
            return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
        }
    });
}
