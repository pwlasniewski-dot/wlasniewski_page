import prisma from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';
import { getAdminEmail, sendEmail } from '@/lib/email/sender';

export type AdminIncidentSeverityValue = 'P0' | 'P1' | 'P2' | 'P3';
export type AdminIncidentStatusValue = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface RecordAdminIncidentInput {
    severity: AdminIncidentSeverityValue;
    category: string;
    reasonCode: string;
    summary: string;
    clientId?: number | null;
    clientEmail?: string | null;
    entityType?: string | null;
    entityId?: number | null;
    correlationId?: string | null;
    details?: Prisma.InputJsonObject | null;
    occurredAt?: Date;
}

const ALERT_WINDOW_MS = 15 * 60_000;
const ALERT_LIMIT = 10;
const alertAttempts: number[] = [];
const alertDedupe = new Map<string, number>();

function incidentAlertKey(input: RecordAdminIncidentInput) {
    return [input.reasonCode, input.entityType || '', input.entityId || '', input.clientId || '', input.clientEmail || ''].join(':');
}

function reserveLocalAlert(input: RecordAdminIncidentInput, now = Date.now()) {
    while (alertAttempts.length && alertAttempts[0] < now - ALERT_WINDOW_MS) alertAttempts.shift();
    const key = incidentAlertKey(input);
    const localDuplicateAt = alertDedupe.get(key) || 0;
    if (localDuplicateAt >= now - ALERT_WINDOW_MS) return 'SKIPPED_DUPLICATE' as const;
    if (alertAttempts.length >= ALERT_LIMIT) return 'RATE_LIMITED' as const;
    alertAttempts.push(now);
    alertDedupe.set(key, now);
    return null;
}

function escapeHtml(value: unknown) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

