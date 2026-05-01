/**
 * POST /api/foto-match/block { profile_id }
 * DELETE /api/foto-match/block?profile_id=N (odblokuj)
 * GET   /api/foto-match/block (lista zablokowanych)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({
    profile_id: z.number().int().positive(),
    reason: z.string().trim().max(255).optional(),
});

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const me = auth.profile!;

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_FAILED' }, { status: 400 });

    const { profile_id, reason } = parsed.data;
    if (profile_id === me.id) return NextResponse.json({ error: 'CANNOT_BLOCK_SELF' }, { status: 400 });

    const target = await prisma.fotoMatchProfile.findUnique({ where: { id: profile_id } });
    if (!target) return NextResponse.json({ error: 'TARGET_NOT_FOUND' }, { status: 404 });

    await prisma.fotoMatchBlock.upsert({
        where: { blocker_id_blocked_id: { blocker_id: me.id, blocked_id: profile_id } },
        update: { reason: reason || null },
        create: { blocker_id: me.id, blocked_id: profile_id, reason: reason || null },
    });

    // Usuń ewentualne wzajemne matche (LIKE z is_match=true → wycofujemy)
    await prisma.fotoMatchSwipe.updateMany({
        where: {
            OR: [
                { from_profile_id: me.id, to_profile_id: profile_id },
                { from_profile_id: profile_id, to_profile_id: me.id },
            ],
        },
        data: { is_match: false, matched_at: null },
    });

    return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const me = auth.profile!;
    const profileId = parseInt(request.nextUrl.searchParams.get('profile_id') || '', 10);
    if (Number.isNaN(profileId)) return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 });

    await prisma.fotoMatchBlock.deleteMany({ where: { blocker_id: me.id, blocked_id: profileId } });
    return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const me = auth.profile!;
    const blocks = await prisma.fotoMatchBlock.findMany({
        where: { blocker_id: me.id },
        include: { blocked: { select: { id: true, display_name: true, city: true } } },
        orderBy: { created_at: 'desc' },
    });
    return NextResponse.json({ blocks });
}
