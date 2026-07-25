import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

// GET all drone orders
export async function GET(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;
    try {
        const orders = await prisma.droneOrder.findMany({
            orderBy: { created_at: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (error) {
        console.error('Error fetching drone orders:', error);
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        );
    }
}