async function sendIndependentAdminAlert(input: RecordAdminIncidentInput, persistenceError?: unknown) {
    let recipient = process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || '';
    if (!recipient) {
        try {
            recipient = await getAdminEmail() || '';
        } catch (lookupError) {
            console.error('[ADMIN_INCIDENT] Admin recipient lookup failed; using SMTP_FROM fallback', {
                reasonCode: input.reasonCode,
                correlationId: input.correlationId,
                lookupError,
            });
        }
    }
    recipient ||= process.env.SMTP_FROM || '';
    if (!recipient) throw new Error('Brak ADMIN_EMAIL/SMTP_FROM dla alertu incydentu');
    const correlation = input.correlationId || 'brak';
    await sendEmail({
        to: recipient,
        subject: `[${input.severity}] ${input.reasonCode} — incydent CRM`,
        html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px">
            <h1>Alert ${escapeHtml(input.severity)}: ${escapeHtml(input.reasonCode)}</h1>
            <p>${escapeHtml(input.summary)}</p>
            <dl>
                <dt>Korelacja</dt><dd><code>${escapeHtml(correlation)}</code></dd>
                <dt>Klient</dt><dd>${escapeHtml(input.clientEmail || input.clientId || '—')}</dd>
                <dt>Obiekt</dt><dd>${escapeHtml(input.entityType || '—')} ${escapeHtml(input.entityId || '')}</dd>
                ${persistenceError ? `<dt>Zapis bazy</dt><dd>Nie udał się — sprawdź log platformy.</dd>` : ''}
            </dl>
        </div>`,
    });
}

async function notifyForIncident(incident: { id: string; occurred_at: Date }, input: RecordAdminIncidentInput) {
    if (input.severity !== 'P0' && input.severity !== 'P1') return;
    const now = Date.now();
    const localLimit = reserveLocalAlert(input, now);
    if (localLimit) {
        await prisma.adminIncident.update({
            where: { id: incident.id },
            data: {
                notification_status: localLimit,
                notification_attempted_at: new Date(),
            },
        });
        return;
    }

    const recent = await prisma.adminIncident.findFirst({
        where: {
            id: { not: incident.id },
            reason_code: input.reasonCode,
            entity_type: input.entityType ?? null,
            entity_id: input.entityId ?? null,
            client_id: input.clientId ?? null,
            severity: { in: ['P0', 'P1'] },
            notification_status: 'SENT',
            occurred_at: { gte: new Date(now - ALERT_WINDOW_MS) },
        },
        select: { id: true },
    });
    if (recent) {
        await prisma.adminIncident.update({
            where: { id: incident.id },
            data: { notification_status: 'SKIPPED_DUPLICATE', notification_attempted_at: new Date() },
        });
        return;
    }

    await prisma.adminIncident.update({
        where: { id: incident.id },
        data: { notification_status: 'SENDING', notification_attempted_at: new Date(), notification_error: null },
    });
    await sendIndependentAdminAlert(input);
    await prisma.adminIncident.update({
        where: { id: incident.id },
        data: { notification_status: 'SENT', notification_sent_at: new Date(), notification_error: null },
    });
}

/**
 * Persists an operational incident. Deliberately does not catch database errors:
 * callers of critical paths must await and explicitly handle a failed write.
 */
export async function recordAdminIncident(input: RecordAdminIncidentInput) {
    if (!input.category.trim() || !input.reasonCode.trim() || !input.summary.trim()) {
        throw new Error('Admin incident requires category, reasonCode and summary');
    }

    let incident;
    try {
        incident = await prisma.adminIncident.create({
            data: {
            severity: input.severity,
            category: input.category.trim(),
            reason_code: input.reasonCode.trim(),
            summary: input.summary.trim(),
            client_id: input.clientId ?? null,
            client_email: input.clientEmail?.trim().toLowerCase() || null,
            entity_type: input.entityType?.trim() || null,
            entity_id: input.entityId ?? null,
            correlation_id: input.correlationId ?? null,
            details: input.details || undefined,
                occurred_at: input.occurredAt,
                notification_status: input.severity === 'P0' || input.severity === 'P1' ? 'PENDING' : 'NOT_REQUIRED',
            },
        });
    } catch (persistenceError) {
        if (input.severity === 'P0' || input.severity === 'P1') {
            const localLimit = reserveLocalAlert(input);
            if (localLimit) {
                console.error('[ADMIN_INCIDENT] DB failed; independent alert suppressed by local limiter', {
                    reasonCode: input.reasonCode,
                    correlationId: input.correlationId,
                    notificationStatus: localLimit,
                    persistenceError,
                });
            } else {
                try {
                    await sendIndependentAdminAlert(input, persistenceError);
                } catch (fallbackError) {
                    console.error('[ADMIN_INCIDENT] DB and independent email fallback failed', {
                        reasonCode: input.reasonCode,
                        correlationId: input.correlationId,
                        persistenceError,
                        fallbackError,
                    });
                }
            }
        }
        throw persistenceError;
    }

    if (input.severity === 'P0' || input.severity === 'P1') {
        try {
            await notifyForIncident(incident, input);
        } catch (notificationError) {
            console.error('[ADMIN_INCIDENT] Alert delivery failed', {
                incidentId: incident.id,
                reasonCode: input.reasonCode,
                correlationId: input.correlationId,
                notificationError,
            });
            try {
                await prisma.adminIncident.update({
                    where: { id: incident.id },
                    data: {
                        notification_status: 'FAILED',
                        notification_attempted_at: new Date(),
                        notification_error: notificationError instanceof Error ? notificationError.message.slice(0, 1000) : String(notificationError).slice(0, 1000),
                    },
                });
            } catch (statusError) {
                console.error('[ADMIN_INCIDENT] Notification status update failed', { incidentId: incident.id, statusError });
            }
        }
    }
    return incident;
}

/** Records a secondary incident without changing the already established
 * business outcome. Failure is never silent and is correlated in platform logs. */
export async function recordAdminIncidentSafely(input: RecordAdminIncidentInput): Promise<void> {
    try {
        await recordAdminIncident(input);
    } catch (error) {
        console.error('[ADMIN_INCIDENT] Persistence failed', {
            reasonCode: input.reasonCode,
            correlationId: input.correlationId,
            error,
        });
    }
}
