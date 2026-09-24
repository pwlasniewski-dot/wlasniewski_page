import { shiftCivilDate, warsawDateKey, warsawDateRange, warsawMidnight } from './dateRange';

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
    currency: 'PLN';
    unit: 'minor';
    details: {
        ledgerPaymentsGross: number;
        legacyPaymentsGross: number;
        excludedForeignRecords: number;
        unmatchedOnlineEvents: number;
        suppressedLegacyEvents: number;
        notes: string[];
    };
};

export type FinanceLedgerRow = {
    id: number; provider: string; provider_payment_id: string; external_order_id: string | null;
    resource_type: string | null; resource_id: number | null; payment_kind: string;
    amount: number; currency: string; status: string; paid_at: Date;
    refunded_amount: number; refunded_at: Date | null;
};
export type FinanceBookingRow = {
    id: number; deposit_amount: number | null; deposit_paid_at: Date | null;
    remaining_amount: number | null; remaining_paid_at: Date | null;
    payu_order_id: string | null; deposit_session_id: string | null; remaining_session_id: string | null;
    refund_amount: number | null; refunded_at: Date | null; refund_status: string | null;
};
export type FinancePhotoOrderRow = { id: number; total_amount: number; paid_at: Date | null; payment_id: string | null };
export type FinanceGiftOrderRow = { id: number; amount_paid: number; currency: string; paid_at: Date | null; payu_order_id: string | null; stripe_session_id: string | null };

export const MAX_FINANCE_RANGE_DAYS = 366;

/** Dates are civil days in Warsaw; endDate includes the entire day, including DST changes. */
export function parseFinanceDateRange(params: URLSearchParams, now = new Date()) {
    for (const key of params.keys()) {
        if (!['startDate', 'endDate'].includes(key) || params.getAll(key).length !== 1) {
            throw new Error('Dozwolone są pojedyncze parametry startDate i endDate.');
        }
    }
    const hasStart = params.has('startDate'); const hasEnd = params.has('endDate');
    if (hasStart !== hasEnd) throw new Error('Podaj obie daty zakresu.');
    const endDate = hasEnd ? params.get('endDate')! : warsawDateKey(now);
    const startDate = hasStart ? params.get('startDate')! : shiftCivilDate(endDate, -27)!;
    const valid = (value: string) => /^(19|20|21)\d{2}-\d{2}-\d{2}$/.test(value) && warsawMidnight(value) !== null;
    if (!valid(startDate) || !valid(endDate) || startDate > endDate) throw new Error('Nieprawidłowy zakres dat. Użyj formatu RRRR-MM-DD.');
    const days = Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
    if (days > MAX_FINANCE_RANGE_DAYS) throw new Error(`Maksymalny zakres to ${MAX_FINANCE_RANGE_DAYS} dni.`);
    const range = warsawDateRange(startDate, endDate);
    if (!range) throw new Error('Nieprawidłowy zakres dat.');
    return { ...range, startDate, endDate, timeZone: 'Europe/Warsaw' as const };
}

function inRange(date: Date | null, start: Date, end: Date) { return date !== null && date >= start && date < end; }
function money(value: number | null) {
    if (value === null || !Number.isSafeInteger(value) || value < 0) throw new Error('FINANCE_INVALID_AMOUNT');
    return value;
}
function add(a: number, b: number) { const value = a + b; if (!Number.isSafeInteger(value)) throw new Error('FINANCE_AMOUNT_OVERFLOW'); return value; }

export function sumUnledgeredBookingPayments(
    bookings: Array<Pick<FinanceBookingRow, 'id' | 'deposit_amount' | 'deposit_paid_at' | 'remaining_amount' | 'remaining_paid_at'>>,
    recordedEvents: Set<string>, start: Date, end: Date,
) {
    return bookings.reduce((sum, booking) => {
        if (inRange(booking.deposit_paid_at, start, end) && !recordedEvents.has(`${booking.id}:DEPOSIT`) && !recordedEvents.has(`${booking.id}:FULL`)) sum = add(sum, money(booking.deposit_amount));
        if (inRange(booking.remaining_paid_at, start, end) && !recordedEvents.has(`${booking.id}:REMAINING`) && !recordedEvents.has(`${booking.id}:FULL`)) sum = add(sum, money(booking.remaining_amount));
        return sum;
    }, 0);
}

