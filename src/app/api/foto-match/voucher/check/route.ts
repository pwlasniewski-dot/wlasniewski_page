/**
 * Sprawdza voucher Foto-Match (z polecenia).
 * GET /api/foto-match/voucher/check?code=XXXX
 * Zwraca { valid, amount_grosze?, percent?, type?, expires_at? } lub { valid: false, reason }.
 *
 * Nie wymaga zalogowania — używane na koszyku przez gości.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const code = (req.nextUrl.searchParams.get('code') || '').trim().toUpperCase();
    if (!code) {
        return NextResponse.json({ valid: false, reason: 'NO_CODE' }, { status: 400 });
    }

    const ref = await prisma.fotoMatchReferral.findUnique({
        where: { reward_voucher_code: code },
        select: {
            id: true,
            status: true,
            reward_amount_grosze: true,
            reward_percent: true,
            reward_type: true,
            reward_expires_at: true,
            reward_redeemed_at: true,
        },
    });

    if (!ref || ref.status !== 'REWARDED') {
        return NextResponse.json({ valid: false, reason: 'NOT_FOUND' }, { status: 404 });
    }
    if (ref.reward_redeemed_at) {
        return NextResponse.json({ valid: false, reason: 'ALREADY_USED' }, { status: 410 });
    }
    if (ref.reward_expires_at && ref.reward_expires_at < new Date()) {
        return NextResponse.json({ valid: false, reason: 'EXPIRED' }, { status: 410 });
    }

    return NextResponse.json({
        valid: true,
        amount_grosze: ref.reward_amount_grosze,
        percent: ref.reward_percent,
        type: ref.reward_type,
        expires_at: ref.reward_expires_at,
    });
}
