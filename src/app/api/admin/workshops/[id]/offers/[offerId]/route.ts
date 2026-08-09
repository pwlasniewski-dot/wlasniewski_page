import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/workshops/[id]/offers/[offerId]
// body: { status?: 'sent'|'paid'|'confirmed'|'cancelled', deposit_paid_at?: string|null, notes?: string }
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string; offerId: string }> }) {
    return withAuth(request, async (req) => {
        const { id, offerId } = await ctx.params;
        const wid = parseInt(id, 10);
        const oid = parseInt(offerId, 10);
        if (!wid || !oid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

        const body = await req.json().catch(() => ({}));
        const data: any = {};
        if (body.status) data.status = String(body.status);
        if (body.notes !== undefined) data.notes = body.notes || null;
        if ('deposit_paid_at' in body) {
            data.deposit_paid_at = body.deposit_paid_at ? new Date(body.deposit_paid_at) : null;
            // Auto-status na paid gdy oznaczasz wplate
            if (body.deposit_paid_at && !body.status) data.status = 'paid';
        }

        const updated = await prisma.workshopOffer.update({
            where: { id: oid, workshop_id: wid },
            data,
        });
        const manualPaymentRequested = Boolean(body.deposit_paid_at) || body.status === 'paid';
        if (manualPaymentRequested) {
            const paymentKind = body.deposit_paid_at ? 'DEPOSIT' : 'FULL';
            const recordedDeposit = paymentKind === 'FULL'
                ? await prisma.paymentLedger.findUnique({
                    where: { provider_provider_payment_id: { provider: 'MANUAL', provider_payment_id: `workshop-${oid}-deposit` } },
                    select: { status: true, amount: true },
                })
                : null;
            const depositPln = recordedDeposit?.status === 'COMPLETED' ? Math.round(recordedDeposit.amount / 100) : 0;
            const amountPln = paymentKind === 'DEPOSIT'
                ? updated.deposit_amount
                : Math.max(0, (updated.price || 0) - depositPln);
            if (amountPln && amountPln > 0) {
                const amount = amountPln * 100;
                await prisma.paymentLedger.upsert({
                    where: { provider_provider_payment_id: { provider: 'MANUAL', provider_payment_id: `workshop-${oid}-${paymentKind.toLowerCase()}` } },
                    create: {
                        provider: 'MANUAL', provider_payment_id: `workshop-${oid}-${paymentKind.toLowerCase()}`,
                        resource_type: 'WORKSHOP', resource_id: oid,
                        payment_kind: paymentKind, amount,
                        paid_at: body.deposit_paid_at ? new Date(body.deposit_paid_at) : new Date(),
                        metadata: { source: 'admin_workshop_offer' },
                    },
                    update: { amount, status: 'COMPLETED' },
                });
            }
        }
        if ('deposit_paid_at' in body && !body.deposit_paid_at) {
            await prisma.paymentLedger.deleteMany({
                where: { provider: 'MANUAL', provider_payment_id: `workshop-${oid}-deposit` },
            });
        }
        return NextResponse.json({ offer: updated });
    });
}

// DELETE — usun oferte (np. anulowanie)
export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string; offerId: string }> }) {
    return withAuth(request, async () => {
        const { id, offerId } = await ctx.params;
        const wid = parseInt(id, 10);
        const oid = parseInt(offerId, 10);
        if (!wid || !oid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

        await prisma.workshopOffer.delete({ where: { id: oid, workshop_id: wid } });
        return NextResponse.json({ ok: true });
    });
}
