import { createHash } from 'node:crypto';
import { z } from 'zod';

// Pure, server-side preflight only. The adapter MUST load authenticated records,
// settled payment/refund totals and immutable approvals from storage, never a
// browser payload. Hashes bind revisions; they are NOT signatures or authorization.
// Recheck under a transaction/outbox lock before sending. This module neither
// submits orders nor supplies concurrency protection, idempotency or API readiness.
// MVP payment policy: settled minus refunded covers the ENTIRE order, including
// services and shipping. Deposits, credit terms and B2B milestone releases are not
// supported. amountGrosze is an immutable LINE TOTAL with quantity and agreed
// discounts already included, never a unit price. Free print samples are excluded.
const id = z.string().trim().min(1).max(160);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const money = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const instant = z.number().int().nonnegative().max(8_640_000_000_000_000);
const attributes = z.record(z.string().min(1).max(80), z.string().min(1).max(160));
const asset = z.object({
  id, sha256: hash, orderId: id, customerId: id,
  kind: z.enum(['preview', 'final']),
  preflight: z.enum(['pending', 'passed', 'failed']),
}).strict();
const printLine = z.object({
  id, kind: z.literal('print'), amountGrosze: money.refine(value => value > 0),
  sku: z.string().regex(/^[A-Za-z0-9_-]{1,100}$/),
  attributes,
  quantity: z.number().int().min(1).max(100),
  // This first contract deliberately handles one print area only; books need
  // their own qualified multi-area adapter, not a silent default.
  printArea: z.literal('default'),
  crop: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1),
    width: z.number().positive().max(1), height: z.number().positive().max(1),
  }).strict().refine(value => value.x + value.width <= 1 && value.y + value.height <= 1),
  asset: asset.nullable(),
  approval: z.object({ fingerprint: hash, approvedAtMs: instant }).strict().nullable(),
}).strict();
const serviceLine = z.object({
  id, kind: z.enum(['session', 'tour', 'installation']), amountGrosze: money,
}).strict();
export const prodigiReleaseInput = z.object({
  orderId: id, customerId: id, currency: z.literal('PLN'), nowMs: instant,
  cancelled: z.boolean(),
  submission: z.enum(['not_submitted', 'submitting', 'submitted', 'unknown']),
  session: z.enum(['not_required', 'awaiting', 'completed']),
  lines: z.array(z.discriminatedUnion('kind', [printLine, serviceLine])).min(1).max(100),
  shippingGrosze: money,
  payment: z.object({ settledGrosze: money, refundedGrosze: money,
    requiredGrosze: money, disputed: z.boolean() }).strict(),
  delivery: z.object({ recipient: id, addressLine1: id, addressLine2: id.optional(),
    city: id, postalCode: id, countryCode: z.string().regex(/^[A-Z]{2}$/), service: id,
  }).strict(),
  // Operational validity window set by the future quote adapter. This does not
  // assert that Prodigi guarantees a price until this timestamp.
  quote: z.object({ fingerprint: hash, obtainedAtMs: instant, expiresAtMs: instant,
    providerCostGrosze: money.refine(value => value > 0), currency: z.literal('PLN'),
  }).strict().nullable(),
  publicationApproved: z.boolean().optional(),
}).strict();
export type ProdigiReleaseInput = z.infer<typeof prodigiReleaseInput>;
type PrintLine = z.infer<typeof printLine>;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') return `{${Object.entries(value)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}
function digest(value: unknown) { return createHash('sha256').update(canonical(value)).digest('hex'); }
function specification(line: PrintLine) {
  const { approval: _approval, ...spec } = line;
  return spec;
}
export function createPrintApprovalFingerprint(orderId: string, customerId: string, line: PrintLine): string {
  return digest({ version: 1, orderId: id.parse(orderId), customerId: id.parse(customerId),
    line: specification(printLine.parse(line)) });
}
function quoteFingerprint(input: ProdigiReleaseInput): string {
  return digest({ version: 1, orderId: input.orderId, customerId: input.customerId,
    currency: input.currency, delivery: input.delivery, shippingGrosze: input.shippingGrosze,
    requiredGrosze: input.payment.requiredGrosze,
    lines: input.lines.filter((line): line is PrintLine => line.kind === 'print')
      .map(specification).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  });
}
export function createReleaseQuoteFingerprint(input: unknown): string {
  return quoteFingerprint(prodigiReleaseInput.parse(input));
}
export type ReleaseBlockerCode = 'INVALID_INPUT' | 'DUPLICATE_LINE' | 'NO_PRINT_LINES'
  | 'CANCELLED' | 'SUBMISSION_NOT_NEW' | 'AWAITING_SESSION'
  | 'INVALID_PAYMENT_TOTALS' | 'PAYMENT_REQUIRED_MISMATCH' | 'PAYMENT_INSUFFICIENT' | 'PAYMENT_DISPUTED'
  | 'FINAL_ASSET_REQUIRED' | 'ASSET_SCOPE_MISMATCH' | 'ASSET_PREFLIGHT_REQUIRED'
  | 'PROOF_APPROVAL_REQUIRED' | 'PROOF_APPROVAL_STALE' | 'PROOF_APPROVAL_IN_FUTURE'
  | 'QUOTE_REQUIRED' | 'QUOTE_STALE' | 'QUOTE_EXPIRED' | 'QUOTE_INVALID_TIME';
