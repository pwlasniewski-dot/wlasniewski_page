/**
 * Foto-Match Session Consent (Model Release).
 *
 * GET  /api/foto-match/session-consent?partner_id=N
 *      → zwraca consent zalogowanego profilu względem partnera (jeśli istnieje).
 *
 * POST /api/foto-match/session-consent
 *      body: { partner_id: number, booking_id?: number,
 *              consent_publish: boolean, consent_portfolio: boolean, consent_marketing: boolean }
 *      → tworzy / aktualizuje wpis dla zalogowanego profilu.
 *      Wymaga aktywnego MATCH-u między obiema stronami.
 *
 * DELETE /api/foto-match/session-consent?partner_id=N
 *      → wycofanie zgody (withdrawn_at).
 *
 * Helper: assertCanPublish(profileA, profileB) → rzuca błędem gdy któraś strona nie ma consent_publish=true.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db/prisma';
import { getFotoMatchAuth } from '@/lib/foto-match/auth';
import { logSystem } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const consentSchema = z.object({
    partner_id: z.number().int().positive(),
    booking_id: z.number().int().positive().optional(),
    consent_publish: z.boolean(),
    consent_portfolio: z.boolean(),
    consent_marketing: z.boolean(),
});

function clientIp(request: NextRequest): string | null {
    const xff = request.headers.get('x-forwarded-for');
    if (xff) return xff.split(',')[0].trim();
    return request.headers.get('x-real-ip') || null;
}

async function ensureMatched(profileId: number, partnerId: number): Promise<boolean> {
    const swipe = await prisma.fotoMatchSwipe.findUnique({
        where: { from_profile_id_to_profile_id: { from_profile_id: profileId, to_profile_id: partnerId } },
        select: { is_match: true },
    });
    return !!swipe?.is_match;
}

export async function GET(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const partnerId = Number(request.nextUrl.searchParams.get('partner_id'));
    if (!Number.isInteger(partnerId) || partnerId <= 0) {
        return NextResponse.json({ error: 'INVALID_PARTNER_ID' }, { status: 400 });
    }

    const consent = await prisma.fotoMatchSessionConsent.findFirst({
        where: { profile_id: auth.profile!.id, match_partner_id: partnerId },
        orderBy: { signed_at: 'desc' },
    });

    return NextResponse.json({ ok: true, consent });
}

export async function POST(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json().catch(() => ({}));
    const parsed = consentSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'INVALID_BODY', details: parsed.error.issues }, { status: 400 });
    }

    const profileId = auth.profile!.id;
    const { partner_id, booking_id, consent_publish, consent_portfolio, consent_marketing } = parsed.data;

    if (partner_id === profileId) {
        return NextResponse.json({ error: 'CANNOT_CONSENT_SELF' }, { status: 400 });
    }

    const matched = await ensureMatched(profileId, partner_id);
    if (!matched) {
        return NextResponse.json({ error: 'NO_MATCH_REQUIRED' }, { status: 403 });
    }

    const consent = await prisma.fotoMatchSessionConsent.create({
        data: {
            profile_id: profileId,
            match_partner_id: partner_id,
            booking_id: booking_id ?? null,
            consent_publish,
            consent_portfolio,
            consent_marketing,
            signed_ip: clientIp(request),
        },
    });

    await logSystem(
        'INFO',
        'FOTO_MATCH',
        `consent signed profile=${profileId} partner=${partner_id} publish=${consent_publish} portfolio=${consent_portfolio} marketing=${consent_marketing}`
    ).catch(() => { });

    return NextResponse.json({ ok: true, consent });
}

export async function DELETE(request: NextRequest) {
    const auth = await getFotoMatchAuth(request, { requireActive: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const partnerId = Number(request.nextUrl.searchParams.get('partner_id'));
    if (!Number.isInteger(partnerId) || partnerId <= 0) {
        return NextResponse.json({ error: 'INVALID_PARTNER_ID' }, { status: 400 });
    }
    const reason = request.nextUrl.searchParams.get('reason') || null;

    const updated = await prisma.fotoMatchSessionConsent.updateMany({
        where: { profile_id: auth.profile!.id, match_partner_id: partnerId, withdrawn_at: null },
        data: { withdrawn_at: new Date(), withdrawn_reason: reason },
    });

    await logSystem('INFO', 'FOTO_MATCH', `consent withdrawn profile=${auth.profile!.id} partner=${partnerId} count=${updated.count}`).catch(() => { });

    return NextResponse.json({ ok: true, withdrawn: updated.count });
}
