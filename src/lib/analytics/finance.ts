import prisma from '@/lib/db/prisma';

export type FinanceSummary = {
    bookingValueGross: number;
    bookingCount: number;
    receivedPaymentsGross: number;
    refundsGross: number;
    receivedPaymentsNet: number;
    accountingRevenue: null;
    income: null;
    coverage: 'LEDGER_AND_RECORDED_LEGACY';
    coverageStartedAt: Date | null;
};

export function sumUnledgeredBookingPayments(
    bookings: Array<{ id: number; deposit_amount: number | null; deposit_paid_at: Date | null; remaining_amount: number | null; remaining_paid_at: Date | null }>,
    recordedEvents: Set<string>,
    start: Date,
    end: Date,
) {
    return bookings.reduce((sum, booking) => {
        if (booking.deposit_paid_at && booking.deposit_paid_at >= start && booking.deposit_paid_at < end
            && !recordedEvents.has(`${booking.id}:DEPOSIT`)) {
            sum += booking.deposit_amount || 0;
        }
        if (booking.remaining_paid_at && booking.remaining_paid_at >= start && booking.remaining_paid_at < end
            && !recordedEvents.has(`${booking.id}:REMAINING`)) {
            sum += booking.remaining_amount || 0;
        }
        return sum;
    }, 0);
}

export async function getFinanceSummary(start: Date, end: Date): Promise<FinanceSummary> {
    const [bookings, ledgerPayments, firstLedgerPayment, bookingCashEvents, photoOrders, giftCardOrders] = await Promise.all([
        prisma.booking.findMany({
            where: {
                created_at: { gte: start, lt: end },
                status: { notIn: ['cancelled', 'canceled'] },
            },
            select: { price: true },
        }),
        prisma.paymentLedger.findMany({
            where: {
                status: 'COMPLETED',
                OR: [
                    { paid_at: { gte: start, lt: end } },
                    { refunded_at: { gte: start, lt: end } },
                ],
            },
            select: {
                amount: true, paid_at: true, refunded_amount: true, refunded_at: true,
                resource_type: true, resource_id: true, payment_kind: true,
            },
        }),
        prisma.paymentLedger.findFirst({ orderBy: { paid_at: 'asc' }, select: { paid_at: true } }),
        prisma.booking.findMany({
            where: {
                payu_order_id: null,
                OR: [
                    { deposit_paid_at: { gte: start, lt: end } },
                    { remaining_paid_at: { gte: start, lt: end } },
                    { refunded_at: { gte: start, lt: end }, refund_status: 'COMPLETED' },
                ],
            },
            select: {
                id: true,
                deposit_amount: true,
                deposit_paid_at: true,
                remaining_amount: true,
                remaining_paid_at: true,
                refund_amount: true,
                refunded_at: true,
                refund_status: true,
            },
        }),
        prisma.photoOrder.findMany({
            where: { payment_status: 'paid', payment_id: null, paid_at: { gte: start, lt: end } },
            select: { total_amount: true },
        }),
        prisma.giftCardOrder.findMany({
            where: { payment_status: 'paid', payu_order_id: null, paid_at: { gte: start, lt: end } },
            select: { amount_paid: true },
        }),
    ]);

    const ledgerBookingEvents = new Set(ledgerPayments
        .filter(payment => payment.resource_type === 'BOOKING' && payment.resource_id)
        .map(payment => `${payment.resource_id}:${payment.payment_kind}`));
    const bookingPayments = sumUnledgeredBookingPayments(bookingCashEvents, ledgerBookingEvents, start, end);
    const legacyRefunds = bookingCashEvents.reduce((sum, booking) => {
        const inRange = booking.refunded_at && booking.refunded_at >= start && booking.refunded_at < end;
        return sum + (inRange && booking.refund_status === 'COMPLETED' ? booking.refund_amount || 0 : 0);
    }, 0);
    const ledgerGross = ledgerPayments.reduce((sum, payment) => {
        return sum + (payment.paid_at >= start && payment.paid_at < end ? payment.amount : 0);
    }, 0);
    const ledgerRefunds = ledgerPayments.reduce((sum, payment) => {
        const inRange = payment.refunded_at && payment.refunded_at >= start && payment.refunded_at < end;
        return sum + (inRange ? payment.refunded_amount : 0);
    }, 0);
    const refundsGross = legacyRefunds + ledgerRefunds;
    const receivedPaymentsGross = ledgerGross + bookingPayments
        + photoOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
        + giftCardOrders.reduce((sum, order) => sum + (order.amount_paid || 0), 0);

    return {
        bookingValueGross: bookings.reduce((sum, booking) => sum + (booking.price || 0), 0),
        bookingCount: bookings.length,
        receivedPaymentsGross,
        refundsGross,
        receivedPaymentsNet: receivedPaymentsGross - refundsGross,
        accountingRevenue: null,
        income: null,
        coverage: 'LEDGER_AND_RECORDED_LEGACY',
        coverageStartedAt: firstLedgerPayment?.paid_at || null,
    };
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
