
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
    try {
        // Clear critical analytics and temporary test data
        // We use deleteMany without where to clear everything in these tables

        // 1. Delete analytics events
        await prisma.analyticsEvent.deleteMany({});

        // 2. Delete scrum tasks (optional but requested for "moving on clean")
        await prisma.scrumTask.deleteMany({});

        // 3. Delete snapshots
        await prisma.analyticsSnapshot.deleteMany({});

        // 4. Reset business goals progress (optional)
        await prisma.businessGoal.updateMany({
            data: { current_amount: 0 }
        });

        // 5. Delete marketing actions
        await prisma.marketingAction.deleteMany({});

        return NextResponse.json({ success: true, message: 'All analytics data has been reset.' });
    } catch (error: any) {
        console.error('Reset failed:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
