import prisma from '../src/lib/db/prisma';
import {
  aggregateRefunds,
  isPositiveMoney,
  LedgerCandidate,
  payuIdFromNote,
  reconcileLedgerCandidates,
  stableHistoryId,
} from '../src/lib/payments/ledger-backfill';

const apply = process.argv.includes('--apply');

function manualCandidate(
  resourceType: string,
  resourceId: number,
  paymentKind: LedgerCandidate['paymentKind'],
  amount: number,
  paidAt: Date,
  source: string,
): LedgerCandidate {
  return {
    provider: 'MANUAL_HISTORY',
    providerPaymentId: stableHistoryId(resourceType, resourceId, paymentKind, paidAt),
    resourceType,
    resourceId,
    paymentKind,
    amount,
    paidAt,
    currency: 'PLN',
    metadata: { source, backfilled: true },
  };
}

async function collectCandidates() {
  const candidates: LedgerCandidate[] = [];
  const refunds: Array<{ providerPaymentId: string; amount: number; refundedAt: Date; resource: string }> = [];
  const unresolved: Array<Record<string, unknown>> = [];
  const [payuLogs, bookings, photoOrders, giftCards, contracts, workshops, challenges] = await Promise.all([
    prisma.systemLog.findMany({ where: { module: 'PAYMENT', message: { contains: 'PayU Notify: COMPLETED' } }, select: { id: true, metadata: true, created_at: true } }),
    prisma.booking.findMany({
      where: { OR: [{ deposit_paid_at: { not: null } }, { remaining_paid_at: { not: null } }, { payu_order_id: { not: null } }, { refund_status: 'COMPLETED' }] },
      select: { id: true, payment_plan: true, deposit_amount: true, deposit_paid_at: true, remaining_amount: true, remaining_paid_at: true, payu_order_id: true, price: true, updated_at: true, refund_amount: true, refund_status: true, refunded_at: true },
    }),
    prisma.photoOrder.findMany({ where: { payment_status: 'paid', paid_at: { not: null } }, select: { id: true, payment_id: true, total_amount: true, paid_at: true } }),
    prisma.giftCardOrder.findMany({ where: { payment_status: { in: ['paid', 'completed'] }, paid_at: { not: null } }, select: { id: true, payu_order_id: true, amount_paid: true, paid_at: true, currency: true } }),
    prisma.contract.findMany({ where: { deposit_paid_at: { not: null } }, select: { id: true, deposit_amount: true, deposit_paid_at: true, deposit_note: true, contract_number: true } }),
    prisma.workshopOffer.findMany({ where: { OR: [{ deposit_paid_at: { not: null } }, { status: 'paid' }] }, select: { id: true, price: true, deposit_amount: true, deposit_paid_at: true, status: true, notes: true, updated_at: true } }),
    prisma.photoChallenge.findMany({ where: { payment_status: { in: ['paid', 'completed'] } }, select: { id: true, payment_id: true, paid_amount: true, completed_at: true } }),
  ]);

  const payuIdsFromLogs = new Set<string>();
  for (const log of payuLogs) {
    try {
      const metadata = JSON.parse(log.metadata || '{}');
      const order = metadata.fullBody?.order;
      if (!order || order.status !== 'COMPLETED' || !order.orderId || !isPositiveMoney(Number(order.totalAmount))) {
        unresolved.push({ resource: `SYSTEM_LOG:${log.id}`, reason: 'INVALID_COMPLETED_PAYU_LOG' });
        continue;
      }
      const extOrderId = String(order.extOrderId || '');
      const parts = extOrderId.split('_');
      const rawType = parts[0] || 'UNKNOWN';
      const typed = /^[A-Z]+_/.test(extOrderId);
      const resourceId = typed && Number.isInteger(Number(parts[1])) ? Number(parts[1]) : (!typed && Number.isInteger(Number(rawType)) ? Number(rawType) : null);
      const resourceType = typed ? rawType : 'UNKNOWN';
      const paymentKind = parts.includes('deposit') ? 'DEPOSIT' : parts.includes('remaining') ? 'REMAINING' : 'FULL';
      const orderDate = order.orderCreateDate ? new Date(order.orderCreateDate) : log.created_at;
      const paidAt = Number.isNaN(orderDate.getTime()) ? log.created_at : orderDate;
      const providerPaymentId = String(order.orderId);
      payuIdsFromLogs.add(providerPaymentId);
      candidates.push({ provider: 'PAYU', providerPaymentId, externalOrderId: extOrderId || null, resourceType, resourceId, paymentKind, amount: Number(order.totalAmount), paidAt, currency: String(order.currencyCode || 'PLN'), metadata: { source: 'system_logs_payu_notify', logId: log.id, backfilled: true } });
    } catch {
      unresolved.push({ resource: `SYSTEM_LOG:${log.id}`, reason: 'UNPARSEABLE_PAYU_LOG_METADATA' });
    }
  }

  for (const row of photoOrders) {
    if (!row.paid_at || !isPositiveMoney(row.total_amount)) continue;
    if (!row.payment_id) {
      unresolved.push({ resource: `PHOTO_ORDER:${row.id}`, reason: 'MISSING_PAYMENT_ID' });
      continue;
    }
    if (!payuIdsFromLogs.has(row.payment_id)) candidates.push({ provider: 'PAYU', providerPaymentId: row.payment_id, resourceType: 'GALLERY', resourceId: row.id, paymentKind: 'FULL', amount: row.total_amount, paidAt: row.paid_at, currency: 'PLN', metadata: { source: 'photo_orders', backfilled: true } });
  }

  for (const row of giftCards) {
    if (!row.paid_at || !isPositiveMoney(row.amount_paid)) continue;
    if (!row.payu_order_id) {
      unresolved.push({ resource: `GIFT_CARD:${row.id}`, reason: 'MISSING_PAYMENT_ID' });
      continue;
    }
    if (!payuIdsFromLogs.has(row.payu_order_id)) candidates.push({ provider: 'PAYU', providerPaymentId: row.payu_order_id, resourceType: 'GIFT_CARD', resourceId: row.id, paymentKind: 'FULL', amount: row.amount_paid, paidAt: row.paid_at, currency: row.currency, metadata: { source: 'gift_card_orders', backfilled: true } });
  }

  for (const row of bookings) {
    if (row.refund_status === 'COMPLETED' && row.refunded_at && isPositiveMoney(row.refund_amount)) {
      if (row.payu_order_id) refunds.push({ providerPaymentId: row.payu_order_id, amount: row.refund_amount, refundedAt: row.refunded_at, resource: `BOOKING:${row.id}` });
      else unresolved.push({ resource: `BOOKING:${row.id}`, reason: 'COMPLETED_REFUND_WITHOUT_PAYU_PAYMENT_ID', amount: row.refund_amount });
    }
    const events = [
      row.deposit_paid_at && isPositiveMoney(row.deposit_amount) ? { kind: 'DEPOSIT' as const, amount: row.deposit_amount, paidAt: row.deposit_paid_at } : null,
      row.remaining_paid_at && isPositiveMoney(row.remaining_amount) ? { kind: 'REMAINING' as const, amount: row.remaining_amount, paidAt: row.remaining_paid_at } : null,
    ].filter(Boolean) as Array<{ kind: 'DEPOSIT' | 'REMAINING'; amount: number; paidAt: Date }>;
    if (row.payu_order_id && payuIdsFromLogs.has(row.payu_order_id)) {
      continue;
    } else if (events.length === 1 && row.payu_order_id) {
      const event = events[0];
      candidates.push({ provider: 'PAYU', providerPaymentId: row.payu_order_id, resourceType: 'BOOKING', resourceId: row.id, paymentKind: event.kind, amount: event.amount, paidAt: event.paidAt, currency: 'PLN', metadata: { source: 'bookings', backfilled: true } });
    } else if (!row.payu_order_id) {
      events.forEach(event => candidates.push(manualCandidate('BOOKING', row.id, event.kind, event.amount, event.paidAt, 'bookings')));
    } else if (events.length > 1) {
      unresolved.push({ resource: `BOOKING:${row.id}`, reason: 'ONE_PAYU_ID_FOR_MULTIPLE_SPLIT_EVENTS', paymentId: row.payu_order_id });
    } else {
      unresolved.push({ resource: `BOOKING:${row.id}`, reason: 'PAYU_ID_WITHOUT_RELIABLE_PAID_AT_OR_AMOUNT', paymentId: row.payu_order_id });
    }
  }

  for (const row of contracts) {
    if (!row.deposit_paid_at || !isPositiveMoney(row.deposit_amount)) continue;
    const amount = row.deposit_amount * 100;
    const payuId = payuIdFromNote(row.deposit_note);
    if (payuId && payuIdsFromLogs.has(payuId)) continue;
    candidates.push(payuId
      ? { provider: 'PAYU', providerPaymentId: payuId, externalOrderId: row.contract_number, resourceType: 'CONTRACT', resourceId: row.id, paymentKind: 'DEPOSIT', amount, paidAt: row.deposit_paid_at, currency: 'PLN', metadata: { source: 'contracts', backfilled: true } }
      : manualCandidate('CONTRACT', row.id, 'DEPOSIT', amount, row.deposit_paid_at, 'contracts'));
  }

  for (const row of workshops) {
    if (row.deposit_paid_at && isPositiveMoney(row.deposit_amount)) {
      const amount = row.deposit_amount * 100;
      const payuId = payuIdFromNote(row.notes);
      if (payuId && payuIdsFromLogs.has(payuId)) continue;
      candidates.push(payuId
        ? { provider: 'PAYU', providerPaymentId: payuId, resourceType: 'WORKSHOP', resourceId: row.id, paymentKind: 'DEPOSIT', amount, paidAt: row.deposit_paid_at, currency: 'PLN', metadata: { source: 'workshop_offers', backfilled: true } }
        : manualCandidate('WORKSHOP', row.id, 'DEPOSIT', amount, row.deposit_paid_at, 'workshop_offers'));
    }
    if (row.status === 'paid' && !row.deposit_paid_at) {
      unresolved.push({ resource: `WORKSHOP:${row.id}`, reason: 'FULL_PAYMENT_WITHOUT_RELIABLE_PAID_AT_OR_PAYMENT_ID' });
    }
  }

  for (const row of challenges) {
    if (!row.payment_id || !isPositiveMoney(row.paid_amount)) {
      unresolved.push({ resource: `CHALLENGE:${row.id}`, reason: 'MISSING_PAYMENT_ID_AMOUNT_OR_DATE' });
      continue;
    }
    if (payuIdsFromLogs.has(row.payment_id)) continue;
    unresolved.push({ resource: `CHALLENGE:${row.id}`, reason: 'MISSING_RELIABLE_PAYMENT_DATE', paymentId: row.payment_id, amount: row.paid_amount, completedAt: row.completed_at });
  }
  return { candidates, refunds, unresolved };
}

