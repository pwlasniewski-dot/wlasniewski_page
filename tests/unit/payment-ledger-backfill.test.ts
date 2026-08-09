import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateRefunds, payuIdFromNote, reconcileLedgerCandidates, stableHistoryId } from '../../src/lib/payments/ledger-backfill';
import { sumUnledgeredBookingPayments } from '../../src/lib/analytics/finance';

const paidAt = new Date('2026-07-10T10:00:00.000Z');
const candidate = { provider: 'PAYU', providerPaymentId: 'payu-1', resourceType: 'BOOKING', resourceId: 7, paymentKind: 'DEPOSIT' as const, amount: 40000, paidAt };

test('backfill creates a previously unseen payment', () => {
  assert.equal(reconcileLedgerCandidates([candidate], [])[0].action, 'CREATE');
});

test('backfill is idempotent for the provider transaction id', () => {
  const existing = [{ provider: 'PAYU', providerPaymentId: 'payu-1', resourceType: 'BOOKING', resourceId: 7, paymentKind: 'DEPOSIT', amount: 40000, paidAt }];
  assert.deepEqual(reconcileLedgerCandidates([candidate], existing)[0], { action: 'SKIP', candidate, reason: 'EXACT_ID' });
});

test('cross-provider record of the same resource event is not counted twice', () => {
  const existing = [{ provider: 'MANUAL', providerPaymentId: 'manual-1', resourceType: 'BOOKING', resourceId: 7, paymentKind: 'DEPOSIT', amount: 40000, paidAt: new Date('2026-07-10T11:00:00Z') }];
  assert.equal(reconcileLedgerCandidates([candidate], existing)[0].action, 'SKIP');
});

test('same provider id with a different amount is a blocking conflict', () => {
  const existing = [{ provider: 'PAYU', providerPaymentId: 'payu-1', resourceType: 'BOOKING', resourceId: 7, paymentKind: 'DEPOSIT', amount: 50000, paidAt }];
  assert.deepEqual(reconcileLedgerCandidates([candidate], existing)[0].action, 'CONFLICT');
});

test('identical source retries are skipped, not counted twice', () => {
  const decisions = reconcileLedgerCandidates([candidate, { ...candidate }], []);
  assert.equal(decisions[0].action, 'CREATE');
  assert.equal(decisions[1].action, 'SKIP');
});

test('provider id reused for a different amount is a blocking source conflict', () => {
  const decisions = reconcileLedgerCandidates([candidate, { ...candidate, amount: 123 }], []);
  assert.equal(decisions[1].action, 'CONFLICT');
});

test('manual history ids are deterministic', () => {
  assert.equal(stableHistoryId('BOOKING', 7, 'DEPOSIT', paidAt), 'booking-7-deposit-2026-07-10T10:00:00.000Z');
});

test('PayU id is extracted from current contract and workshop notes', () => {
  assert.equal(payuIdFromNote('[PayU] Zaliczka opłacona (abc-123) 500.00 PLN'), 'abc-123');
  assert.equal(payuIdFromNote('[PayU] Opłacono całość (xyz_9)'), 'xyz_9');
});

test('legacy fallback excludes booking events already represented in the ledger', () => {
  const start = new Date('2026-07-01T00:00:00Z');
  const end = new Date('2026-08-01T00:00:00Z');
  const bookings = [{ id: 7, deposit_amount: 40000, deposit_paid_at: paidAt, remaining_amount: 60000, remaining_paid_at: new Date('2026-07-20T10:00:00Z') }];
  assert.equal(sumUnledgeredBookingPayments(bookings, new Set(['7:DEPOSIT']), start, end), 60000);
  assert.equal(sumUnledgeredBookingPayments(bookings, new Set(['7:DEPOSIT', '7:REMAINING']), start, end), 0);
});

test('refunds sharing one cart payment are aggregated before ledger update', () => {
  const refunds = aggregateRefunds([
    { providerPaymentId: 'cart-1', amount: 1000, refundedAt: new Date('2026-07-01T10:00:00Z'), resource: 'BOOKING:1' },
    { providerPaymentId: 'cart-1', amount: 2000, refundedAt: new Date('2026-07-02T10:00:00Z'), resource: 'BOOKING:2' },
  ]);
  assert.equal(refunds.length, 1);
  assert.equal(refunds[0].amount, 3000);
  assert.equal(refunds[0].refundedAt.toISOString(), '2026-07-02T10:00:00.000Z');
});
