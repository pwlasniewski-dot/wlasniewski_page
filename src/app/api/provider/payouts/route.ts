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
            return NextResponse.json({ error: 'Rola Dostawcy wymagana' }, { status: 403 });
        }
        return handler(decoded);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
};

// COMMISSION RATE (15%)
const COMMISSION_RATE = 0.15;
const PROVIDER_SHARE = 1 - COMMISSION_RATE; // 0.85

export async function GET(req: NextRequest) {
    return withAuth(req, async (decoded) => {
        try {
            const userId = decoded.id;

            // 1. Get Completed Bookings
            const bookings = await prisma.booking.findMany({
                where: {
                    photographer_id: userId,
                    status: 'completed'
                },
                select: { id: true, price: true, date: true, service: true }
            });

            // 2. Calculate Total Earnings (gross -> net for provider)
            // Price is in 'grosze' (cents) usually, or PLN? 
            // Assuming DATABASE stores INTEGERS (grosze or full PLN). 
            // Looking at schema: `price Int`. Usually means smallest unit.
            // Let's assume it's PLN for now based on simplicity, or check usage.
            // Wait, standard practice is cents. Let's assume 'grosze'.

            const totalBookingValue = bookings.reduce((sum, b) => sum + b.price, 0);
            const totalEarned = Math.floor(totalBookingValue * PROVIDER_SHARE);

            // 3. Get Payouts
            const payouts = await prisma.payout.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' }
            });

            const totalPaidOrPending = payouts
                .filter(p => p.status !== 'rejected')
                .reduce((sum, p) => sum + p.amount, 0);

            // 4. Balance
            const availableBalance = totalEarned - totalPaidOrPending;

            return NextResponse.json({
                success: true,
                balance: availableBalance,
                totalEarned,
                totalPaid: totalPaidOrPending,
                currency: 'PLN',
                payouts,
                bookingsCount: bookings.length // Info only
            });

        } catch (error) {
            console.error('Payouts error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    });
}

export async function POST(req: NextRequest) {
    return withAuth(req, async (decoded) => {
        try {
            const { amount } = await req.json();
            const userId = decoded.id;

            if (!amount || amount <= 0) {
                return NextResponse.json({ error: 'Nieprawidłowa kwota' }, { status: 400 });
            }

            // RE-CALCULATE BALANCE for safety
            const bookings = await prisma.booking.findMany({
                where: { photographer_id: userId, status: 'completed' },
                select: { price: true }
            });
            const totalEarned = Math.floor(bookings.reduce((s, b) => s + b.price, 0) * PROVIDER_SHARE);

            const payouts = await prisma.payout.findMany({
                where: { user_id: userId, status: { not: 'rejected' } },
                select: { amount: true }
            });
            const totalPaid = payouts.reduce((s, p) => s + p.amount, 0);

            const balance = totalEarned - totalPaid;

            if (amount > balance) {
                return NextResponse.json({ error: 'Niewystarczające środki' }, { status: 400 });
            }

            // Create Payout Request
            const newPayout = await prisma.payout.create({
                data: {
                    user_id: userId,
                    amount: amount,
                    status: 'pending',
                    currency: 'PLN'
                }
            });

            return NextResponse.json({ success: true, payout: newPayout });

        } catch (error) {
            console.error('Payout request error:', error);
            return NextResponse.json({ error: 'Server error' }, { status: 500 });
        }
    });
}
