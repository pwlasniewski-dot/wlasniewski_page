/**
 * Foto-Match: swipe (LIKE / SKIP / SUPER_LIKE) z auto-detect MATCH.
 *
 * POST /api/foto-match/swipe   body: { to_profile_id: number, action: 'LIKE'|'SKIP'|'SUPER_LIKE' }
 * GET  /api/foto-match/swipe?type=matches    -> lista wzajemnych dopasowań
 * GET  /api/foto-match/swipe?type=likes_received  -> kto cię polubił (bez wzajemnego LIKE z naszej strony)
 *
 * Wymaga aktywnego profilu Foto-Match.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_ACTIONS = ['LIKE', 'SKIP', 'SUPER_LIKE'] as const;
type Action = typeof VALID_ACTIONS[number];

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json().catch(() => ({}));
    const toProfileId = Number(body.to_profile_id);
    const action = String(body.action || '').toUpperCase() as Action;

    if (!Number.isInteger(toProfileId) || toProfileId <= 0) {
        return NextResponse.json({ error: 'INVALID_TO_PROFILE_ID' }, { status: 400 });
    }
    if (!VALID_ACTIONS.includes(action)) {
        return NextResponse.json({ error: 'INVALID_ACTION', allowed: VALID_ACTIONS }, { status: 400 });
    }

    const fromProfile = auth.profile!;
    if (toProfileId === fromProfile.id) {
        return NextResponse.json({ error: 'CANNOT_SWIPE_SELF' }, { status: 400 });
    }

    const target = await prisma.fotoMatchProfile.findUnique({
        where: { id: toProfileId },
        select: { id: true, status: true, is_active: true, user_id: true, display_name: true },
    });
    if (!target || target.status !== 'ACTIVE' || !target.is_active) {
        return NextResponse.json({ error: 'TARGET_NOT_AVAILABLE' }, { status: 404 });
    }

    // Block guard — żaden swipe nie może być wykonany jeśli ktokolwiek z pary ma blokadę.
    const block = await prisma.fotoMatchBlock.findFirst({
        where: {
            OR: [
                { blocker_id: fromProfile.id, blocked_id: toProfileId },
                { blocker_id: toProfileId, blocked_id: fromProfile.id },
            ],
        },
        select: { id: true },
    });
    if (block) {
        return NextResponse.json({ error: 'BLOCKED' }, { status: 403 });
    }

    // Upsert swipe (idempotentny — pozwala "zmienić zdanie" SKIP→LIKE).
    const swipe = await prisma.fotoMatchSwipe.upsert({
        where: { from_profile_id_to_profile_id: { from_profile_id: fromProfile.id, to_profile_id: toProfileId } },
        update: { action, is_match: false, matched_at: null },
        create: { from_profile_id: fromProfile.id, to_profile_id: toProfileId, action },
    });

    // Detect mutual MATCH (tylko gdy obie strony LIKE/SUPER_LIKE).
    let isMatch = false;
    if (action === 'LIKE' || action === 'SUPER_LIKE') {
        const reciprocal = await prisma.fotoMatchSwipe.findUnique({
            where: { from_profile_id_to_profile_id: { from_profile_id: toProfileId, to_profile_id: fromProfile.id } },
        });
        if (reciprocal && (reciprocal.action === 'LIKE' || reciprocal.action === 'SUPER_LIKE')) {
            isMatch = true;
            const matchedAt = new Date();
            await prisma.$transaction([
                prisma.fotoMatchSwipe.update({ where: { id: swipe.id }, data: { is_match: true, matched_at: matchedAt } }),
                prisma.fotoMatchSwipe.update({ where: { id: reciprocal.id }, data: { is_match: true, matched_at: matchedAt } }),
            ]);
            await logSystem('INFO', 'FOTO_MATCH', `MATCH ${fromProfile.id} <-> ${toProfileId}`).catch(() => { });

            // Powiadomienia email — fire-and-forget, by nie blokować odpowiedzi.
            (async () => {
                try {
                    const { sendMatchEmail } = await import('@/lib/foto-match/notifications');
                    await Promise.allSettled([
                        sendMatchEmail(fromProfile.id, toProfileId),
                        sendMatchEmail(toProfileId, fromProfile.id),
                    ]);
                } catch (e) {
                    await logSystem('WARN', 'FOTO_MATCH', `match email failed: ${e instanceof Error ? e.message : String(e)}`).catch(() => { });
                }
            })();
        }
    }

    // Bump last_active.
    await prisma.fotoMatchProfile.update({ where: { id: fromProfile.id }, data: { last_active: new Date() } }).catch(() => { });

    return NextResponse.json({
        ok: true,
        action,
        is_match: isMatch,
        target: isMatch ? { id: target.id, display_name: target.display_name } : undefined,
    });
}

export async function GET(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const type = request.nextUrl.searchParams.get('type') || 'matches';
    const profile = auth.profile!;

    if (type === 'matches') {
        const matches = await prisma.fotoMatchSwipe.findMany({
            where: { from_profile_id: profile.id, is_match: true },
            orderBy: { matched_at: 'desc' },
            take: 100,
            include: {
                to_profile: {
                    select: {
                        id: true, display_name: true, city: true, birth_year: true, bio: true, interests: true,
                        photos: { where: { ai_status: { in: ['APPROVED', 'PENDING'] } }, orderBy: { id: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
        });
        return NextResponse.json({ ok: true, matches: matches.map(m => ({ ...m.to_profile, matched_at: m.matched_at })) });
    }

    if (type === 'likes_received') {
        // Kto mnie polubił, ale ja nie odwzajemniłem (jeszcze brak match).
        const incoming = await prisma.fotoMatchSwipe.findMany({
            where: {
                to_profile_id: profile.id,
                action: { in: ['LIKE', 'SUPER_LIKE'] },
                is_match: false,
            },
            orderBy: { created_at: 'desc' },
            take: 100,
            include: {
                from_profile: {
                    select: {
                        id: true, display_name: true, city: true, birth_year: true,
                        photos: { where: { ai_status: { in: ['APPROVED', 'PENDING'] } }, orderBy: { id: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
        });
        return NextResponse.json({ ok: true, likes: incoming.map(s => ({ ...s.from_profile, swiped_at: s.created_at, action: s.action })) });
    }

    if (type === 'likes_sent') {
        // Kogo ja polubiłem, ale jeszcze nie odwzajemnił (brak match).
        const outgoing = await prisma.fotoMatchSwipe.findMany({
            where: {
                from_profile_id: profile.id,
                action: { in: ['LIKE', 'SUPER_LIKE'] },
                is_match: false,
            },
            orderBy: { created_at: 'desc' },
            take: 100,
            include: {
                to_profile: {
                    select: {
                        id: true, display_name: true, city: true, birth_year: true,
                        photos: { where: { ai_status: { in: ['APPROVED', 'PENDING'] } }, orderBy: { id: 'asc' }, take: 1, select: { url: true } },
                    },
                },
            },
        });
        return NextResponse.json({ ok: true, likes: outgoing.map(s => ({ ...s.to_profile, swiped_at: s.created_at, action: s.action })) });
    }

    return NextResponse.json({ error: 'INVALID_TYPE', allowed: ['matches', 'likes_received', 'likes_sent'] }, { status: 400 });
}
