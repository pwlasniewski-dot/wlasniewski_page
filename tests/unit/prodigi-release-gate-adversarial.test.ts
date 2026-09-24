import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPrintApprovalFingerprint, createReleaseQuoteFingerprint,
  evaluateProdigiRelease, type ProdigiReleaseInput,
} from '../../src/lib/fulfillment/prodigi-release-gate';

// Independent reviewer fixture: synthetic records, no credentials or provider calls.
function fixture(): ProdigiReleaseInput {
  const order: ProdigiReleaseInput = {
    orderId: 'order-A', customerId: 'customer-A', currency: 'PLN', nowMs: 10_000,
    cancelled: false, submission: 'not_submitted', session: 'completed',
    lines: [{
      id: 'print-A', kind: 'print', amountGrosze: 50_000, sku: 'SKU-1',
      attributes: { frame: 'black' }, quantity: 2, printArea: 'default',
      crop: { x: 0, y: 0, width: 1, height: 1 },
      asset: { id: 'asset-A', sha256: 'a'.repeat(64), orderId: 'order-A',
        customerId: 'customer-A', kind: 'final', preflight: 'passed' },
      approval: null,
    }, { id: 'session-A', kind: 'session', amountGrosze: 10_000 }],
    shippingGrosze: 2_000,
    payment: { settledGrosze: 62_000, refundedGrosze: 0, requiredGrosze: 62_000, disputed: false },
    delivery: { recipient: 'Test', addressLine1: 'Test 1', city: 'Test',
      postalCode: '00-001', countryCode: 'PL', service: 'courier' },
    quote: null,
  };
  const print = getPrint(order);
  print.approval = { fingerprint: createPrintApprovalFingerprint(order.orderId, order.customerId, print), approvedAtMs: 9_000 };
  order.quote = { fingerprint: createReleaseQuoteFingerprint(order), obtainedAtMs: 9_000,
    expiresAtMs: 11_000, providerCostGrosze: 30_000, currency: 'PLN' };
  return order;
}

function getPrint(order: ProdigiReleaseInput) {
  const line = order.lines[0];
  assert.equal(line.kind, 'print');
  if (line.kind !== 'print') throw new Error('Fixture must start with print');
  return line;
}

test('POD-QA-00: independent positive baseline includes only print IDs', () => {
  const result = evaluateProdigiRelease(fixture());
  assert.equal(result.readyForSubmission, true);
  assert.deepEqual(result.eligiblePrintLineIds, ['print-A']);
});

const scenarios: [string, (order: ProdigiReleaseInput) => void, string][] = [
  ['foreign customer', o => { o.customerId = 'customer-B'; }, 'ASSET_SCOPE_MISMATCH'],
  ['cross order proof replay', o => { o.orderId = 'order-B'; getPrint(o).asset!.orderId = 'order-B'; }, 'PROOF_APPROVAL_STALE'],
  ['quantity changed after approval', o => { getPrint(o).quantity = 3; }, 'PROOF_APPROVAL_STALE'],
  ['crop changed after approval', o => { getPrint(o).crop.width = .8; }, 'PROOF_APPROVAL_STALE'],
  ['address changed after quote', o => { o.delivery.addressLine1 = 'Elsewhere 1'; }, 'QUOTE_STALE'],
  ['one grosz refund after payment', o => { o.payment.refundedGrosze = 1; }, 'PAYMENT_INSUFFICIENT'],
  ['unknown submission state', o => { o.submission = 'unknown'; }, 'SUBMISSION_NOT_NEW'],
  ['approval from future', o => { getPrint(o).approval!.approvedAtMs = 10_001; }, 'PROOF_APPROVAL_IN_FUTURE'],
  ['quote expiry equality boundary', o => { o.quote!.expiresAtMs = 10_000; }, 'QUOTE_EXPIRED'],
  ['duplicate line ID across print and service', o => { o.lines[1].id = 'print-A'; }, 'DUPLICATE_LINE'],
  ['preview asset substituted for final', o => { getPrint(o).asset!.kind = 'preview'; }, 'FINAL_ASSET_REQUIRED'],
  ['publication permission is not print approval', o => { getPrint(o).approval = null; o.publicationApproved = true; }, 'PROOF_APPROVAL_REQUIRED'],
];

scenarios.forEach(([name, change, blocker], index) => {
  test(`POD-QA-${String(index + 1).padStart(2, '0')}: ${name}`, () => {
    const order = fixture();
    change(order);
    const result = evaluateProdigiRelease(order);
    assert.equal(result.readyForSubmission, false);
    assert.deepEqual(result.eligiblePrintLineIds, []);
    assert(result.blockers.some(item => item.code === blocker), `Expected ${blocker}`);
  });
});
