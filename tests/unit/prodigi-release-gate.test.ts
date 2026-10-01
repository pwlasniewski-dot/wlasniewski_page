import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProdigiRelease, createPrintApprovalFingerprint, createReleaseQuoteFingerprint,
  type ProdigiReleaseInput } from '../../src/lib/fulfillment/prodigi-release-gate';

function fixture(): ProdigiReleaseInput {
  const input: ProdigiReleaseInput = {
    orderId: 'order-1', customerId: 'customer-1', currency: 'PLN', nowMs: 1000,
    cancelled: false, submission: 'not_submitted', session: 'completed',
    lines: [{ id: 'print-1', kind: 'print', amountGrosze: 20000, sku: 'GLOBAL-FAP-10X10',
      attributes: { frame: 'black', paper: 'matte' }, quantity: 2, printArea: 'default',
      crop: { x: 0, y: 0, width: 1, height: 1 },
      asset: { id: 'asset-1', sha256: 'a'.repeat(64), orderId: 'order-1', customerId: 'customer-1', kind: 'final', preflight: 'passed' },
      approval: null,
    }, { id: 'session-1', kind: 'session', amountGrosze: 50000 },
    { id: 'tour-1', kind: 'tour', amountGrosze: 10000 },
    { id: 'installation-1', kind: 'installation', amountGrosze: 5000 }],
    shippingGrosze: 2000,
    payment: { settledGrosze: 87000, refundedGrosze: 0, requiredGrosze: 87000, disputed: false },
    delivery: { recipient: 'Recipient', addressLine1: 'Street 1', city: 'Torun', postalCode: '87-100', countryCode: 'PL', service: 'Standard' },
    quote: null, publicationApproved: false,
  };
  approve(input);
  return input;
}
function approve(input: ProdigiReleaseInput) {
  for (const line of input.lines) if (line.kind === 'print') line.approval = {
    fingerprint: createPrintApprovalFingerprint(input.orderId, input.customerId, line), approvedAtMs: 900,
  };
  input.quote = { fingerprint: createReleaseQuoteFingerprint(input), obtainedAtMs: 950,
    expiresAtMs: 2000, providerCostGrosze: 10000, currency: 'PLN' };
}
function print(input: ProdigiReleaseInput) {
  const line = input.lines[0]; if (line.kind !== 'print') throw Error('fixture'); return line;
}
function codes(input: unknown) { return evaluateProdigiRelease(input).blockers.map(blocker => blocker.code); }
function blocked(input: unknown, code: string) {
  const result = evaluateProdigiRelease(input);
  assert.equal(result.readyForSubmission, false); assert.deepEqual(result.eligiblePrintLineIds, []);
  assert.ok(result.blockers.some(blocker => blocker.code === code), JSON.stringify(result));
}