/** Uses all matching ledger identities (even outside the report period) to avoid historical fallback duplicates. */
export function buildFinanceSummary(input: {
    start: Date; end: Date; bookingValues: Array<{ price: number }>;
    ledger: FinanceLedgerRow[]; bookings: FinanceBookingRow[]; photoOrders: FinancePhotoOrderRow[];
    giftCardOrders: FinanceGiftOrderRow[]; coverageStartedAt: Date | null;
}): FinanceSummary {
    const { start, end } = input;
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) throw new Error('FINANCE_INVALID_RANGE');
    const ledger = Array.from(new Map(input.ledger.filter(row => row.status === 'COMPLETED').map(row => [row.id, row])).values());
    let ledgerGross = 0; let ledgerRefunds = 0; let legacyGross = 0; let legacyRefunds = 0;
    let excludedForeignRecords = 0; let unmatchedOnlineEvents = 0; let suppressedLegacyEvents = 0;
    for (const row of ledger) {
        const paymentInRange = inRange(row.paid_at, start, end); const refundInRange = inRange(row.refunded_at, start, end);
        if (!paymentInRange && !refundInRange) continue;
        if (row.currency !== 'PLN') { excludedForeignRecords++; continue; }
        if (paymentInRange) ledgerGross = add(ledgerGross, money(row.amount));
        if (refundInRange) ledgerRefunds = add(ledgerRefunds, money(row.refunded_amount));
    }
    const matching = (type: string, id: number, providerId: string | null, externalId: string | null = null) => ledger.filter(row =>
        (row.resource_type === type && row.resource_id === id)
        || (providerId !== null && row.provider_payment_id === providerId)
        || (externalId !== null && row.external_order_id === externalId));
    for (const booking of input.bookings) {
        for (const event of [
            { kind: 'DEPOSIT', at: booking.deposit_paid_at, amount: booking.deposit_amount, session: booking.deposit_session_id },
            { kind: 'REMAINING', at: booking.remaining_paid_at, amount: booking.remaining_amount, session: booking.remaining_session_id },
        ]) {
            if (!inRange(event.at, start, end)) continue;
            const represented = matching('BOOKING', booking.id, booking.payu_order_id, event.session)
                .some(row => row.payment_kind === event.kind || row.payment_kind === 'FULL');
            if (represented) { suppressedLegacyEvents++; continue; }
            if (booking.payu_order_id || event.session) { unmatchedOnlineEvents++; continue; }
            legacyGross = add(legacyGross, money(event.amount));
        }
        if (booking.refund_status === 'COMPLETED' && inRange(booking.refunded_at, start, end)) {
            const linked = matching('BOOKING', booking.id, booking.payu_order_id);
            if (linked.some(row => row.refunded_amount > 0)) { suppressedLegacyEvents++; continue; }
            if (linked.some(row => row.currency !== 'PLN')) { excludedForeignRecords++; continue; }
            // A completed manual/legacy refund is evidence even if the ledger has no refund yet.
            legacyRefunds = add(legacyRefunds, money(booking.refund_amount));
        }
    }
    for (const order of input.photoOrders) {
        if (!inRange(order.paid_at, start, end)) continue;
        if (matching('GALLERY', order.id, order.payment_id).length) { suppressedLegacyEvents++; continue; }
        if (order.payment_id) { unmatchedOnlineEvents++; continue; }
        legacyGross = add(legacyGross, money(order.total_amount));
    }
    for (const order of input.giftCardOrders) {
        if (!inRange(order.paid_at, start, end)) continue;
        if (matching('GIFT_CARD', order.id, order.payu_order_id, order.stripe_session_id).length) { suppressedLegacyEvents++; continue; }
        if (order.currency !== 'PLN') { excludedForeignRecords++; continue; }
        if (order.payu_order_id || order.stripe_session_id) { unmatchedOnlineEvents++; continue; }
        legacyGross = add(legacyGross, money(order.amount_paid));
    }
    const receivedPaymentsGross = add(ledgerGross, legacyGross);
    const refundsGross = add(ledgerRefunds, legacyRefunds);
    return {
        bookingValueGross: input.bookingValues.reduce((sum, row) => add(sum, money(row.price)), 0),
        bookingCount: input.bookingValues.length,
        receivedPaymentsGross, refundsGross, receivedPaymentsNet: receivedPaymentsGross - refundsGross,
        accountingRevenue: null, income: null, coverage: 'LEDGER_AND_RECORDED_LEGACY',
        coverageStartedAt: input.coverageStartedAt, currency: 'PLN', unit: 'minor',
        details: {
            ledgerPaymentsGross: ledgerGross, legacyPaymentsGross: legacyGross,
            excludedForeignRecords, unmatchedOnlineEvents, suppressedLegacyEvents,
            notes: [
                'Wpłaty i zwroty zapisane w systemie wszystkich usług i sklepu. Nie są uzgodnione z wyciągiem bankowym ani ograniczone do jednej domeny.',
                'Historia zwrotów jest niepełna: obecny model przechowuje jedną kwotę i datę na płatność. Wielokrotne częściowe zwroty mogą być pominięte lub przypisane do ostatniej daty.',
                'Starsze wpłaty bez wiarygodnej daty lub wpisu płatności mogą nie być ujęte. Realizacja karty podarunkowej nie jest kolejną wpłatą.',
                'Koszty produkcji, wysyłki, prowizji, reklam i podatków nie są kompletnie rejestrowane. Przychód księgowy i zysk są niedostępne.',
                ...(excludedForeignRecords ? [`Pominięto ${excludedForeignRecords} zapisów w innych walutach; brak przeliczenia kursowego.`] : []),
                ...(unmatchedOnlineEvents ? [`Pominięto ${unmatchedOnlineEvents} starszych zdarzeń online bez pasującego wpisu w rejestrze płatności; wymagają uzgodnienia.`] : []),
            ],
        },
    };
}
