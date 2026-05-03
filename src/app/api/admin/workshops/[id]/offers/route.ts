import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';

// GET /api/admin/workshops/[id]/offers — lista ofert dla warsztatu
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    return withAuth(request, async () => {
        const { id } = await ctx.params;
        const wid = parseInt(id, 10);
        if (!wid) return NextResponse.json({ error: 'Bad id' }, { status: 400 });

        const offers = await prisma.workshopOffer.findMany({
            where: { workshop_id: wid },
            orderBy: { sent_at: 'desc' },
        });
        return NextResponse.json({ offers });
    });
}
