/**
 * POST /api/admin/bookings/[id]/refund
 * Body: { amount?: number (grosze), reason: string, notify_client?: boolean }
 * Inicjuje zwrot przez PayU + zapisuje status PENDING. Webhook PayU oznacza COMPLETED.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { refundPayUOrder } from '@/lib/payu';
import { logSystem } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sender';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
    amount: z.number().int().positive().optional(),
    reason: z.string().trim().min(3).max(500),
    notify_client: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const bookingId = parseInt(id, 10);
        if (Number.isNaN(bookingId)) return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });

        let body: unknown;
        try { body = await req.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
        const parsed = schema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.flatten() }, { status: 400 });
        const { amount, reason, notify_client } = parsed.data;

        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking) return NextResponse.json({ error: 'BOOKING_NOT_FOUND' }, { status: 404 });

        if (booking.refund_status === 'COMPLETED') {
            return NextResponse.json({ error: 'ALREADY_REFUNDED', refund_id: booking.refund_id }, { status: 409 });
        }
        if (!booking.payu_order_id) {
            return NextResponse.json({ error: 'NO_PAYU_ORDER', message: 'Brak PayU orderId — nie można zwrócić automatycznie. Wykonaj zwrot ręcznie w panelu PayU.' }, { status: 422 });
        }

        // Sanity: refund nie może przekraczać kwoty zapłaconej
        const paid = (booking.payment_plan === 'SPLIT')
            ? ((booking.deposit_paid_at ? booking.deposit_amount || 0 : 0) + (booking.remaining_paid_at ? booking.remaining_amount || 0 : 0))
            : booking.price;
        const refundAmount = amount ?? paid;
        if (refundAmount > paid) {
            return NextResponse.json({ error: 'REFUND_EXCEEDS_PAID', paid, requested: refundAmount }, { status: 422 });
        }

        // Mark PENDING przed faktycznym wywołaniem (idempotencja webhooka)
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                refund_status: 'PENDING',
                refund_amount: refundAmount,
                cancellation_reason: reason,
                cancelled_at: new Date(),
                cancelled_by: 'ADMIN',
                status: 'cancelled',
            },
        });

        try {
            const result = await refundPayUOrder(booking.payu_order_id, refundAmount, reason);
            const refundId = result?.refund?.refundId || null;
            await prisma.booking.update({
                where: { id: bookingId },
                data: { refund_id: refundId },
            });
            await logSystem('INFO', 'PAYMENT', `REFUND_REQUESTED booking #${bookingId}`, { refundAmount, refundId, adminId: req.user?.id });

            if (notify_client && booking.email) {
                await sendEmail({
                    to: booking.email,
                    subject: 'Zwrot środków za sesję — w trakcie realizacji',
                    template: 'booking-refund-initiated',
                    data: {
                        name: booking.client_name || 'Kliencie',
                        amount_pln: (refundAmount / 100).toFixed(2),
                        reason,
                        date: booking.date.toISOString().slice(0, 10),
                    },
                } as any).catch(() => null);
            }

            return NextResponse.json({ ok: true, refund_id: refundId, amount: refundAmount, status: 'PENDING' });
        } catch (e: any) {
            await prisma.booking.update({
                where: { id: bookingId },
                data: { refund_status: 'FAILED' },
            });
            await logSystem('ERROR', 'PAYMENT', `REFUND_FAILED booking #${bookingId}`, { error: e?.message });
            return NextResponse.json({ error: 'REFUND_API_FAILED', message: e?.message }, { status: 502 });
        }
    });
}
