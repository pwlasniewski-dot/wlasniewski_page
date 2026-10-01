import prisma from '@/lib/db/prisma';
import { buildFinanceSummary, type FinanceSummary } from './finance-core';
export { sumUnledgeredBookingPayments } from './finance-core';
export type { FinanceSummary } from './finance-core';

const ledgerSelect = {
    id: true, provider: true, provider_payment_id: true, external_order_id: true,
    amount: true, currency: true, status: true, paid_at: true, refunded_amount: true, refunded_at: true,
    resource_type: true, resource_id: true, payment_kind: true,
} as const;

export async function getFinanceSummary(start: Date, end: Date): Promise<FinanceSummary> {
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) throw new Error('FINANCE_INVALID_RANGE');
    // One consistent snapshot prevents a concurrent payment webhook/backfill being counted in both sources.
    return prisma.$transaction(async tx => {
        const [bookingValues, ledgerPayments, firstLedgerPayment, bookings, photoOrders, giftCardOrders] = await Promise.all([
            tx.booking.findMany({ where: { created_at: { gte: start, lt: end }, status: { notIn: ['cancelled', 'canceled'] } }, select: { price: true } }),
            tx.paymentLedger.findMany({
                where: { status: 'COMPLETED', OR: [{ paid_at: { gte: start, lt: end } }, { refunded_at: { gte: start, lt: end } }] },
                select: ledgerSelect,
            }),
            tx.paymentLedger.findFirst({ where: { status: 'COMPLETED', currency: 'PLN' }, orderBy: { paid_at: 'asc' }, select: { paid_at: true } }),
            tx.booking.findMany({
                where: { OR: [{ deposit_paid_at: { gte: start, lt: end } }, { remaining_paid_at: { gte: start, lt: end } }, { refunded_at: { gte: start, lt: end }, refund_status: 'COMPLETED' }] },
                select: {
                    id: true, deposit_amount: true, deposit_paid_at: true, remaining_amount: true, remaining_paid_at: true,
                    payu_order_id: true, deposit_session_id: true, remaining_session_id: true,
                    refund_amount: true, refunded_at: true, refund_status: true,
                },
            }),
            tx.photoOrder.findMany({ where: { payment_status: 'paid', paid_at: { gte: start, lt: end } }, select: { id: true, total_amount: true, paid_at: true, payment_id: true } }),
            tx.giftCardOrder.findMany({ where: { payment_status: 'paid', paid_at: { gte: start, lt: end } }, select: { id: true, amount_paid: true, currency: true, paid_at: true, payu_order_id: true, stripe_session_id: true } }),
        ]);
        const providerIds = [...bookings.map(row => row.payu_order_id), ...photoOrders.map(row => row.payment_id), ...giftCardOrders.map(row => row.payu_order_id)].filter((id): id is string => !!id);
        const externalIds = [...bookings.flatMap(row => [row.deposit_session_id, row.remaining_session_id]), ...giftCardOrders.map(row => row.stripe_session_id)].filter((id): id is string => !!id);
        // IDs outside the period also suppress legacy fallbacks; an old payment is never a new receipt.
        const identities = bookings.length || photoOrders.length || giftCardOrders.length ? await tx.paymentLedger.findMany({
            where: { status: 'COMPLETED', OR: [
                { resource_type: 'BOOKING', resource_id: { in: bookings.map(row => row.id) } },
                { resource_type: 'GALLERY', resource_id: { in: photoOrders.map(row => row.id) } },
                { resource_type: 'GIFT_CARD', resource_id: { in: giftCardOrders.map(row => row.id) } },
                { provider_payment_id: { in: Array.from(new Set(providerIds)) } },
                { external_order_id: { in: Array.from(new Set(externalIds)) } },
            ] }, select: ledgerSelect,
        }) : [];
        return buildFinanceSummary({ start, end, bookingValues, ledger: [...ledgerPayments, ...identities], bookings, photoOrders, giftCardOrders, coverageStartedAt: firstLedgerPayment?.paid_at || null });
    }, { isolationLevel: 'RepeatableRead', timeout: 15000 });
}

export async function getAverageMonthlyNetPayments(monthRanges: Array<{ start: Date; end: Date }>) {
    if (!monthRanges.length) return 0;
    const months = await Promise.all(monthRanges.map(range => getFinanceSummary(range.start, range.end)));
    return Math.round(months.reduce((sum, month) => sum + month.receivedPaymentsNet, 0) / monthRanges.length);
}

export async function getAverageMonthlyBookingValue(monthRanges: Array<{ start: Date; end: Date }>) {
    if (!monthRanges.length) return 0;
    const months = await Promise.all(monthRanges.map(range => getFinanceSummary(range.start, range.end)));
    return Math.round(months.reduce((sum, month) => sum + month.bookingValueGross, 0) / monthRanges.length);
}
