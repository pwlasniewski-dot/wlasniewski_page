import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;
    try {
        // Get all snapshots
        const snapshots = await prisma.analyticsSnapshot.findMany({
            orderBy: { snapshot_date: 'desc' },
            take: 30
        });

        // Get conversion data from bookings
        const bookings = await prisma.booking.findMany({
            select: { price: true, created_at: true }
        });

        // Get drone orders
        const droneOrders = await prisma.droneOrder.findMany({
            select: { created_at: true, status: true }
        });

        // Calculate metrics
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0) / 100; // grosze → PLN
        const bookingsCount = bookings.length;
        const droneLeads = droneOrders.length;
        const conversionRate = bookingsCount > 0 ? ((bookingsCount / (bookingsCount + droneLeads + 100)) * 100).toFixed(1) : '0';

        // Format snapshots for dashboard
        const formattedSnapshots = snapshots.map(s => ({
            id: s.id,
            snapshot_date: s.snapshot_date,
            total_revenue: s.total_revenue || totalRevenue,
            bookings_count: s.bookings_count || bookingsCount,
            conversion_rate: s.conversion_rate ? parseFloat(String(s.conversion_rate)) : parseFloat(conversionRate),
            drone_orders: droneOrders.filter(d => 
                new Date(d.created_at) >= new Date(s.snapshot_date)
            ).length,
            metadata: s.metadata
        }));

        return NextResponse.json({
            snapshots: formattedSnapshots,
            goals: [],
            summary: {
                total_revenue: totalRevenue,
                bookings_count: bookingsCount,
                drone_orders: droneLeads,
                conversion_rate: conversionRate
            }
        });
    } catch (error) {
        console.error('[BI API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch BI data' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const authError = await requireAuth(req);
    if (authError) return authError;
    try {
        const bookings = await prisma.booking.findMany({
            select: { price: true }
        });

        const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0) / 100; // grosze → PLN

        const snapshot = await prisma.analyticsSnapshot.create({
            data: {
                snapshot_date: new Date(),
                total_revenue: totalRevenue,
                bookings_count: bookings.length,
                conversion_rate: 0,
                metadata: null
            }
        });

        return NextResponse.json({ success: true, snapshot });
    } catch (error) {
        console.error('[BI API] Error creating snapshot:', error);
        return NextResponse.json(
            { error: 'Failed to create snapshot' },
            { status: 500 }
        );
    }
}
