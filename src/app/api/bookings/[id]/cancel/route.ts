/**
 * POST /api/bookings/[id]/cancel
 * Klient anuluje rezerwację. Polityka:
 *   >= settings.cancellation_full_refund_days dni przed sesją → 100% refund
 *   >= settings.cancellation_partial_days dni → settings.cancellation_partial_pct % refund
 *   <  partial_days → bez zwrotu
 * Body: { reason: string }
 * Zapisuje cancellation, jeśli polityka pozwala — uruchamia refund (PENDING).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { extractToken, verifyToken } from '@/lib/auth/jwt';
import { refundPayUOrder } from '@/lib/payu';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ reason: z.string().trim().min(3).max(500) });

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const token = extractToken(request.headers.get('authorization'))
        || request.cookies.get('client_token')?.value
        || request.cookies.get('user_token')?.value
        || null;
    if (!token) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    const payload = await verifyToken(token).catch(() => null);
    if (!payload?.id) return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 });

    const { id } = await ctx.params;
    const bookingId = parseInt(id, 10);
    if (Number.isNaN(bookingId)) return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_FAILED' }, { status: 400 });
    const { reason } = parsed.data;

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return NextResponse.json({ error: 'BOOKING_NOT_FOUND' }, { status: 404 });

    // Authorize: właściciel (po email userze) — User nie jest jeszcze relacją, łączymy po email.
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.email.toLowerCase() !== booking.email.toLowerCase()) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    if (booking.status === 'cancelled') return NextResponse.json({ error: 'ALREADY_CANCELLED' }, { status: 409 });

    const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    const fullDays = settings?.cancellation_full_refund_days ?? 7;
    const partialDays = settings?.cancellation_partial_days ?? 3;
    const partialPct = settings?.cancellation_partial_pct ?? 50;

    const now = new Date();
    const daysToSession = (booking.date.getTime() - now.getTime()) / (24 * 3600 * 1000);

    let refundAmount = 0;
    if (daysToSession >= fullDays) refundAmount = booking.price;
    else if (daysToSession >= partialDays) refundAmount = Math.round(booking.price * partialPct / 100);

    await prisma.booking.update({
        where: { id: bookingId },
        data: {
            status: 'cancelled',
            cancellation_reason: reason,
            cancelled_at: now,
            cancelled_by: 'CLIENT',
            refund_amount: refundAmount > 0 ? refundAmount : null,
            refund_status: refundAmount > 0 ? 'PENDING' : 'REJECTED',
        },
    });

    if (refundAmount > 0 && booking.payu_order_id) {
        try {
            const result = await refundPayUOrder(booking.payu_order_id, refundAmount, `Anulowanie przez klienta: ${reason}`);
            const refundId = result?.refund?.refundId || null;
            if (refundId) await prisma.booking.update({ where: { id: bookingId }, data: { refund_id: refundId } });
        } catch (e: any) {
            await prisma.booking.update({ where: { id: bookingId }, data: { refund_status: 'FAILED' } });
            await logSystem('ERROR', 'PAYMENT', `CLIENT_CANCEL_REFUND_FAILED #${bookingId}`, { error: e?.message });
        }
    }

    await logSystem('INFO', 'BOOKING', `CLIENT_CANCEL #${bookingId}`, { userId: user.id, daysToSession, refundAmount, refundPolicy: { fullDays, partialDays, partialPct } });

    return NextResponse.json({ ok: true, refund_amount: refundAmount, days_to_session: Math.floor(daysToSession) });
}
