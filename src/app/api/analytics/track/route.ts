import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

const EXCLUDED_IPS = [
    process.env.ADMIN_IP,
    '127.0.0.1',
    'localhost',
    '::1'
].filter(Boolean);

const BOT_USER_AGENTS = [
    'bot', 'crawler', 'spider', 'lighthouse',
    'headless', 'phantom', 'prerender', 'googlebot',
    'bingbot', 'slackbot', 'facebookexternalhit'
];

function shouldTrack(req: NextRequest): boolean {
    // Get IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        req.headers.get('x-real-ip') ||
        'unknown';

    if (EXCLUDED_IPS.includes(ip)) {
        console.log('[Analytics] Skipped - excluded IP:', ip);
        return false;
    }

    // Check user agent
    const userAgent = req.headers.get('user-agent') || '';
    if (BOT_USER_AGENTS.some(bot => userAgent.toLowerCase().includes(bot))) {
        console.log('[Analytics] Skipped - bot detected');
        return false;
    }

    return true;
}

function detectDevice(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    return 'desktop';
}

function detectBrowser(userAgent: string): string {
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Other';
}

export async function POST(req: NextRequest) {
    try {
        if (!shouldTrack(req)) {
            return NextResponse.json({ ok: true, tracked: false });
        }

        const { events } = await req.json();

        if (!events || !Array.isArray(events) || events.length === 0) {
            return NextResponse.json({ error: 'No events provided' }, { status: 400 });
        }

        const userAgent = req.headers.get('user-agent') || '';
        const deviceType = detectDevice(userAgent);
        const browser = detectBrowser(userAgent);

        for (const event of events) {
            const { session_id, page_url, event_type, metadata, ...otherData } = event;

            // Skip admin routes
            if (page_url?.startsWith('/admin')) continue;

            // Record to AnalyticsEvent table (using existing schema)
            try {
                await prisma.analyticsEvent.create({
                    data: {
                        event_type: event_type || 'unknown',
                        page_url: page_url || '',
                        user_id: session_id || 'unknown',
                        session_id: session_id || 'unknown',
                        referrer: metadata?.referrer || null,
                        utm_source: metadata?.utm_source || null,
                        utm_medium: metadata?.utm_medium || null,
                        utm_campaign: metadata?.utm_campaign || null,
                        metadata: metadata ? JSON.stringify(metadata) : null
                    }
                });
            } catch (dbError) {
                console.error('[Analytics] Failed to save event:', dbError);
                // Don't block response if analytics fails
            }
        }

        return NextResponse.json({ ok: true, tracked: true, count: events.length });
    } catch (error) {
        console.error('[Analytics API] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