export interface ReleaseDecision {
  readyForSubmission: boolean;
  blockers: { code: ReleaseBlockerCode; lineId?: string }[];
  // IDs only, never a provider payload, file URL or personal delivery information.
  eligiblePrintLineIds: string[];
}
export function evaluateProdigiRelease(input: unknown): ReleaseDecision {
  const parsed = prodigiReleaseInput.safeParse(input);
  if (!parsed.success) return { readyForSubmission: false, blockers: [{ code: 'INVALID_INPUT' }], eligiblePrintLineIds: [] };
  const data = parsed.data;
  const blockers: ReleaseDecision['blockers'] = [];
  const block = (code: ReleaseBlockerCode, lineId?: string) => blockers.push(lineId ? { code, lineId } : { code });
  if (new Set(data.lines.map(line => line.id)).size !== data.lines.length) block('DUPLICATE_LINE');
  if (data.cancelled) block('CANCELLED');
  if (data.submission !== 'not_submitted') block('SUBMISSION_NOT_NEW');
  if (data.session === 'awaiting') block('AWAITING_SESSION');
  const expected = data.lines.reduce((sum, line) => sum + BigInt(line.amountGrosze), BigInt(data.shippingGrosze));
  const payment = data.payment;
  if (payment.refundedGrosze > payment.settledGrosze || expected > BigInt(Number.MAX_SAFE_INTEGER)) block('INVALID_PAYMENT_TOTALS');
  if (expected !== BigInt(payment.requiredGrosze)) block('PAYMENT_REQUIRED_MISMATCH');
  if (payment.settledGrosze - payment.refundedGrosze < payment.requiredGrosze) block('PAYMENT_INSUFFICIENT');
  if (payment.disputed) block('PAYMENT_DISPUTED');
  const prints = data.lines.filter((line): line is PrintLine => line.kind === 'print');
  if (!prints.length) block('NO_PRINT_LINES');
  for (const line of prints) {
    if (!line.asset || line.asset.kind !== 'final') block('FINAL_ASSET_REQUIRED', line.id);
    if (line.asset && (line.asset.customerId !== data.customerId || line.asset.orderId !== data.orderId)) block('ASSET_SCOPE_MISMATCH', line.id);
    if (!line.asset || line.asset.preflight !== 'passed') block('ASSET_PREFLIGHT_REQUIRED', line.id);
    if (!line.approval) block('PROOF_APPROVAL_REQUIRED', line.id);
    else {
      if (line.approval.fingerprint !== createPrintApprovalFingerprint(data.orderId, data.customerId, line)) block('PROOF_APPROVAL_STALE', line.id);
      if (line.approval.approvedAtMs > data.nowMs) block('PROOF_APPROVAL_IN_FUTURE', line.id);
    }
  }
  if (!data.quote) block('QUOTE_REQUIRED');
  else {
    if (data.quote.fingerprint !== quoteFingerprint(data)) block('QUOTE_STALE');
    if (data.quote.expiresAtMs <= data.nowMs) block('QUOTE_EXPIRED');
    if (data.quote.obtainedAtMs > data.nowMs || data.quote.expiresAtMs <= data.quote.obtainedAtMs) block('QUOTE_INVALID_TIME');
  }
  return { readyForSubmission: blockers.length === 0, blockers,
    eligiblePrintLineIds: blockers.length === 0 ? prints.map(line => line.id) : [] };
}
