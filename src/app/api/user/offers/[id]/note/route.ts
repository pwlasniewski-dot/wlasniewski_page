import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { logClientActivityStrict } from '@/lib/crm-activity';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { isClientRecordOwner } from '@/lib/auth/document-access';
import { CLIENT_ACTIONABLE_OFFER_STATUS_VALUES, isClientActionableOfferStatus } from '@/lib/offers/status';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { beginClientOperation, clientJson, clientOperationTotalMs, recordSlowClientOperation } from '@/lib/client-operations';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const operation = beginClientOperation();
    let clientId: number | null = null;
    let clientEmail: string | null = null;
    let offerId: number | null = null;
    try {
        const token = extractToken(request.headers.get('Authorization')) || request.cookies.get('client_token')?.value;
        const decoded = token ? await verifyToken(token) : null;
        if (!decoded) return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        const client = await revalidateActiveClient(decoded);
        if (!client) return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        clientId = client.id;
        clientEmail = client.email;

        const resolved = await params;
        offerId = Number(resolved.id);
        if (!Number.isInteger(offerId) || offerId <= 0) {
            return clientJson({ error: 'Offer not found' }, { status: 404, correlationId: operation.correlationId });
        }
        const body = await request.json().catch(() => null) as { client_note?: unknown } | null;
        if (body?.client_note !== null && body?.client_note !== undefined && typeof body.client_note !== 'string') {
            return clientJson({ error: 'Nieprawidłowa notatka.' }, { status: 400, correlationId: operation.correlationId });
        }
        const note = typeof body?.client_note === 'string' ? body.client_note.trim() : null;
        if (note && note.length > 2_000) {
            return clientJson({ error: 'Notatka może mieć maksymalnie 2000 znaków.' }, { status: 400, correlationId: operation.correlationId });
        }

        const offer = await prisma.offer.findUnique({ where: { id: offerId } });
        if (!offer || !isClientRecordOwner(offer, client) || !isClientActionableOfferStatus(offer.status)) {
            return clientJson({ error: 'Offer not found' }, { status: 404, correlationId: operation.correlationId });
        }
        const changed = await prisma.offer.updateMany({
            where: {
                id: offerId,
                client_id: client.id,
                updated_at: offer.updated_at,
                status: { in: CLIENT_ACTIONABLE_OFFER_STATUS_VALUES },
            },
            data: { client_note: note },
        });
        if (changed.count !== 1) {
            return clientJson({ error: 'Oferta została zmieniona. Odśwież stronę.' }, { status: 409, correlationId: operation.correlationId });
        }

        const totalMs = clientOperationTotalMs(operation.startedAt);
        try {
            await logClientActivityStrict(decoded, 'offer_note_added', {
                entityType: 'offer', entityId: offerId,
                details: { note_length: note?.length || 0, correlation_id: operation.correlationId, total_ms: totalMs },
                request,
            });
        } catch (auditError) {
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'AUDIT', reasonCode: 'OFFER_NOTE_AUDIT_FAILED',
                summary: 'Nie udało się zapisać audytu notatki do oferty', clientId, clientEmail,
                entityType: 'offer', entityId: offerId, correlationId: operation.correlationId,
                details: { error: auditError instanceof Error ? auditError.message : String(auditError) },
            });
        }
        await recordSlowClientOperation({
            operation: 'offer_note', startedAt: operation.startedAt, correlationId: operation.correlationId,
            clientId, clientEmail, entityType: 'offer', entityId: offerId, outcome: 'success',
        });
        return clientJson({ success: true }, { correlationId: operation.correlationId });
    } catch (error) {
        console.error('[Offer Note API] Error:', { correlationId: operation.correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CLIENT_PORTAL', reasonCode: 'OFFER_NOTE_FAILED',
            summary: 'Nie udało się zapisać notatki klienta do oferty', clientId, clientEmail,
            entityType: 'offer', entityId: offerId, correlationId: operation.correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się zapisać notatki.' }, { status: 500, correlationId: operation.correlationId });
    }
}
