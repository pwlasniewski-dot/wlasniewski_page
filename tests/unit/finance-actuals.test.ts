import assert from 'node:assert/strict';
import test from 'node:test';
import { buildFinanceSummary, parseFinanceDateRange, sumUnledgeredBookingPayments, type FinanceLedgerRow, type FinanceBookingRow } from '../../src/lib/analytics/finance-core';

const start = new Date('2026-08-31T22:00:00Z'); const end = new Date('2026-09-30T22:00:00Z');
const paidAt = new Date('2026-09-10T10:00:00Z');
const base = { start, end, bookingValues: [{ price: 100000 }], ledger: [], bookings: [], photoOrders: [], giftCardOrders: [], coverageStartedAt: null };
const payment = (changes: Partial<FinanceLedgerRow> = {}): FinanceLedgerRow => ({ id: 1, provider: 'PAYU', provider_payment_id: 'payment-1', external_order_id: null, resource_type: 'BOOKING', resource_id: 7, payment_kind: 'DEPOSIT', amount: 40000, currency: 'PLN', status: 'COMPLETED', paid_at: paidAt, refunded_amount: 0, refunded_at: null, ...changes });
const booking = (changes: Partial<FinanceBookingRow> = {}): FinanceBookingRow => ({ id: 7, deposit_amount: 40000, deposit_paid_at: paidAt, remaining_amount: 60000, remaining_paid_at: paidAt, payu_order_id: null, deposit_session_id: null, remaining_session_id: null, refund_amount: null, refunded_at: null, refund_status: null, ...changes });

test('PLN sums are exact minor units and never presented as income', () => {
    const result = buildFinanceSummary({ ...base, ledger: [payment({ amount: 10001, refunded_amount: 101, refunded_at: paidAt })] });
    assert.equal(result.receivedPaymentsGross, 10001); assert.equal(result.refundsGross, 101); assert.equal(result.receivedPaymentsNet, 9900);
    assert.equal(result.accountingRevenue, null); assert.equal(result.income, null); assert.equal(result.currency, 'PLN'); assert.equal(result.unit, 'minor');
});

test('foreign ledger and legacy gift card amounts never mix into PLN', () => {
    const result = buildFinanceSummary({ ...base, ledger: [payment(), payment({ id: 2, currency: 'EUR', amount: 10000, refunded_amount: 500, refunded_at: paidAt })], giftCardOrders: [{ id: 1, amount_paid: 100, currency: 'USD', paid_at: paidAt, payu_order_id: null, stripe_session_id: null }] });
    assert.equal(result.receivedPaymentsGross, 40000); assert.equal(result.refundsGross, 0); assert.equal(result.details.excludedForeignRecords, 2);
});

test('manual legacy booking deposit is deduplicated while unpaid ledger remainder remains counted once', () => {
    const result = buildFinanceSummary({ ...base, ledger: [payment()], bookings: [booking()] });
    assert.equal(result.receivedPaymentsGross, 100000); assert.equal(result.details.suppressedLegacyEvents, 1);
    assert.equal(sumUnledgeredBookingPayments([booking()], new Set(['7:DEPOSIT']), start, end), 60000);
    assert.equal(sumUnledgeredBookingPayments([booking()], new Set(['7:FULL']), start, end), 0);
});

test('ledger FULL payment prevents counting both legacy booking halves again', () => {
    assert.equal(buildFinanceSummary({ ...base, ledger: [payment({ payment_kind: 'FULL', amount: 100000 })], bookings: [booking()] }).receivedPaymentsGross, 100000);
});

test('legacy photo and gift card fallbacks are deduplicated by resource even with missing provider ID', () => {
    const result = buildFinanceSummary({ ...base, ledger: [payment({ resource_type: 'GALLERY', resource_id: 3 }), payment({ id: 2, resource_type: 'GIFT_CARD', resource_id: 4 })], photoOrders: [{ id: 3, total_amount: 40000, paid_at: paidAt, payment_id: null }], giftCardOrders: [{ id: 4, amount_paid: 40000, paid_at: paidAt, currency: 'PLN', payu_order_id: null, stripe_session_id: null }] });
    assert.equal(result.receivedPaymentsGross, 80000); assert.equal(result.details.suppressedLegacyEvents, 2);
});

test('an earlier ledger event suppresses an incorrectly later legacy date', () => {
    const result = buildFinanceSummary({ ...base, ledger: [payment({ paid_at: new Date('2026-08-10T10:00:00Z') })], bookings: [booking({ remaining_paid_at: null })] });
    assert.equal(result.receivedPaymentsGross, 0); assert.equal(result.details.suppressedLegacyEvents, 1);
});

