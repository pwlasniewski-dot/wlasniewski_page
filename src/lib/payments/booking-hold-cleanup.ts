import prisma from '@/lib/db/prisma';
import { cancelPayUOrder, retrievePayUOrder } from '@/lib/payu';
import { PAYMENT_HOLD_MILLISECONDS } from '@/lib/paymentPolicy';
import { logSystem } from '@/lib/logger';

export interface BookingHoldCleanupResult {
    checked: number;
    released: number;
    completedAwaitingWebhook: number;
    failed: number;
}

export async function cleanupExpiredBookingPaymentHolds(now = new Date()): Promise<BookingHoldCleanupResult> {
    const cutoff = new Date(now.getTime() - PAYMENT_HOLD_MILLISECONDS);
    const candidates = await prisma.booking.findMany({
        where: {
            status: 'pending',
            created_at: { lt: cutoff },
            stripe_session_id: { startsWith: 'CART_' },
            payu_order_id: { not: null },
        },
        select: { stripe_session_id: true, payu_order_id: true },
        distinct: ['stripe_session_id'],
        take: 100,
    });

    const result: BookingHoldCleanupResult = { checked: 0, released: 0, completedAwaitingWebhook: 0, failed: 0 };
    for (const candidate of candidates) {
        const cartId = candidate.stripe_session_id;
        const payuOrderId = candidate.payu_order_id;
        if (!cartId || !payuOrderId) continue;
        result.checked += 1;

        try {
            const payuOrder = await retrievePayUOrder(payuOrderId);
            const status = String(payuOrder?.status || '').toUpperCase();
            if (status === 'COMPLETED') {
                // Nigdy nie zwalniamy opłaconego terminu. PayU ponowi webhook;
                // przypadek pozostaje widoczny w logach do ręcznej kontroli.
                result.completedAwaitingWebhook += 1;
                await logSystem('WARN', 'PAYMENT', 'Completed PayU order still has pending local booking', { cartId, payuOrderId });
                continue;
            }

            if (!['CANCELED', 'REJECTED'].includes(status)) {
                await cancelPayUOrder(payuOrderId);
            }

            await prisma.$transaction([
                prisma.booking.updateMany({
                    where: { stripe_session_id: cartId, status: 'pending' },
                    data: {
                        status: 'cancelled',
                        cancelled_at: now,
                        cancelled_by: 'SYSTEM',
                        cancellation_reason: 'Wygasł czas na opłacenie zamówienia PayU.',
                    },
                }),
                prisma.giftCardOrder.updateMany({
                    where: { payu_order_id: cartId, payment_status: 'pending' },
                    data: { payment_status: 'cancelled' },
                }),
            ]);
            result.released += 1;
        } catch (error) {
            result.failed += 1;
            await logSystem('ERROR', 'PAYMENT', 'Failed to verify or release expired booking hold', {
                cartId,
                payuOrderId,
                error: String(error),
            });
        }
    }

    return result;
}
