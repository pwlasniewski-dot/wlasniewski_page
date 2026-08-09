import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

const BOT_MARKERS = [
  'bot', 'crawler', 'spider', 'lighthouse', 'headless', 'phantom',
  'prerender', 'googlebot', 'bingbot', 'slackbot', 'facebookexternalhit',
  'netlify', 'vercel', 'bitballoon', 'uptime', 'monitoring'
];

const MAX_BATCH = 50;
const MAX_METADATA_LENGTH = 12_000;

function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
}

function shouldTrack(req: NextRequest) {
  const ip = clientIp(req);
  const excluded = (process.env.ADMIN_IP || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  if (excluded.includes(ip) || ['127.0.0.1', '::1', 'localhost'].includes(ip)) return false;

  const userAgent = (req.headers.get('user-agent') || '').toLowerCase();
  if (BOT_MARKERS.some(marker => userAgent.includes(marker))) return false;

  if (req.headers.get('x-traffic-type') === 'deploy-preview') return false;
  return true;
}

function deviceFromUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet/.test(ua)) return 'tablet';
  if (/mobile|iphone|android/.test(ua)) return 'mobile';
  return 'desktop';
}

function browserFromUserAgent(userAgent: string) {
  if (/edg/i.test(userAgent)) return 'Edge';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/chrome|crios/i.test(userAgent)) return 'Chrome';
  if (/safari/i.test(userAgent)) return 'Safari';
  return 'Other';
}

function safeText(value: unknown, max = 500) {
  if (typeof value !== 'string') return undefined;
  return value.slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    if (!shouldTrack(req)) {
      return NextResponse.json({ ok: true, tracked: false, reason: 'excluded' });
    }

    const body = await req.json();
    const rawEvents = Array.isArray(body?.events) ? body.events : body?.event ? [body.event] : [];
    if (rawEvents.length === 0) {
      return NextResponse.json({ ok: false, error: 'No events provided' }, { status: 400 });
    }

    const events = rawEvents.slice(0, MAX_BATCH);
    const userAgent = req.headers.get('user-agent') || '';
    const serverContext = {
      analytics_version: 2,
      device: deviceFromUserAgent(userAgent),
      browser: browserFromUserAgent(userAgent),
      language: req.headers.get('accept-language')?.split(',')[0] || null,
      received_at: new Date().toISOString(),
    };

    let saved = 0;

    for (const raw of events) {
      const eventType = safeText(raw?.event_type, 80);
      const sessionId = safeText(raw?.session_id, 120);
      const userId = safeText(raw?.user_id, 120);
      const pageUrl = safeText(raw?.page_url, 1000);

      if (!eventType || !sessionId || !userId || !eventType.startsWith('v2_')) continue;
      if (pageUrl?.startsWith('/admin')) continue;

      const metadata = {
        ...(raw?.metadata && typeof raw.metadata === 'object' ? raw.metadata : {}),
        ...serverContext,
      };
      const serializedMetadata = JSON.stringify(metadata).slice(0, MAX_METADATA_LENGTH);

      await prisma.analyticsEvent.create({
        data: {
          event_type: eventType,
          page_url: pageUrl || '/',
          user_id: userId,
          session_id: sessionId,
          referrer: safeText(raw?.referrer, 1000) || null,
          utm_source: safeText(raw?.utm_source, 255) || null,
          utm_medium: safeText(raw?.utm_medium, 255) || null,
          utm_campaign: safeText(raw?.utm_campaign, 255) || null,
          metadata: serializedMetadata,
        },
      });
      saved++;
    }

    return NextResponse.json({ ok: true, tracked: true, saved });
  } catch (error) {
    console.error('[Analytics V2 track]', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
