
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getAISuggestions } from '@/lib/ai-suggestions';

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
            select: { amount_paid: true, created_at: true }
        });

        const giftCardRevenue = giftCardOrders.reduce((sum, o) => sum + (o.amount_paid / 100), 0);

        // Get Photo Challenges
        const challenges = await prisma.photoChallenge.findMany({
            select: { status: true, created_at: true, discount_amount: true }
        });

        const activeChallenges = challenges.filter(c => c.status === 'sent' || c.status === 'viewed').length;
        const acceptedChallenges = challenges.filter(c => c.status === 'accepted').length;

        // Get Photo Orders (from client galleries)
        const photoOrders = await prisma.photoOrder.findMany({
            where: { payment_status: 'paid' },
            select: { total_amount: true, created_at: true }
        });
        const galleryRevenue = photoOrders.reduce((sum, o) => sum + (o.total_amount / 100), 0);

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

            // Add other revenue sources to chart if needed, or keep separate. 
            // For now let's sum them up for a "Total Revenue" chart.
            const monthGiftCards = giftCardOrders.filter(o => o.created_at >= monthStart && o.created_at <= monthEnd);
            const monthGCRenue = monthGiftCards.reduce((sum, o) => sum + (o.amount_paid / 100), 0);

            const monthPhotoOrders = photoOrders.filter(o => (o as any).created_at >= monthStart && (o as any).created_at <= monthEnd);
            const monthPORenue = monthPhotoOrders.reduce((sum, o) => sum + (o.total_amount / 100), 0);

            revenueData.push(monthRevenue + monthGCRenue + monthPORenue);
        }

        // Get goals
        const goals = await prisma.businessGoal.findMany({
            orderBy: { end_date: 'asc' }
        });

        // Get AI Suggestions
        const aiSuggestions = await getAISuggestions();

        return NextResponse.json({
            summary: {
                totalRevenue: totalRevenue + giftCardRevenue + galleryRevenue,
                bookingsCount: bookings.length,
                giftCardsCount: giftCardOrders.length,
                challengesCount: challenges.length,
                activeChallenges,
                acceptedChallenges,
                galleryRevenue
            },
            chartData: {
                labels,
                revenueData
            },
            goals,
            aiSuggestions
        });
    } catch (error) {
        console.error('Analytics API error:', error);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
