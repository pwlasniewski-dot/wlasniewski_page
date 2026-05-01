/**
 * PATCH /api/foto-match/photos/reorder
 * Body: { ids: number[] } — kolejność = pozycja w tablicy.
 * Wymaga: id musi należeć do auth profile.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ ids: z.array(z.number().int().positive()).min(1).max(50) });

export async function PATCH(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const me = auth.profile!;

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_FAILED' }, { status: 400 });
    const { ids } = parsed.data;

    // Authorize: wszystkie id musza nalezec do mojego profilu
    const owned = await prisma.fotoMatchPhoto.findMany({
        where: { id: { in: ids }, profile_id: me.id },
        select: { id: true },
    });
    if (owned.length !== ids.length) {
        return NextResponse.json({ error: 'FORBIDDEN_OR_INVALID_IDS' }, { status: 403 });
    }

    await prisma.$transaction(ids.map((id, idx) =>
        prisma.fotoMatchPhoto.update({ where: { id }, data: { position: idx } })
    ));

    return NextResponse.json({ ok: true, count: ids.length });
}