test('POD-R01: paid final approved print passes; session, tour and installation never become print submissions', () => {
  assert.deepEqual(evaluateProdigiRelease(fixture()), { readyForSubmission: true, blockers: [], eligiblePrintLineIds: ['print-1'] });
});
test('POD-R02: paid pre-session buffer is blocked, even with final files and proof', () => {
  const input = fixture(); input.session = 'awaiting'; blocked(input, 'AWAITING_SESSION');
});
test('POD-R03: cancellation, submitted, submitting and unknown submission block retries', () => {
  const input = fixture(); input.cancelled = true; blocked(input, 'CANCELLED');
  for (const status of ['submitted', 'submitting', 'unknown'] as const) {
    const next = fixture(); next.submission = status; blocked(next, 'SUBMISSION_NOT_NEW');
  }
});
test('POD-R04: publication consent is not print approval; print does not require publication', () => {
  const input = fixture(); input.publicationApproved = true; print(input).approval = null;
  blocked(input, 'PROOF_APPROVAL_REQUIRED'); assert.equal(evaluateProdigiRelease(fixture()).readyForSubmission, true);
});
test('POD-R05: preview or missing asset cannot pass even after a new proof fingerprint', () => {
  for (const missing of [true, false]) {
    const input = fixture(); if (missing) print(input).asset = null; else print(input).asset!.kind = 'preview';
    approve(input); blocked(input, 'FINAL_ASSET_REQUIRED');
  }
});
test('POD-R06: preflight pending/failed and foreign customer/order assets block', () => {
  for (const preflight of ['pending', 'failed'] as const) {
    const input = fixture(); print(input).asset!.preflight = preflight; approve(input); blocked(input, 'ASSET_PREFLIGHT_REQUIRED');
  }
  for (const field of ['orderId', 'customerId'] as const) {
    const input = fixture(); print(input).asset![field] = 'foreign'; approve(input); blocked(input, 'ASSET_SCOPE_MISMATCH');
  }
});
test('POD-R07: SKU, variant, crop, quantity, amount and final content changes invalidate proof and quote', () => {
  const mutations = [
    (input: ProdigiReleaseInput) => { print(input).sku = 'OTHER'; },
    (input: ProdigiReleaseInput) => { print(input).attributes.frame = 'white'; },
    (input: ProdigiReleaseInput) => { print(input).crop.width = 0.5; },
    (input: ProdigiReleaseInput) => { print(input).quantity = 3; },
    (input: ProdigiReleaseInput) => { print(input).amountGrosze += 1; },
    (input: ProdigiReleaseInput) => { print(input).asset!.sha256 = 'b'.repeat(64); },
    (input: ProdigiReleaseInput) => { print(input).asset!.id = 'replacement'; },
  ];
  for (const mutate of mutations) { const input = fixture(); mutate(input); blocked(input, 'PROOF_APPROVAL_STALE'); blocked(input, 'QUOTE_STALE'); }
});
test('POD-R08: copied proof does not apply to another order, customer or line', () => {
  for (const field of ['orderId', 'customerId'] as const) {
    const input = fixture(); input[field] = 'another'; print(input).asset![field] = 'another'; blocked(input, 'PROOF_APPROVAL_STALE');
  }
  const input = fixture(); print(input).id = 'another-line'; blocked(input, 'PROOF_APPROVAL_STALE');
});
test('POD-R09: address or shipping service changes invalidate quote but not print proof', () => {
  for (const field of ['recipient', 'addressLine1', 'city', 'postalCode', 'service'] as const) {
    const input = fixture(); input.delivery[field] += ' changed'; blocked(input, 'QUOTE_STALE');
    assert.equal(codes(input).includes('PROOF_APPROVAL_STALE'), false);
  }
});
test('POD-R10: absent quote, expiry boundary and invalid quote chronology block', () => {
  const missing = fixture(); missing.quote = null; blocked(missing, 'QUOTE_REQUIRED');
  const expired = fixture(); expired.quote!.expiresAtMs = expired.nowMs; blocked(expired, 'QUOTE_EXPIRED');
  for (const change of [(input: ProdigiReleaseInput) => { input.quote!.obtainedAtMs = 1001; },
    (input: ProdigiReleaseInput) => { input.quote!.expiresAtMs = input.quote!.obtainedAtMs; }]) {
    const input = fixture(); change(input); blocked(input, 'QUOTE_INVALID_TIME');
  }
});
test('POD-R11: future proof timestamp blocks', () => {
  const input = fixture(); print(input).approval!.approvedAtMs = 1001; blocked(input, 'PROOF_APPROVAL_IN_FUTURE');
});
test('POD-R12: underpayment, refund and dispute block; overpayment is allowed after refund reconciliation', () => {
  const unpaid = fixture(); unpaid.payment.settledGrosze -= 1; blocked(unpaid, 'PAYMENT_INSUFFICIENT');
  const refunded = fixture(); refunded.payment.refundedGrosze = 1; blocked(refunded, 'PAYMENT_INSUFFICIENT');
  const disputed = fixture(); disputed.payment.disputed = true; blocked(disputed, 'PAYMENT_DISPUTED');
  const overpaid = fixture(); overpaid.payment.settledGrosze += 100; overpaid.payment.refundedGrosze = 100;
  assert.equal(evaluateProdigiRelease(overpaid).readyForSubmission, true);
});
test('POD-R13: required amount must equal all agreed lines plus shipping, never supplier cost', () => {
  const input = fixture(); input.payment.requiredGrosze = input.quote!.providerCostGrosze;
  blocked(input, 'PAYMENT_REQUIRED_MISMATCH');
  const inconsistent = fixture(); inconsistent.payment.refundedGrosze = 100000; blocked(inconsistent, 'INVALID_PAYMENT_TOTALS');
});
test('POD-R14: runtime input rejects negative, decimal, NaN, unsafe money, non-PLN and unknown fields', () => {
  for (const value of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, '87000']) {
    const input = fixture() as any; input.payment.settledGrosze = value; blocked(input, 'INVALID_INPUT');
  }
  for (const input of [null, {}, { ...fixture(), currency: 'EUR' }, { ...fixture(), authorized: true },
    { ...fixture(), quote: { ...fixture().quote, currency: 'EUR' } }]) blocked(input, 'INVALID_INPUT');
});
test('POD-R15: arithmetic overflow is rejected using exact integer addition', () => {
  const input = fixture(); input.lines[0].amountGrosze = Number.MAX_SAFE_INTEGER; blocked(input, 'INVALID_PAYMENT_TOTALS');
});
test('POD-R16: duplicate IDs and service-only orders cannot be submitted', () => {
  const input = fixture(); input.lines[1].id = input.lines[0].id; blocked(input, 'DUPLICATE_LINE');
  const services = fixture(); services.lines = services.lines.filter(line => line.kind !== 'print'); blocked(services, 'NO_PRINT_LINES');
});
test('POD-R17: multiple prints require each individual approval', () => {
  const input = fixture(); const second = structuredClone(print(input)); second.id = 'print-2';
  input.lines.push(second); input.payment.requiredGrosze += second.amountGrosze; input.payment.settledGrosze += second.amountGrosze;
  approve(input); assert.deepEqual(evaluateProdigiRelease(input).eligiblePrintLineIds, ['print-1', 'print-2']);
  second.approval = null; blocked(input, 'PROOF_APPROVAL_REQUIRED');
});
test('POD-R18: proof and quote canonicalization ignore property order and print ordering', () => {
  const input = fixture(); print(input).attributes = { paper: 'matte', frame: 'black' };
  input.lines.reverse(); assert.equal(evaluateProdigiRelease(input).readyForSubmission, true);
});
test('POD-R19: evaluation is deterministic, does not mutate or expose delivery, asset and payment', () => {
  const input = fixture(); const before = structuredClone(input);
  assert.deepEqual(evaluateProdigiRelease(input), evaluateProdigiRelease(input)); assert.deepEqual(input, before);
  const output = JSON.stringify(evaluateProdigiRelease(input));
  for (const secret of ['Recipient', 'Street 1', 'asset-1', '87000', 'customer-1']) assert.equal(output.includes(secret), false);
});
test('POD-R20: quantity bounds, crop bounds, unsupported print area and malformed digest fail closed', () => {
  for (const change of [(input: any) => { input.lines[0].quantity = 0; },
    (input: any) => { input.lines[0].amountGrosze = 0; },
    (input: any) => { input.lines[0].crop.x = 0.5; },
    (input: any) => { input.lines[0].printArea = 'cover'; },
    (input: any) => { input.lines[0].asset.sha256 = 'not-sha256'; }]) {
    const input = fixture(); change(input); blocked(input, 'INVALID_INPUT');
  }
});
