// API Route: GET /api/photo-challenge/stats
// Pobiera statystyki dla social proof

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
    try {
        // Get current month start/end
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Count accepted challenges this month
        const acceptedCount = await prisma.photoChallenge.count({
            where: {
                status: { in: ['accepted', 'scheduled', 'completed'] },
                accepted_at: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
        });

        // Count completed sessions total
        const completedCount = await prisma.photoChallenge.count({
            where: {
                status: 'completed',
            },
        });

        // Get monthly limit setting
        const limitSetting = await prisma.challengeSetting.findUnique({
            where: { setting_key: 'monthly_challenge_limit' },
        });

        const monthlyLimit = limitSetting ? Number(limitSetting.setting_value) : 10;
        const remainingSlots = Math.max(0, monthlyLimit - acceptedCount);

        return NextResponse.json({
            success: true,
            stats: {
                accepted_this_month: acceptedCount,
                completed_sessions: completedCount,
                remaining_monthly_slots: remainingSlots,
            },
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { success: false, error: 'Nie udało się pobrać statystyk' },
            { status: 500 }
        );
    }
}
