export type LedgerCandidate = {
  provider: string;
  providerPaymentId: string;
  externalOrderId?: string | null;
  resourceType: string;
  resourceId: number | null;
  paymentKind: 'DEPOSIT' | 'REMAINING' | 'FULL';
  amount: number;
  currency?: string;
  paidAt: Date;
  metadata?: Record<string, unknown>;
};

export type ExistingLedgerEntry = {
  provider: string;
  providerPaymentId: string;
  resourceType: string | null;
  resourceId: number | null;
  paymentKind: string;
  amount: number;
  paidAt: Date;
};

export type BackfillDecision =
  | { action: 'CREATE'; candidate: LedgerCandidate }
  | { action: 'SKIP'; candidate: LedgerCandidate; reason: 'EXACT_ID' | 'RESOURCE_EVENT' | 'DUPLICATE_SOURCE' }
  | { action: 'CONFLICT'; candidate: LedgerCandidate; reason: string };

const EVENT_TOLERANCE_MS = 36 * 60 * 60 * 1000;

export function stableHistoryId(resourceType: string, resourceId: number, kind: string, paidAt: Date) {
  return `${resourceType.toLowerCase()}-${resourceId}-${kind.toLowerCase()}-${paidAt.toISOString()}`;
}

function sameResourceEvent(candidate: LedgerCandidate, existing: ExistingLedgerEntry) {
  return existing.resourceType === candidate.resourceType
    && existing.resourceId === candidate.resourceId
    && existing.paymentKind === candidate.paymentKind
    && existing.amount === candidate.amount
    && Math.abs(existing.paidAt.getTime() - candidate.paidAt.getTime()) <= EVENT_TOLERANCE_MS;
}

export function reconcileLedgerCandidates(
  candidates: LedgerCandidate[],
  existingEntries: ExistingLedgerEntry[],
): BackfillDecision[] {
  const seenCandidateIds = new Map<string, LedgerCandidate>();
  const existingById = new Map(existingEntries.map(entry => [
    `${entry.provider}:${entry.providerPaymentId}`,
    entry,
  ]));

  return candidates.map(candidate => {
    const key = `${candidate.provider}:${candidate.providerPaymentId}`;
    const duplicateCandidate = seenCandidateIds.get(key);
    if (duplicateCandidate) {
      const same = duplicateCandidate.amount === candidate.amount
        && duplicateCandidate.resourceType === candidate.resourceType
        && duplicateCandidate.resourceId === candidate.resourceId
        && duplicateCandidate.paymentKind === candidate.paymentKind;
      return same
        ? { action: 'SKIP', candidate, reason: 'DUPLICATE_SOURCE' }
        : { action: 'CONFLICT', candidate, reason: 'PROVIDER_ID_REUSED_FOR_DIFFERENT_EVENT' };
    }
    seenCandidateIds.set(key, candidate);

    const exact = existingById.get(key);
    if (exact) {
      const consistent = exact.amount === candidate.amount
        && (!exact.resourceType || exact.resourceType === candidate.resourceType)
        && (!exact.resourceId || exact.resourceId === candidate.resourceId);
      return consistent
        ? { action: 'SKIP', candidate, reason: 'EXACT_ID' }
        : { action: 'CONFLICT', candidate, reason: 'EXACT_ID_DATA_MISMATCH' };
    }

    if (existingEntries.some(entry => sameResourceEvent(candidate, entry))) {
      return { action: 'SKIP', candidate, reason: 'RESOURCE_EVENT' };
    }
    return { action: 'CREATE', candidate };
  });
}

export function isPositiveMoney(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

export function payuIdFromNote(note: string | null | undefined) {
  if (!note) return null;
  return note.match(/(?:PayU(?:\s+ID)?|opłacona|opłacono)[^\n()]*\(([A-Za-z0-9_-]+)\)/i)?.[1]
    || note.match(/PayU(?:\s+ID)?\s*[:#]?\s*([A-Za-z0-9_-]+)/i)?.[1]
    || null;
}

export function aggregateRefunds<T extends { providerPaymentId: string; amount: number; refundedAt: Date; resource: string }>(refunds: T[]) {
  return Array.from(refunds.reduce((map, refund) => {
    const current = map.get(refund.providerPaymentId);
    if (current) {
      current.amount += refund.amount;
      if (refund.refundedAt > current.refundedAt) current.refundedAt = refund.refundedAt;
      current.resource = `${current.resource},${refund.resource}`;
    } else {
      map.set(refund.providerPaymentId, { ...refund });
    }
    return map;
  }, new Map<string, { providerPaymentId: string; amount: number; refundedAt: Date; resource: string }>()).values());
}
