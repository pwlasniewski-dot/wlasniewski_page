/**
 * Publiczny endpoint dla landing page polecenia.
 * GET → dane polecającego (display_name, miasto, avatar) + bonus info.
 * POST → marker share/click (bump licznika).
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx {
    params: Promise<{ token: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
    const { token } = await params;
    if (!token || token.length < 10) {
        return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 400 });
    }

    const ref = await prisma.fotoMatchReferral.findUnique({
        where: { invite_token: token },
        include: {
            referrer: {
                select: {
                    id: true,
                    display_name: true,
                    city: true,
                    photos: {
                        where: { ai_status: 'APPROVED' },
                        orderBy: { position: 'asc' },
                        take: 1,
                        select: { url: true },
                    },
                },
            },
        },
    });

    if (!ref) {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const settings = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    const bonus = {
        enabled: settings?.referral_bonus_enabled ?? false,
        amount_grosze: settings?.referral_bonus_amount_grosze ?? 0,
        percent: settings?.referral_bonus_percent ?? 0,
        type: settings?.referral_bonus_type ?? 'AMOUNT',
    };

    return NextResponse.json({
        referrer: {
            display_name: ref.referrer.display_name,
            city: ref.referrer.city,
            avatar_url: ref.referrer.photos[0]?.url || null,
        },
        bonus,
        token,
    });
}

const PostSchema = z.object({
    event: z.enum(['share', 'click']),
});

export async function POST(req: NextRequest, { params }: Ctx) {
    const { token } = await params;
    const body = await req.json().catch(() => ({}));
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'VALIDATION' }, { status: 400 });
    }

    const field = parsed.data.event === 'share' ? 'share_count' : 'click_count';
    try {
        await prisma.fotoMatchReferral.update({
            where: { invite_token: token },
            data: { [field]: { increment: 1 } },
        });
    } catch {
        return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    const res = NextResponse.json({ ok: true });
    // Przy 'click' ustawiamy cookie żeby /api/auth/register mógł podlinkować referral.
    if (parsed.data.event === 'click') {
        res.cookies.set('fm_ref_token', token, {
            httpOnly: false, // potrzebne na froncie do przekazania w body rejestracji
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 dni
        });
    }
    return res;
}
