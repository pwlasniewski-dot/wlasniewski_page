/**
 * POST  /api/foto-match/messages          { to_profile_id, body }
 * GET   /api/foto-match/messages?with=ID  → konwersacja z profilem ID
 * GET   /api/foto-match/messages          → lista matchy z preview ostatniej wiadomości
 *
 * Wymaga: aktywny profil + wzajemny match (FotoMatchSwipe.is_match=true).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const sendSchema = z.object({
    to_profile_id: z.number().int().positive(),
    body: z.string().trim().min(1).max(2000),
});

async function assertMatch(meId: number, otherId: number) {
    const swipe = await prisma.fotoMatchSwipe.findFirst({
        where: { from_profile_id: meId, to_profile_id: otherId, is_match: true },
        select: { id: true },
    });
    return !!swipe;
}

async function isBlocked(meId: number, otherId: number) {
    const b = await prisma.fotoMatchBlock.findFirst({
        where: {
            OR: [
                { blocker_id: meId, blocked_id: otherId },
                { blocker_id: otherId, blocked_id: meId },
            ],
        },
        select: { id: true },
    });
    return !!b;
}

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true, requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const me = auth.profile!;

    const limit = rateLimit(`msg:${me.id}`, 30, 60_000);
    if (!limit.ok) return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });

    let body: unknown;
    try { body = await request.json(); } catch { return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 }); }
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'VALIDATION_FAILED' }, { status: 400 });
    const { to_profile_id, body: text } = parsed.data;
    if (to_profile_id === me.id) return NextResponse.json({ error: 'CANNOT_MESSAGE_SELF' }, { status: 400 });

    if (await isBlocked(me.id, to_profile_id)) return NextResponse.json({ error: 'BLOCKED' }, { status: 403 });
    if (!(await assertMatch(me.id, to_profile_id))) return NextResponse.json({ error: 'NO_MATCH' }, { status: 403 });

    const msg = await prisma.fotoMatchMessage.create({
        data: { from_profile_id: me.id, to_profile_id, body: text },
    });
    return NextResponse.json({ ok: true, message: msg });
}

export async function GET(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true, requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    const me = auth.profile!;

    const withId = parseInt(request.nextUrl.searchParams.get('with') || '', 10);
    if (!Number.isNaN(withId)) {
        if (await isBlocked(me.id, withId)) return NextResponse.json({ error: 'BLOCKED' }, { status: 403 });
        if (!(await assertMatch(me.id, withId))) return NextResponse.json({ error: 'NO_MATCH' }, { status: 403 });

        const messages = await prisma.fotoMatchMessage.findMany({
            where: {
                OR: [
                    { from_profile_id: me.id, to_profile_id: withId },
                    { from_profile_id: withId, to_profile_id: me.id },
                ],
            },
            orderBy: { created_at: 'asc' },
            take: 200,
        });
        // Mark as read
        await prisma.fotoMatchMessage.updateMany({
            where: { from_profile_id: withId, to_profile_id: me.id, read_at: null },
            data: { read_at: new Date() },
        });
        return NextResponse.json({ messages });
    }

    // Lista matchy + ostatnia wiadomość + unread count
    const matches = await prisma.fotoMatchSwipe.findMany({
        where: { from_profile_id: me.id, is_match: true },
        select: { to_profile_id: true, matched_at: true },
        orderBy: { matched_at: 'desc' },
    });
    const ids = matches.map(m => m.to_profile_id);
    if (ids.length === 0) return NextResponse.json({ conversations: [] });

    const profiles = await prisma.fotoMatchProfile.findMany({
        where: { id: { in: ids } },
        select: {
            id: true, display_name: true, city: true,
            photos: { take: 1, orderBy: { id: 'asc' }, select: { url: true } },
        },
    });
    const lastMsgs = await prisma.fotoMatchMessage.findMany({
        where: {
            OR: [
                { from_profile_id: me.id, to_profile_id: { in: ids } },
                { to_profile_id: me.id, from_profile_id: { in: ids } },
            ],
        },
        orderBy: { created_at: 'desc' },
    });
    const lastByPartner = new Map<number, typeof lastMsgs[number]>();
    for (const m of lastMsgs) {
        const partner = m.from_profile_id === me.id ? m.to_profile_id : m.from_profile_id;
        if (!lastByPartner.has(partner)) lastByPartner.set(partner, m);
    }
    const unreadCounts = await Promise.all(ids.map(async (pid) => ({
        pid,
        n: await prisma.fotoMatchMessage.count({ where: { from_profile_id: pid, to_profile_id: me.id, read_at: null } }),
    })));
    const unreadMap = new Map(unreadCounts.map(u => [u.pid, u.n]));

    const conversations = profiles.map(p => ({
        partner: p,
        last_message: lastByPartner.get(p.id) || null,
        unread_count: unreadMap.get(p.id) || 0,
        matched_at: matches.find(m => m.to_profile_id === p.id)?.matched_at,
    })).sort((a, b) => {
        const ta = a.last_message?.created_at?.getTime() || a.matched_at?.getTime() || 0;
        const tb = b.last_message?.created_at?.getTime() || b.matched_at?.getTime() || 0;
        return tb - ta;
    });

    return NextResponse.json({ conversations });
}
