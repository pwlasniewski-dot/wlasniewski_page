import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

// Public endpoint - records visitor behavior on the invite page.
// Idempotency: for non-CTA milestone events we record each unique event_type at most once per challenge
// (so refresh doesn't spam timeline). CTA clicks always record.

const ALLOWED_EVENTS = new Set([
    'page_viewed',
    'scrolled_25',
    'scrolled_50',
    'scrolled_75',
    'scrolled_100',
    'cta_accept_clicked',
    'cta_reject_clicked',
    'cta_pay_clicked',
    'package_details_opened',
    'gallery_opened',
    'maps_opened',
    'shared_clicked',
    'pdf_downloaded',
    'ics_downloaded',
]);

const ALWAYS_RECORD = new Set([
    'cta_accept_clicked',
    'cta_reject_clicked',
    'cta_pay_clicked',
    'shared_clicked',
    'pdf_downloaded',
    'ics_downloaded',
]);

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ unique_link: string }> }
) {
    try {
        const { unique_link } = await params;
        const body = await request.json().catch(() => ({} as any));
        const event_type = String(body?.event_type || '').slice(0, 64);
        const description = body?.description ? String(body.description).slice(0, 256) : null;
        const meta = body?.meta && typeof body.meta === 'object' ? body.meta : null;

        if (!ALLOWED_EVENTS.has(event_type)) {
            return NextResponse.json({ success: false, error: 'unknown event_type' }, { status: 400 });
        }

        const challenge = await prisma.photoChallenge.findUnique({
            where: { unique_link },
            select: { id: true },
        });
        if (!challenge) {
            return NextResponse.json({ success: false, error: 'not found' }, { status: 404 });
        }

        if (!ALWAYS_RECORD.has(event_type)) {
            const exists = await prisma.challengeTimelineEvent.findFirst({
                where: { challenge_id: challenge.id, event_type },
                select: { id: true },
            });
            if (exists) {
                return NextResponse.json({ success: true, deduped: true });
            }
        }

        // Best-effort context (do not 500 on missing headers)
        const ua = request.headers.get('user-agent') || '';
        const ref = request.headers.get('referer') || '';
        const ipRaw =
            request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            '';
        const ip = ipRaw.split(',')[0].trim();

        const metaPayload = {
            ...(meta || {}),
            ...(ref ? { ref } : {}),
            ...(ua ? { ua: ua.slice(0, 200) } : {}),
            ...(ip ? { ip } : {}),
        };

        await prisma.challengeTimelineEvent.create({
            data: {
                challenge_id: challenge.id,
                event_type,
                event_description: description,
                metadata: Object.keys(metaPayload).length ? JSON.stringify(metaPayload) : null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('track event failed', e);
        return NextResponse.json({ success: false, error: 'track failed' }, { status: 500 });
    }
}
