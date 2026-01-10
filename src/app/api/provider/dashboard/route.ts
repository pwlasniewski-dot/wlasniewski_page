import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';

// Helper: Verify Auth
const withAuth = async (req: NextRequest, handler: (decoded: any) => Promise<NextResponse>) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);

        if (!decoded || (decoded.role !== 'PHOTOGRAPHER' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        return handler(decoded);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
};

export async function GET(req: NextRequest) {
    return withAuth(req, async (decoded) => {
        try {
            const userId = decoded.id;
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            // 1. Get Monthly Revenue (Completed bookings in this month)
            // Note: Revenue is calculated based on completed bookings
            const monthlyBookings = await prisma.booking.findMany({
                where: {
                    photographer_id: userId,
                    status: 'completed',
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                },
                select: { price: true }
            });

            // Commission check (from profile, default 15%)
            // We can fetch profile or assume 15% for MVP speed, but fetching is better
            const userProfile = await prisma.photographerProfile.findUnique({
                where: { id: (await prisma.user.findUnique({ where: { id: userId } }))?.photographer_profile_id || 0 }
            });
            const commissionRate = (userProfile?.base_commission || 15) / 100;
            const providerShare = 1 - commissionRate;

            const monthlyRevenue = Math.floor(monthlyBookings.reduce((sum, b) => sum + b.price, 0) * providerShare);

            // 2. Count Monthly Bookings (All non-cancelled)
            const monthlyBookingsCount = await prisma.booking.count({
                where: {
                    photographer_id: userId,
                    status: { not: 'cancelled' },
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth
                    }
                }
            });

            // 3. Count Pending Bookings (New requests)
            const pendingCount = await prisma.booking.count({
                where: {
                    photographer_id: userId,
                    status: 'pending'
                }
            });

            // 4. Next Session
            const nextBooking = await prisma.booking.findFirst({
                where: {
                    photographer_id: userId,
                    status: { in: ['confirmed', 'paid'] },
                    date: { gte: now }
                },
                orderBy: { date: 'asc' },
                select: { date: true, service: true, client_name: true } // Minimal info
            });

            return NextResponse.json({
                success: true,
                stats: {
                    monthlyRevenue,
                    monthlyBookingsCount,
                    pendingCount,
                    nextSession: nextBooking ? {
                        date: nextBooking.date,
                        service: nextBooking.service
                    } : null,
                    accountStatus: 'active' // user.is_active is usually true if they can login
                }
            });

        } catch (error) {
            console.error('Dashboard stats error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    });
}
