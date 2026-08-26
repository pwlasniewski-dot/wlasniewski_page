import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';

export const messageOutboxDualWriteEnabled = () => process.env.MESSAGE_OUTBOX_DUAL_WRITE === 'true';

function canonicalJson(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
    if (value && typeof value === 'object') {
        return `{${Object.entries(value as Record<string, unknown>)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
            .join(',')}}`;
    }
    return JSON.stringify(value) ?? 'null';
}

export function immutablePayloadHash(payload: unknown) {
    return createHash('sha256').update(canonicalJson(payload)).digest('hex');
}

export async function stageEmailOutbox(input: {
    idempotencyKey: string;
    messageType: string;
    recipient: string;
    subject: string;
    payload: Prisma.InputJsonObject;
    entityType?: string;
    entityId?: number;
}) {
    if (!messageOutboxDualWriteEnabled()) return null;
    const payloadHash = immutablePayloadHash(input.payload);
    let outbox;
    try {
        outbox = await prisma.messageOutbox.create({
            data: {
                idempotency_key: input.idempotencyKey,
                message_type: input.messageType,
                recipient: input.recipient,
                subject: input.subject,
                payload: input.payload,
                payload_hash: payloadHash,
                entity_type: input.entityType,
                entity_id: input.entityId,
            },
        });
    } catch (error) {
        const uniqueConflict = typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
        if (!uniqueConflict) throw error;
        outbox = await prisma.messageOutbox.findUnique({ where: { idempotency_key: input.idempotencyKey } });
        if (!outbox) throw error;
    }
    if (outbox.status === 'SENT') return { outbox, claimed: false, alreadySent: true };
    const claim = await prisma.messageOutbox.updateMany({
        where: { id: outbox.id, status: { in: ['PENDING', 'FAILED'] } },
        data: { status: 'SENDING', last_error: null },
    });
    return { outbox: { ...outbox, status: claim.count === 1 ? 'SENDING' : outbox.status }, claimed: claim.count === 1, alreadySent: false };
}

export async function completeEmailOutbox(outboxId: string, providerMessageId?: string | null) {
    if (!messageOutboxDualWriteEnabled()) return;
    const outbox = await prisma.messageOutbox.findUnique({ where: { id: outboxId }, select: { attempts: true, status: true } });
    if (!outbox || outbox.status === 'SENT') return;
    const attemptNo = outbox.attempts + 1;
    await prisma.$transaction([
        prisma.messageOutbox.update({
            where: { id: outboxId },
            data: { status: 'SENT', attempts: attemptNo, sent_at: new Date(), last_error: null },
        }),
        prisma.messageDelivery.create({
            data: {
                outbox_id: outboxId, attempt_no: attemptNo, status: 'SENT',
                provider_message_id: providerMessageId || null, completed_at: new Date(),
            },
        }),
    ]);
}

export async function failEmailOutbox(outboxId: string, error: unknown) {
    if (!messageOutboxDualWriteEnabled()) return;
    const outbox = await prisma.messageOutbox.findUnique({ where: { id: outboxId }, select: { attempts: true } });
    if (!outbox) return;
    const attemptNo = outbox.attempts + 1;
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 2000);
    await prisma.$transaction([
        prisma.messageOutbox.update({ where: { id: outboxId }, data: { status: 'FAILED', attempts: attemptNo, last_error: message } }),
        prisma.messageDelivery.create({
            data: { outbox_id: outboxId, attempt_no: attemptNo, status: 'FAILED', error: message, completed_at: new Date() },
        }),
    ]);
}

export async function captureOfferVersion(input: {
    offerId: number;
    payload: Prisma.InputJsonObject;
    pdfKey?: string | null;
    status: string;
    sentAt?: Date;
}) {
    if (!messageOutboxDualWriteEnabled()) return null;
    const aggregate = await prisma.offerVersion.aggregate({ where: { offer_id: input.offerId }, _max: { version: true } });
    return prisma.offerVersion.create({
        data: {
            offer_id: input.offerId,
            version: (aggregate._max.version || 0) + 1,
            payload: input.payload,
            payload_hash: immutablePayloadHash(input.payload),
            pdf_key: input.pdfKey || null,
            status: input.status,
            sent_at: input.sentAt,
        },
    });
}

export async function captureContractVersion(input: {
    contractId: number;
    payload: Prisma.InputJsonObject;
    pdfKey?: string | null;
    status: string;
    sentAt?: Date;
}) {
    if (!messageOutboxDualWriteEnabled()) return null;
    const aggregate = await prisma.contractVersion.aggregate({
        where: { contract_id: input.contractId },
        _max: { version: true },
    });
    return prisma.contractVersion.create({
        data: {
            contract_id: input.contractId,
            version: (aggregate._max.version || 0) + 1,
            payload: input.payload,
            payload_hash: immutablePayloadHash(input.payload),
            pdf_key: input.pdfKey || null,
            status: input.status,
            sent_at: input.sentAt,
        },
    });
}
