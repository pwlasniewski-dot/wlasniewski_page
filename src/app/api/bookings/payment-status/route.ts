import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!rateLimit(`payment-status:${getClientIp(request)}`, 40, 15 * 60_000).ok) {
        return NextResponse.json({ ok: false, state: 'rate_limited' }, { status: 429 });
    }

    const order = request.nextUrl.searchParams.get('order')?.trim() || '';
    if (!/^CART_[0-9]{10,20}_[A-Z0-9]{5}$/.test(order)) {
        return NextResponse.json({ ok: false, state: 'invalid' }, { status: 400 });
    }

    const [booking, giftCardOrder] = await Promise.all([
        prisma.booking.findFirst({
            where: { stripe_session_id: order },
            select: { status: true, price: true },
        }),
        prisma.giftCardOrder.findFirst({
            where: { payu_order_id: order },
            select: { payment_status: true },
        }),
    ]);

    if (booking) {
        const confirmed = ['confirmed', 'completed', 'paid', 'deposit_paid'].includes(booking.status);
        const failed = ['cancelled', 'rejected', 'archived', 'payment_failed'].includes(booking.status);
        return NextResponse.json({
            ok: true,
            kind: 'booking',
            state: confirmed ? 'confirmed' : failed ? 'failed' : 'pending',
            settlement: booking.status === 'deposit_paid'
                ? 'deposit'
                : confirmed && booking.price === 0 ? 'covered' : confirmed ? 'paid' : null,
        });
    }

    if (giftCardOrder) {
        const confirmed = giftCardOrder.payment_status === 'completed';
        const failed = ['failed', 'cancelled', 'rejected'].includes(giftCardOrder.payment_status);
        return NextResponse.json({
            ok: true,
            kind: 'gift_card',
            state: confirmed ? 'confirmed' : failed ? 'failed' : 'pending',
        });
    }

    return NextResponse.json({ ok: false, state: 'not_found' }, { status: 404 });
}