test('ledger plus legacy refund does not double count and missing ledger refund can use completed legacy record', () => {
    const source = booking({ deposit_paid_at: null, remaining_paid_at: null, refund_amount: 12000, refunded_at: paidAt, refund_status: 'COMPLETED' });
    const ledger = payment({ paid_at: new Date('2026-08-01T10:00:00Z'), refunded_amount: 12000, refunded_at: paidAt });
    const result = buildFinanceSummary({ ...base, ledger: [ledger], bookings: [source] });
    assert.equal(result.refundsGross, 12000); assert.equal(result.receivedPaymentsNet, -12000);
    assert.equal(buildFinanceSummary({ ...base, ledger: [payment({ refunded_amount: 0 })], bookings: [source] }).refundsGross, 12000);
});

test('refund ledger outside period suppresses legacy fallback; pending refund never counts', () => {
    const source = booking({ deposit_paid_at: null, remaining_paid_at: null, refund_amount: 12000, refunded_at: paidAt, refund_status: 'COMPLETED' });
    assert.equal(buildFinanceSummary({ ...base, ledger: [payment({ refunded_amount: 12000, refunded_at: end })], bookings: [source] }).refundsGross, 0);
    assert.equal(buildFinanceSummary({ ...base, bookings: [{ ...source, refund_status: 'PENDING' }] }).refundsGross, 0);
});

test('same CART provider transaction is counted once across matching order fallbacks', () => {
    const result = buildFinanceSummary({ ...base, ledger: [payment({ payment_kind: 'FULL', resource_type: 'CART', amount: 70000 })], bookings: [booking({ payu_order_id: 'payment-1', remaining_paid_at: null })], giftCardOrders: [{ id: 4, amount_paid: 30000, currency: 'PLN', paid_at: paidAt, payu_order_id: 'payment-1', stripe_session_id: null }] });
    assert.equal(result.receivedPaymentsGross, 70000);
});

test('unmatched online records are disclosed instead of guessed, including Stripe', () => {
    const result = buildFinanceSummary({ ...base, bookings: [booking({ payu_order_id: 'unmatched' })], photoOrders: [{ id: 3, total_amount: 40000, paid_at: paidAt, payment_id: 'unknown' }], giftCardOrders: [{ id: 4, amount_paid: 30000, currency: 'PLN', paid_at: paidAt, payu_order_id: null, stripe_session_id: 'stripe-session' }] });
    assert.equal(result.receivedPaymentsGross, 0); assert.equal(result.details.unmatchedOnlineEvents, 4);
});

test('time interval is start inclusive / end exclusive and duplicate selected ledger IDs count once', () => {
    const first = payment({ paid_at: start });
    const result = buildFinanceSummary({ ...base, ledger: [first, first, payment({ id: 2, paid_at: end }), payment({ id: 3, paid_at: paidAt, status: 'PENDING' })] });
    assert.equal(result.receivedPaymentsGross, 40000);
});

test('invalid amounts fail closed instead of creating false zero finance', () => {
    for (const amount of [-1, NaN, 0.5, Infinity]) assert.throws(() => buildFinanceSummary({ ...base, ledger: [payment({ amount })] }), /FINANCE_INVALID_AMOUNT/);
    assert.throws(() => buildFinanceSummary({ ...base, bookings: [booking({ deposit_amount: null })] }), /FINANCE_INVALID_AMOUNT/);
    assert.throws(() => buildFinanceSummary({ ...base, ledger: [payment({ amount: Number.MAX_SAFE_INTEGER }), payment({ id: 2 })] }), /OVERFLOW/);
});

test('Warsaw range uses actual 23h/25h DST civil days', () => {
    const spring = parseFinanceDateRange(new URLSearchParams({ startDate: '2026-03-29', endDate: '2026-03-29' }));
    const autumn = parseFinanceDateRange(new URLSearchParams({ startDate: '2026-10-25', endDate: '2026-10-25' }));
    assert.equal(spring.end.getTime() - spring.start.getTime(), 23 * 3600000);
    assert.equal(autumn.end.getTime() - autumn.start.getTime(), 25 * 3600000);
    assert.equal(spring.start.toISOString(), '2026-03-28T23:00:00.000Z');
});

test('range validation rejects malformed endpoints, duplicate params, unsupported query and excessive ranges', () => {
    for (const params of ['startDate=2026-09-01', 'startDate=&endDate=', 'startDate=2026-02-01&endDate=2026-02-30', 'startDate=2026-01-01&endDate=2026-13-01', 'startDate=2026-01-01&endDate=2025-01-01', 'startDate=2025-01-01&endDate=2026-01-02', 'startDate=0000-01-01&endDate=0000-01-01', 'startDate=2026-01-01&startDate=2026-01-02&endDate=2026-01-02', 'start=2026-01-01']) assert.throws(() => parseFinanceDateRange(new URLSearchParams(params)), Error, params);
    assert.doesNotThrow(() => parseFinanceDateRange(new URLSearchParams('startDate=2024-01-01&endDate=2024-12-31')));
    const range = parseFinanceDateRange(new URLSearchParams(), new Date('2026-08-31T22:30:00Z'));
    assert.equal(range.startDate, '2026-08-05'); assert.equal(range.endDate, '2026-09-01');
});
