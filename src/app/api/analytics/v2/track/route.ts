import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import {
  consumeAnalyticsRateLimit,
  recordAnalyticsIngestMetric,
  trustedClientSignal,
  type AnalyticsIngestReason,
} from '@/lib/analytics/ingestGuard';
import { trustedSiteHostFromOrigin } from '@/lib/analytics/siteHost';

const BOT_MARKERS = [
  'bot', 'crawler', 'spider', 'lighthouse', 'headless', 'phantom',
  'prerender', 'googlebot', 'bingbot', 'slackbot', 'facebookexternalhit',
  'netlify', 'vercel', 'bitballoon', 'uptime', 'monitoring'
];

const MAX_BATCH = 50;
const MAX_METADATA_LENGTH = 2_000;
const MAX_BODY_BYTES = 64_000;
const MAX_EVENTS_PER_MINUTE = 120;
const ALLOWED_EVENTS = new Set([
  'v2_session_start', 'v2_page_view', 'v2_engagement', 'v2_click',
  'v2_form_start', 'v2_form_submit', 'v2_visibility_hidden',
  'v2_visibility_visible', 'v2_page_exit', 'v2_booking_start',
  'v2_booking_created', 'v2_payment_started', 'v2_payment_success',
  'v2_payment_failed',
  'v2_booking_view', 'v2_service_selected', 'v2_package_selected',
  'v2_date_selected', 'v2_time_selected', 'v2_booking_added_to_cart',
  'v2_booking_form_started', 'v2_booking_validation_failed',
  'v2_aero_inquiry_started', 'v2_aero_inquiry_submitted',
  'v2_checkout_view', 'v2_checkout_submit', 'v2_payu_redirect',
  'v2_service_load_result', 'v2_availability_result', 'v2_checkout_result',
  'v2_client_error', 'v2_performance',
]);
const BLOCKED_PATHS = [
  '/admin', '/api', '/galeria', '/konto', '/strefa-klienta', '/logowanie',
  '/rejestracja', '/invite', '/foto-wyzwanie/invite',
  '/karta-podarunkowa/dostep', '/z/',
];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function clientIp(req: NextRequest) {
  return trustedClientSignal(req.headers);
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

function safePath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let path = value;
  try {
    if (value.startsWith('http')) path = new URL(value).pathname;
  } catch {
    return null;
  }
  path = path.split('?')[0]?.split('#')[0] || '/';
  if (!path.startsWith('/')) return null;
  if (BLOCKED_PATHS.some(prefix => path === prefix || path.startsWith(prefix))) return null;
  const redacted = path.split('/').map(segment => {
    if (/^\d{2,}$/.test(segment)) return ':id';
    if (UUID_RE.test(segment)) return ':id';
    if (segment.length >= 40 && /^[a-zA-Z0-9_-]+$/.test(segment)) return ':token';
    return segment;
  }).join('/');
  return redacted.slice(0, 500);
}

