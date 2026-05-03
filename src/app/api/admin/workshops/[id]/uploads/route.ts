import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/workshops/[id]/uploads
 * Lista wszystkich uploadów warsztatu (z danymi uczestnika) — galeria dla prowadzącego.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });
        const uploads = await prisma.workshopUpload.findMany({
            where: { workshop_id: wid },
            orderBy: { created_at: 'desc' },
            include: {
                participant: { select: { id: true, login: true, display_name: true, avatar: true } },
            },
        });
        return NextResponse.json({ uploads });
    });
}