async function main() {
  const { candidates, refunds, unresolved } = await collectCandidates();
  const existing = await prisma.paymentLedger.findMany({ select: { provider: true, provider_payment_id: true, resource_type: true, resource_id: true, payment_kind: true, amount: true, paid_at: true, refunded_amount: true, refunded_at: true } });
  const decisions = reconcileLedgerCandidates(candidates, existing.map(row => ({ provider: row.provider, providerPaymentId: row.provider_payment_id, resourceType: row.resource_type, resourceId: row.resource_id, paymentKind: row.payment_kind, amount: row.amount, paidAt: row.paid_at })));
  const creates = decisions.filter(decision => decision.action === 'CREATE');
  const conflicts = decisions.filter(decision => decision.action === 'CONFLICT');
  const knownPayuIds = new Set([
    ...existing.filter(row => row.provider === 'PAYU').map(row => row.provider_payment_id),
    ...candidates.filter(row => row.provider === 'PAYU').map(row => row.providerPaymentId),
  ]);
  const groupedRefunds = aggregateRefunds(refunds);
  const refundConflicts: Array<Record<string, unknown>> = [];
  const refundUpdates = groupedRefunds.filter(refund => {
    if (!knownPayuIds.has(refund.providerPaymentId)) {
      unresolved.push({ resource: refund.resource, reason: 'REFUND_PAYMENT_NOT_FOUND_IN_LEDGER_OR_BACKFILL', paymentId: refund.providerPaymentId });
      return false;
    }
    const current = existing.find(row => row.provider === 'PAYU' && row.provider_payment_id === refund.providerPaymentId);
    if (current?.refunded_at && current.refunded_amount !== refund.amount) {
      refundConflicts.push({ resource: refund.resource, reason: 'REFUND_AMOUNT_MISMATCH', paymentId: refund.providerPaymentId, ledgerAmount: current.refunded_amount, sourceAmount: refund.amount });
      return false;
    }
    return !current?.refunded_at;
  });
  const allConflicts = [...conflicts, ...refundConflicts];

  if (apply && allConflicts.length === 0) {
    for (const decision of creates) {
      const candidate = decision.candidate;
      await prisma.paymentLedger.upsert({
        where: { provider_provider_payment_id: { provider: candidate.provider, provider_payment_id: candidate.providerPaymentId } },
        create: { provider: candidate.provider, provider_payment_id: candidate.providerPaymentId, external_order_id: candidate.externalOrderId, resource_type: candidate.resourceType, resource_id: candidate.resourceId, payment_kind: candidate.paymentKind, amount: candidate.amount, currency: candidate.currency || 'PLN', status: 'COMPLETED', paid_at: candidate.paidAt, metadata: candidate.metadata },
        update: {},
      });
    }
    for (const refund of refundUpdates) {
      await prisma.paymentLedger.update({
        where: { provider_provider_payment_id: { provider: 'PAYU', provider_payment_id: refund.providerPaymentId } },
        data: { refunded_amount: refund.amount, refunded_at: refund.refundedAt },
      });
    }
  }

  console.log(JSON.stringify({ mode: apply ? 'APPLY' : 'DRY_RUN', candidateCount: candidates.length, createCount: creates.length, skipCount: decisions.filter(d => d.action === 'SKIP').length, refundUpdateCount: refundUpdates.length, conflictCount: allConflicts.length, appliedCount: apply && allConflicts.length === 0 ? creates.length : 0, appliedRefundCount: apply && allConflicts.length === 0 ? refundUpdates.length : 0, conflicts: allConflicts, unresolved }, null, 2));
  if (allConflicts.length) process.exitCode = 2;
}

main().finally(() => prisma.$disconnect());
