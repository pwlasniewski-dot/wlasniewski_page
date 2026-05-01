/**
 * Admin: akcja na zgłoszeniu Foto-Match.
 *
 * PATCH /api/admin/foto-match/reports/[id]
 *   body: { status: 'REVIEWING'|'RESOLVED'|'DISMISSED', admin_note?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import prisma from '@/lib/db/prisma';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({
    status: z.enum(['REVIEWING', 'RESOLVED', 'DISMISSED']),
    admin_note: z.string().max(2000).optional(),
});

export async function PATCH(request: NextRequest, ctx: Ctx) {
    return withAuth(request, async (req) => {
        const { id } = await ctx.params;
        const reportId = Number(id);
        if (!Number.isFinite(reportId)) {
            return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });
        }

        let body: unknown;
        try { body = await req.json(); } catch {
            return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 });
        }
        const parsed = Body.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'VALIDATION_FAILED', issues: parsed.error.flatten() }, { status: 400 });
        }

        const adminId = req.user?.id ?? null;
        const { status, admin_note } = parsed.data;

        const updated = await prisma.fotoMatchReport.update({
            where: { id: reportId },
            data: {
                status,
                admin_note: admin_note ?? undefined,
                resolved_by: status === 'RESOLVED' || status === 'DISMISSED' ? adminId : undefined,
                resolved_at: status === 'RESOLVED' || status === 'DISMISSED' ? new Date() : undefined,
            },
        });

        await logSystem('INFO', 'FOTO_MATCH', `Report #${reportId} -> ${status}`, { adminId, note: admin_note });

        return NextResponse.json({ ok: true, report: updated });
    });
}
