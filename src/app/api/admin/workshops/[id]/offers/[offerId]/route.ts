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
