import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;
    try {
        const goals = await prisma.businessGoal.findMany({
            orderBy: { created_at: 'desc' }
        });

        return NextResponse.json(goals);
    } catch (error) {
        console.error('[BI Goals] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch goals' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;
    try {
        const { title, target_amount, category } = await req.json();

        const goal = await prisma.businessGoal.create({
            data: {
                title,
                target_amount: parseFloat(target_amount),
                category: category || 'revenue',
                current_amount: 0,
                start_date: new Date(),
                end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            }
        });

        return NextResponse.json({ success: true, goal });
    } catch (error) {
        console.error('[BI Goals] Error:', error);
        return NextResponse.json(
            { error: 'Failed to create goal' },
            { status: 500 }
        );
    }
}
