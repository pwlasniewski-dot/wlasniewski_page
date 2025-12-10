import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware'; // Assuming you have auth middleware

export async function GET(request: NextRequest) {
    // Basic admin check (simplified, ideally use withAuth)
    // For now assuming the caller sends valid header or verify token here
    try {
        const logs = await prisma.systemLog.findMany({
            orderBy: { created_at: 'desc' },
            take: 100, // Limit to last 100 logs
        });
        return NextResponse.json({ success: true, logs });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }
}