function safeReferrer(value: unknown) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.hostname}`.slice(0, 255);
  } catch {
    return null;
  }
}

function sourceFromSignals(referrer: unknown, utmSource: unknown, utmMedium: unknown) {
  const source = safeCampaign(utmSource)?.toLowerCase() || '';
  const medium = safeCampaign(utmMedium)?.toLowerCase() || '';
  if (source || medium) {
    if (source.includes('google') && /(cpc|paid|ppc)/.test(medium)) return 'Google Ads';
    if (source.includes('facebook') || source === 'fb') return 'Facebook';
    if (source.includes('instagram') || source === 'ig') return 'Instagram';
    if (source.includes('google')) return 'Google';
    return 'Campaign';
  }
  if (typeof referrer !== 'string' || !referrer) return 'Direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase();
    if (/(^|\.)google\.[a-z.]+$/.test(host)) {
      return url.pathname.startsWith('/maps') ? 'Google Business Profile' : 'Google Organic';
    }
    if (/(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(host)) return 'Facebook';
    if (/(^|\.)instagram\.com$/.test(host)) return 'Instagram';
    return host.replace(/^www\./, '') || 'Referral';
  } catch {
    return 'Direct';
  }
}

function safeCampaign(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.slice(0, 80);
  return /^[a-zA-Z0-9._-]+$/.test(normalized) ? normalized : null;
}

function safeMetadata(raw: unknown, eventType: string) {
  const value = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  if (value.consent !== true) return null;
  const result: Record<string, unknown> = { consent: true };
  const stringKeys = ['client_ts', 'session_started_at', 'timezone', 'viewport', 'tag', 'analytics_id', 'form_id'];
  for (const key of stringKeys) {
    const safe = safeText(value[key], key === 'source' ? 100 : 80);
    if (safe) result[key] = safe;
  }
  const enumValues: Record<string, ReadonlySet<string>> = {
    status: new Set(['ok', 'error', 'failed']),
    area: new Set(['services', 'availability', 'checkout', 'payu', 'javascript', 'booking_form']),
    endpoint: new Set(['basket_checkout']),
    reason_code: new Set(['http_error', 'network_error', 'runtime_error', 'unhandled_promise', 'request_failed', 'required_missing', 'no_active_services']),
    metric: new Set(['lcp']),
    amount_bucket: new Set(['under_500', '500_999', '1000_plus']),
    field_group: new Set(['service', 'package', 'date_time', 'contact', 'consent', 'venue']),
  };
  const eventMetadataKeys: Record<string, ReadonlySet<string>> = {
    v2_booking_view: new Set(['package_count']),
    v2_service_selected: new Set(),
    v2_package_selected: new Set(['amount_bucket']),
    v2_date_selected: new Set(),
    v2_time_selected: new Set(),
    v2_booking_form_started: new Set(['area']),
    v2_booking_validation_failed: new Set(['status', 'area', 'reason_code', 'field_group']),
    v2_booking_added_to_cart: new Set(['item_count', 'amount_bucket']),
    v2_checkout_view: new Set(['item_count']),
    v2_checkout_submit: new Set(['item_count', 'amount_bucket']),
    v2_payu_redirect: new Set(['status', 'area']),
    v2_service_load_result: new Set(['status', 'area', 'http_status', 'package_count', 'reason_code']),
    v2_availability_result: new Set(['status', 'area', 'http_status', 'available_count', 'has_available_slots', 'reason_code']),
    v2_checkout_result: new Set(['status', 'area', 'endpoint', 'http_status', 'has_payment_redirect', 'reason_code']),
    v2_client_error: new Set(['status', 'area', 'reason_code']),
    v2_performance: new Set(['metric', 'duration_ms']),
  };
  const allowedEventKeys = eventMetadataKeys[eventType] || new Set<string>();
  for (const [key, allowed] of Object.entries(enumValues)) {
    if (!allowedEventKeys.has(key)) continue;
    const candidate = typeof value[key] === 'string' ? value[key] : '';
    if (allowed.has(candidate)) result[key] = candidate;
  }
  const landing = safePath(value.landing_page);
  const route = safePath(value.route);
  if (landing) result.landing_page = landing;
  if (route) result.route = route;
  if (typeof value.active === 'boolean') result.active = value.active;
  for (const key of ['has_payment_redirect', 'has_available_slots']) {
    if (allowedEventKeys.has(key) && typeof value[key] === 'boolean') result[key] = value[key];
  }
  for (const key of ['duration_ms', 'http_status', 'available_count', 'package_count', 'item_count']) {
    const number = Number(value[key]);
    if (allowedEventKeys.has(key) && Number.isFinite(number) && number >= 0 && number <= 600_000) result[key] = Math.round(number);
  }
  if (eventType === 'v2_engagement') {
    const activeMs = Number(value.active_ms);
    if (!Number.isFinite(activeMs) || activeMs < 1 || activeMs > 30_000) return null;
    result.active_ms = Math.round(activeMs);
  }
  return result;
}

export async function POST(req: NextRequest) {
  const respond = async (
    reason: AnalyticsIngestReason,
    outcome: 'accepted' | 'rejected' | 'excluded' | 'error',
    eventCount: number,
    body: Record<string, unknown>,
    status = 200,
  ) => {
    await recordAnalyticsIngestMetric(reason, outcome, eventCount);
    return NextResponse.json({ ...body, reason }, { status });
  };

  try {
    const signal = clientIp(req);
    try {
      const requestAllowed = await consumeAnalyticsRateLimit({
        signal: `requests:${signal}`,
        cost: 1,
        limit: 120,
      });
      if (!requestAllowed) {
        return respond('rate_limited', 'rejected', 0, { ok: false, error: 'Rate limit exceeded' }, 429);
      }
    } catch (error) {
      // Fail closed. Avoid a second database call for metrics when the shared
      // limiter itself is unavailable; the structured log is the fallback.
      console.error('[Analytics V2 request limiter unavailable]', error);
      return NextResponse.json(
        { ok: false, error: 'Analytics temporarily unavailable', reason: 'limiter_unavailable' },
        { status: 503 },
      );
    }

    const contentLength = Number(req.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return respond('payload_too_large', 'rejected', 0, { ok: false, error: 'Payload too large' }, 413);
    }
    const origin = req.headers.get('origin');
    if (!origin) return respond('missing_origin', 'rejected', 0, { ok: false, error: 'Missing origin' }, 403);
    if (origin) {
      try {
        if (new URL(origin).host !== req.nextUrl.host) {
          return respond('invalid_origin', 'rejected', 0, { ok: false, error: 'Invalid origin' }, 403);
        }
      } catch {
        return respond('invalid_origin', 'rejected', 0, { ok: false, error: 'Invalid origin' }, 403);
      }
    }
    if (!shouldTrack(req)) {
      return respond('excluded', 'excluded', 0, { ok: true, tracked: false });
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) {
      return respond('payload_too_large', 'rejected', 0, { ok: false, error: 'Payload too large' }, 413);
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return respond('invalid_json', 'rejected', 0, { ok: false, error: 'Invalid JSON' }, 400);
    }
    const rawEvents = Array.isArray(body?.events) ? body.events : body?.event ? [body.event] : [];
    if (rawEvents.length === 0) {
      return respond('empty_batch', 'rejected', 0, { ok: false, error: 'No events provided' }, 400);
    }
    if (rawEvents.length > MAX_BATCH) {
      return respond('batch_too_large', 'rejected', rawEvents.length, { ok: false, error: 'Too many events' }, 413);
    }

    try {
      const withinLimit = await consumeAnalyticsRateLimit({
        signal: `events:${signal}`,
        cost: rawEvents.length,
        limit: MAX_EVENTS_PER_MINUTE,
      });
      if (!withinLimit) {
        return respond('rate_limited', 'rejected', rawEvents.length, { ok: false, error: 'Rate limit exceeded' }, 429);
      }
    } catch (error) {
      console.error('[Analytics V2 limiter unavailable]', error);
      return respond(
        'limiter_unavailable',
        'error',
        rawEvents.length,
        { ok: false, error: 'Analytics temporarily unavailable' },
        503,
      );
    }

    const events = rawEvents;
    const userAgent = req.headers.get('user-agent') || '';
    const serverContext = {
      analytics_version: 2,
      device: deviceFromUserAgent(userAgent),
      browser: browserFromUserAgent(userAgent),
      language: req.headers.get('accept-language')?.split(',')[0] || null,
      received_at: new Date().toISOString(),
      site_host: trustedSiteHostFromOrigin(origin),
    };

    const rows: any[] = [];

    for (const raw of events) {
      const eventType = safeText(raw?.event_type, 80);
      const sessionId = safeText(raw?.session_id, 120);
      const userId = safeText(raw?.user_id, 120);
      const pageUrl = safePath(raw?.page_url);

      if (!eventType || !sessionId || !userId || !pageUrl || !ALLOWED_EVENTS.has(eventType)) continue;
      if (!UUID_RE.test(sessionId) || !UUID_RE.test(userId)) continue;

      const clientMetadata = safeMetadata(raw?.metadata, eventType);
      if (!clientMetadata) continue;
      const metadata = {
        ...clientMetadata,
        ...serverContext,
        source: sourceFromSignals(raw?.referrer, raw?.utm_source, raw?.utm_medium),
      };
      const serializedMetadata = JSON.stringify(metadata).slice(0, MAX_METADATA_LENGTH);

      rows.push({
          event_type: eventType,
          page_url: pageUrl,
          user_id: userId,
          session_id: sessionId,
          referrer: safeReferrer(raw?.referrer),
          utm_source: safeCampaign(raw?.utm_source),
          utm_medium: safeCampaign(raw?.utm_medium),
          utm_campaign: safeCampaign(raw?.utm_campaign),
          metadata: serializedMetadata,
      });
    }

    if (!rows.length) {
      return respond('no_valid_events', 'rejected', rawEvents.length, { ok: false, error: 'No valid events' }, 400);
    }

    try {
      await prisma.analyticsEvent.createMany({ data: rows });
    } catch (error) {
      console.error('[Analytics V2 event storage]', error);
      return respond('storage_error', 'error', rows.length, { ok: false, error: 'Internal server error' }, 500);
    }

    return respond('accepted', 'accepted', rows.length, { ok: true, tracked: true, saved: rows.length });
  } catch (error) {
    console.error('[Analytics V2 track]', error);
    return respond('storage_error', 'error', 0, { ok: false, error: 'Internal server error' }, 500);
  }
}
