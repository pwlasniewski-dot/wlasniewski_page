
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
    try {
        const goals = await prisma.businessGoal.findMany({
            orderBy: { end_date: 'asc' }
        });

        // Calculate progress logic (simplified for now)
        const enrichedGoals = goals.map(g => ({
            ...g,
            progress: g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0,
            daysLeft: Math.ceil((new Date(g.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        }));

        return NextResponse.json(enrichedGoals);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const goal = await prisma.businessGoal.create({
            data: {
                title: body.title,
                target_amount: parseFloat(body.target_amount),
                current_amount: parseFloat(body.current_amount || 0),
                category: body.category || 'revenue',
                start_date: new Date(body.start_date || new Date()),
                end_date: new Date(body.end_date)
            }
        });
        return NextResponse.json(goal);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}
