import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { verifyToken, extractToken } from '@/lib/auth/jwt';
import { logClientActivityStrict } from '@/lib/crm-activity';
import { revalidateActiveClient } from '@/lib/auth/active-client';
import { isContractRecordOwner } from '@/lib/auth/document-access';
import { CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES, isClientActionableContractStatus } from '@/lib/contracts/status';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';
import { beginClientOperation, clientJson, clientOperationTotalMs, recordSlowClientOperation } from '@/lib/client-operations';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const operation = beginClientOperation();
    let clientId: number | null = null;
    let clientEmail: string | null = null;
    let contractId: number | null = null;
    try {
        const token = extractToken(request.headers.get('Authorization')) || request.cookies.get('client_token')?.value;
        const decoded = token ? await verifyToken(token) : null;
        if (!decoded) return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        const client = await revalidateActiveClient(decoded);
        if (!client) return clientJson({ error: 'Unauthorized' }, { status: 401, correlationId: operation.correlationId });
        clientId = client.id;
        clientEmail = client.email;

        const resolved = await params;
        contractId = Number(resolved.id);
        if (!Number.isInteger(contractId) || contractId <= 0) {
            return clientJson({ error: 'Contract not found' }, { status: 404, correlationId: operation.correlationId });
        }
        const body = await request.json().catch(() => null) as { client_note?: unknown } | null;
        if (body?.client_note !== null && body?.client_note !== undefined && typeof body.client_note !== 'string') {
            return clientJson({ error: 'Nieprawidłowa notatka.' }, { status: 400, correlationId: operation.correlationId });
        }
        const note = typeof body?.client_note === 'string' ? body.client_note.trim() : null;
        if (note && note.length > 2_000) {
            return clientJson({ error: 'Notatka może mieć maksymalnie 2000 znaków.' }, { status: 400, correlationId: operation.correlationId });
        }

        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            include: { offer: { select: { client_id: true, client_email: true } } },
        });
        if (!contract || !isContractRecordOwner(contract, client) || !isClientActionableContractStatus(contract.status)) {
            return clientJson({ error: 'Contract not found' }, { status: 404, correlationId: operation.correlationId });
        }
        const changed = await prisma.contract.updateMany({
            where: {
                id: contractId,
                client_id: contract.client_id,
                updated_at: contract.updated_at,
                status: { in: CLIENT_ACTIONABLE_CONTRACT_STATUS_VALUES },
            },
            data: { client_note: note },
        });
        if (changed.count !== 1) {
            return clientJson({ error: 'Umowa została zmieniona. Odśwież stronę.' }, { status: 409, correlationId: operation.correlationId });
        }

        const totalMs = clientOperationTotalMs(operation.startedAt);
        try {
            await logClientActivityStrict(decoded, 'contract_note_added', {
                entityType: 'contract', entityId: contractId,
                details: { note_length: note?.length || 0, correlation_id: operation.correlationId, total_ms: totalMs },
                request,
            });
        } catch (auditError) {
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'AUDIT', reasonCode: 'CONTRACT_NOTE_AUDIT_FAILED',
                summary: 'Nie udało się zapisać audytu notatki do umowy', clientId, clientEmail,
                entityType: 'contract', entityId: contractId, correlationId: operation.correlationId,
                details: { error: auditError instanceof Error ? auditError.message : String(auditError) },
            });
        }
        await recordSlowClientOperation({
            operation: 'contract_note', startedAt: operation.startedAt, correlationId: operation.correlationId,
            clientId, clientEmail, entityType: 'contract', entityId: contractId, outcome: 'success',
        });
        return clientJson({ success: true }, { correlationId: operation.correlationId });
    } catch (error) {
        console.error('[Contract Note API] Error:', { correlationId: operation.correlationId, error });
        await recordAdminIncidentSafely({
            severity: 'P1', category: 'CLIENT_PORTAL', reasonCode: 'CONTRACT_NOTE_FAILED',
            summary: 'Nie udało się zapisać notatki klienta do umowy', clientId, clientEmail,
            entityType: 'contract', entityId: contractId, correlationId: operation.correlationId,
            details: { error: error instanceof Error ? error.message : String(error) },
        });
        return clientJson({ error: 'Nie udało się zapisać notatki.' }, { status: 500, correlationId: operation.correlationId });
    }
}
