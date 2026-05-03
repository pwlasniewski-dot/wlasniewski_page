import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

/**
 * POST /api/admin/contracts/[id]/mark-deposit-paid
 *  body: { paid?: boolean, paid_at?: string ISO, note?: string }
 *  - paid=true (default): ustawia deposit_paid_at = paid_at || now()
 *  - paid=false: czysci deposit_paid_at (cofniecie)
 */
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    return withAuth(request, async (req) => {
        try {
            const { id } = await context.params;
            const contractId = parseInt(id, 10);
            const body = await req.json().catch(() => ({}));
            const paid = body.paid !== false; // default true
            const paidAt = paid ? (body.paid_at ? new Date(body.paid_at) : new Date()) : null;

            const updated = await prisma.contract.update({
                where: { id: contractId },
                data: {
                    deposit_paid_at: paidAt,
                    ...(body.note !== undefined ? { deposit_note: body.note } : {}),
                },
                include: { user: { select: { id: true, name: true, email: true } }, offer: { select: { title: true } } },
            });

            // Log w CRM
            try {
                await prisma.crmActivity.create({
                    data: {
                        client_id: updated.client_id,
                        client_email: updated.user?.email || null,
                        action: paid ? 'deposit_marked_paid' : 'deposit_unmarked',
                        entity_type: 'contract',
                        entity_id: updated.id,
                        details: JSON.stringify({
                            contract_number: updated.contract_number,
                            deposit_amount: updated.deposit_amount,
                            paid_at: paidAt,
                            note: body.note || null,
                        }),
                    },
                });
            } catch (e) {
                console.warn('[mark-deposit-paid] CRM log failed', e);
            }

            return NextResponse.json({
                success: true,
                contract: {
                    id: updated.id,
                    deposit_paid_at: updated.deposit_paid_at,
                    deposit_amount: updated.deposit_amount,
                    deposit_due_at: updated.deposit_due_at,
                    deposit_note: updated.deposit_note,
                },
            });
        } catch (e: any) {
            console.error('[POST /contracts/[id]/mark-deposit-paid]', e);
            return NextResponse.json({ error: e.message || 'Internal' }, { status: 500 });
        }
    });
}
