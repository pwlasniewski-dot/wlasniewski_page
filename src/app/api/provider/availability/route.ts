import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken } from '@/lib/auth/jwt';

// Helper to calculate date range
const getMonthBounds = (year: number, month: number) => {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    return { start, end };
};

const withAuth = async (req: NextRequest, handler: (decoded: any) => Promise<NextResponse>) => {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];
        const decoded = await verifyToken(token);

        // Allow both PHOTOGRAPHER and ADMIN
        if (!decoded || (decoded.role !== 'PHOTOGRAPHER' && decoded.role !== 'ADMIN')) {
            return NextResponse.json({ error: 'Go away' }, { status: 403 });
        }

        return handler(decoded);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));

    return withAuth(request, async (decoded) => {
        try {
            const { start, end } = getMonthBounds(year, month);

            // Fetch availability blocks
            const blocks = await prisma.providerAvailability.findMany({
                where: {
                    user_id: decoded.id,
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            });

            // Fetch actual bookings
            // For Admin (role ADMIN), he might want to see UNASSIGNED bookings too?
            // Or just bookings assigned to him?
            // The request is "Admin Calendar", treating Admin as a Provider.
            // So we check provider_id = decoded.id OR provider_id = NULL (if Admin takes responsibility for unassigned).

            const whereBooking: any = {
                date: {
                    gte: start,
                    lte: end
                },
                status: { not: 'cancelled' }
            };

            if (decoded.role === 'ADMIN') {
                // Admin sees bookings assigned to him (if any) AND unassigned bookings (global)
                // This prevents unassigned bookings from disappearing from calendar
                whereBooking.OR = [
                    { photographer_id: decoded.id },
                    { photographer_id: null }
                ];
            } else {
                whereBooking.photographer_id = decoded.id;
            }

            const bookings = await prisma.booking.findMany({ where: whereBooking });

            return NextResponse.json({ success: true, blocks, bookings });
        } catch (error) {
            console.error('Availability fetch error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    });
}

export async function POST(request: NextRequest) {
    return withAuth(request, async (decoded) => {
        try {
            const { date, is_available, reason } = await request.json();
            const targetDate = new Date(date);

            const existing = await prisma.providerAvailability.findFirst({
                where: {
                    user_id: decoded.id,
                    date: targetDate
                }
            });

            if (existing) {
                await prisma.providerAvailability.update({
                    where: { id: existing.id },
                    data: { is_available, reason }
                });
            } else {
                await prisma.providerAvailability.create({
                    data: {
                        user_id: decoded.id,
                        date: targetDate,
                        is_available, // false means blocked
                        reason
                    }
                });
            }

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Availability save error:', error);
            return NextResponse.json({ error: 'Save error' }, { status: 500 });
        }
    });
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    return withAuth(request, async (decoded) => {
        try {
            if (!dateStr) return NextResponse.json({ error: 'Date required' }, { status: 400 });

            await prisma.providerAvailability.deleteMany({
                where: {
                    user_id: decoded.id,
                    date: new Date(dateStr)
                }
            });
            return NextResponse.json({ success: true });
        } catch (error) {
            return NextResponse.json({ error: 'Delete error' }, { status: 500 });
        }
    });
}
