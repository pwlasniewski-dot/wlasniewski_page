
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
    try {
        // Get total revenue from bookings
        const bookings = await prisma.booking.findMany({
            where: { status: 'confirmed' },
            select: { price: true, created_at: true }
        });

        const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);

        // Get revenue from gift cards
        const giftCardOrders = await prisma.giftCardOrder.findMany({
            where: { payment_status: 'completed' },
            select: { amount_paid: true }
        });

        const giftCardRevenue = giftCardOrders.reduce((sum, o) => sum + (o.amount_paid / 100), 0);

        // Calculate revenue by month (last 6 months)
        const labels: string[] = [];
        const revenueData: number[] = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('pl-PL', { month: 'short' });
            labels.push(monthLabel);

            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthBookings = bookings.filter(b => b.created_at >= monthStart && b.created_at <= monthEnd);
            const monthRevenue = monthBookings.reduce((sum, b) => sum + b.price, 0);
            revenueData.push(monthRevenue);
        }

        // Get goals
        const goals = await prisma.businessGoal.findMany({
            orderBy: { end_date: 'asc' }
        });

        return NextResponse.json({
            summary: {
                totalRevenue: totalRevenue + giftCardRevenue,
                bookingsCount: bookings.length,
                giftCardsCount: giftCardOrders.length
            },
            chartData: {
                labels,
                revenueData
            },
            goals
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
