import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { NextResponse } from 'next/server';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

export const SLOW_CLIENT_OPERATION_MS = 2_000;

export function beginClientOperation() {
    return { correlationId: randomUUID(), startedAt: performance.now() };
}

export function correlationCaseCode(correlationId: string) {
    return correlationId.replaceAll('-', '').slice(0, 8).toUpperCase();
}

export function clientJson(
    body: Record<string, unknown>,
    options: { status?: number; correlationId: string },
) {
    const status = options.status ?? 200;
    return NextResponse.json(status >= 400
        ? { ...body, caseCode: correlationCaseCode(options.correlationId) }
        : body, {
        status,
        headers: { 'X-Correlation-ID': options.correlationId },
    });
}

export function clientOperationTotalMs(startedAt: number) {
    return Math.round((performance.now() - startedAt) * 10) / 10;
}

export async function recordSlowClientOperation(input: {
    operation: string;
    startedAt: number;
    correlationId: string;
    clientId?: number | null;
    clientEmail?: string | null;
    entityType?: string | null;
    entityId?: number | null;
    outcome: string;
}) {
    const totalMs = clientOperationTotalMs(input.startedAt);
    if (totalMs < SLOW_CLIENT_OPERATION_MS) return totalMs;
    await recordAdminIncidentSafely({
        severity: 'P2',
        category: 'PERFORMANCE',
        reasonCode: `SLOW_${input.operation.toUpperCase()}`,
        summary: 'Operacja w panelu klienta przekroczyła próg czasu odpowiedzi',
        clientId: input.clientId,
        clientEmail: input.clientEmail,
        entityType: input.entityType,
        entityId: input.entityId,
        correlationId: input.correlationId,
        details: { operation: input.operation, outcome: input.outcome, total_ms: totalMs },
    });
    return totalMs;
}
