/**
 * Foto-Match — referrals (system poleceń).
 *
 * GET  → lista moich poleceń + statystyki + bonus settings.
 * POST → utwórz nowy invite_token (opcjonalnie z emailem zaproszonej osoby).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PostSchema = z.object({
    invited_email: z.string().email().optional().nullable(),
});

async function getBonusSettings() {
    const s = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    return {
        enabled: s?.referral_bonus_enabled ?? false,
        amount_grosze: s?.referral_bonus_amount_grosze ?? 0,
        percent: s?.referral_bonus_percent ?? 0,
        type: s?.referral_bonus_type ?? 'AMOUNT',
        min_to_redeem: s?.referral_bonus_min_to_redeem ?? 1,
        expires_days: s?.referral_bonus_expires_days ?? 90,
    };
}

export async function GET(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile!;

    const [referrals, bonus] = await Promise.all([
        prisma.fotoMatchReferral.findMany({
            where: { referrer_profile_id: profile.id },
            orderBy: { created_at: 'desc' },
            take: 100,
        }),
        getBonusSettings(),
    ]);

    const stats = {
        total: referrals.length,
        registered: referrals.filter(r => ['REGISTERED', 'ACTIVE', 'REWARDED'].includes(r.status)).length,
        active: referrals.filter(r => ['ACTIVE', 'REWARDED'].includes(r.status)).length,
        rewarded: referrals.filter(r => r.status === 'REWARDED').length,
    };

    return NextResponse.json({ referrals, stats, bonus });
}

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireProfile: true });
    if (!auth.ok) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const profile = auth.profile!;

    let body: unknown = {};
    try {
        body = await request.json();
    } catch {
        // empty body OK — klient generuje sam token bez emailu
    }
    const parsed = PostSchema.safeParse(body || {});
    if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION', details: parsed.error.flatten() }, { status: 400 });
    }

    const token = crypto.randomBytes(16).toString('hex'); // 32 znaki

    const ref = await prisma.fotoMatchReferral.create({
        data: {
            referrer_profile_id: profile.id,
            invited_email: parsed.data.invited_email || null,
            invite_token: token,
            status: 'PENDING',
        },
    });

    return NextResponse.json({ referral: ref }, { status: 201 });
}
