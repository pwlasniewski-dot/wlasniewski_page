import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';
import { isImmutableContractStatus, normalizeContractStatus } from '@/lib/contracts/status';
import { randomUUID } from 'node:crypto';
import { jsonWithCorrelation } from '@/lib/http/correlation';
import { recordAdminIncidentSafely } from '@/lib/admin-incidents';

// GET /api/admin/contracts/[id] - admin podglad umowy (rowniez standalone bez offer_id)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async () => {
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);
            const contract = await prisma.contract.findUnique({
                where: { id: contractId },
                include: {
                    offer: {
                        select: {
                            id: true, title: true, total_price: true, offerNumber: true,
                            client_id: true, client_email: true, type: true,
                            session_date: true, session_time: true, session_location: true,
                        },
                    },
                    user: { select: { id: true, name: true, email: true, phone: true } },
                },
            });
            if (!contract) {
                return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
            }
            return NextResponse.json({ contract });
        } catch (error) {
            console.error('Get contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}

// PATCH /api/admin/contracts/[id] - update fields (np. session_date dla standalone)
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        const correlationId = randomUUID();
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);
            const body = await req.json();
            const { session_date, session_time, session_location, photographer_id, status, client_note,
                deposit_amount, deposit_due_at, deposit_paid_at, deposit_note, content } = body;
            const existing = await prisma.contract.findUnique({ where: { id: contractId }, select: { status: true, updated_at: true } });
            if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
            if (isImmutableContractStatus(existing.status)) {
                return NextResponse.json({ error: 'Wysłana lub podpisana umowa jest niezmienna. Utwórz aneks.' }, { status: 409 });
            }
            if (status !== undefined && normalizeContractStatus(status) !== normalizeContractStatus(existing.status)) {
                return NextResponse.json({ error: 'Status umowy zmienia wyłącznie dedykowana akcja wysyłki lub podpisu.' }, { status: 409 });
            }

            const data: Record<string, unknown> = {};
            if (content !== undefined) data.content = content;
            if (session_date !== undefined) data.session_date = session_date ? new Date(session_date) : null;
            if (session_time !== undefined) data.session_time = session_time;
            if (session_location !== undefined) data.session_location = session_location;
            if (photographer_id !== undefined) {
                const pid = photographer_id === null || photographer_id === '' ? null : parseInt(String(photographer_id), 10);
                data.photographer_id = pid && !isNaN(pid) ? pid : null;
            }
            if (status !== undefined) data.status = status;
            if (client_note !== undefined) data.client_note = client_note;
            if (deposit_amount !== undefined) {
                const v = deposit_amount === null || deposit_amount === '' ? null : parseInt(String(deposit_amount), 10);
                data.deposit_amount = v != null && !isNaN(v) ? v : null;
            }
            if (deposit_due_at !== undefined) data.deposit_due_at = deposit_due_at ? new Date(deposit_due_at) : null;
            if (deposit_paid_at !== undefined) data.deposit_paid_at = deposit_paid_at ? new Date(deposit_paid_at) : null;
            if (deposit_note !== undefined) data.deposit_note = deposit_note;

            const claimed = await prisma.contract.updateMany({
                where: { id: contractId, status: existing.status, updated_at: existing.updated_at },
                data,
            });
            if (claimed.count !== 1) {
                return jsonWithCorrelation({ error: 'Umowa została równolegle zmieniona lub wysłana. Odśwież dane.', correlation_id: correlationId }, correlationId, 409);
            }
            const updated = await prisma.contract.findUniqueOrThrow({ where: { id: contractId } });
            return jsonWithCorrelation({ contract: updated }, correlationId);
        } catch (error) {
            console.error('Patch contract error:', error);
            await recordAdminIncidentSafely({
                severity: 'P1', category: 'ADMIN_WRITE', reasonCode: 'ADMIN_CONTRACT_UPDATE_FAILED',
                summary: 'Aktualizacja umowy w panelu nie powiodła się', correlationId,
                details: { error: error instanceof Error ? error.message : String(error) },
            });
            return jsonWithCorrelation({ error: 'Internal server error', correlation_id: correlationId }, correlationId, 500);
        }
    });
}

// DELETE /api/admin/contracts/[id]
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        const correlationId = randomUUID();
        try {
            const params = await context.params;
            const contractId = parseInt(params.id);

            const contract = await prisma.contract.findUnique({
                where: { id: contractId }
            });

            if (!contract) {
                return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
            }

            if (isImmutableContractStatus(contract.status)) {
                return NextResponse.json({ error: 'Wysłanej ani podpisanej umowy nie można usunąć. Utwórz aneks lub archiwizuj dokument.' }, { status: 409 });
            }

            const deleted = await prisma.$transaction(async (tx) => {
                const claimedAt = new Date();
                const claimed = await tx.contract.updateMany({
                    where: { id: contractId, status: contract.status, updated_at: contract.updated_at },
                    data: { updated_at: claimedAt },
                });
                if (claimed.count !== 1) return { count: 0 };
                return tx.contract.deleteMany({
                    where: { id: contractId, status: contract.status, updated_at: claimedAt },
                });
            });
            if (deleted.count !== 1) {
                return jsonWithCorrelation({ error: 'Umowa została równolegle zmieniona lub wysłana. Odśwież dane.', correlation_id: correlationId }, correlationId, 409);
            }

            return NextResponse.json({ success: true, message: 'Umowa została pomyślnie usunięta.' });
        } catch (error) {
            console.error('Delete contract error:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        }
    });
}
