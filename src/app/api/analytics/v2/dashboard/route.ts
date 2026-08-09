import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { getFinanceSummary } from '@/lib/analytics/finance';
import { diagnoseFunnel } from '@/lib/analytics/funnelDiagnostics';

const TIME_ZONE = 'Europe/Warsaw';
const MAX_RANGE_DAYS = 120;

type Granularity = 'hour' | 'day' | 'week';

type ParsedEvent = {
  id: number;
  event_type: string;
  page_url: string | null;
  user_id: string;
  session_id: string;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: Date;
  metadata: Record<string, any>;
};

type IngestMetricRow = {
  reason_code: string;
  outcome: string;
  batch_count: bigint;
  event_count: bigint;
};

function parseMetadata(value: string | null): Record<string, any> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function parseDate(value: string | null, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function localParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
  };
}

function bucketKey(date: Date, granularity: Granularity) {
  const p = localParts(date);
  const y = String(p.year).padStart(4, '0');
  const m = String(p.month).padStart(2, '0');
  const d = String(p.day).padStart(2, '0');

  if (granularity === 'hour') return `${y}-${m}-${d} ${String(p.hour).padStart(2, '0')}:00`;
  if (granularity === 'day') return `${y}-${m}-${d}`;

  const localNoon = new Date(Date.UTC(p.year, p.month - 1, p.day, 12));
  const day = localNoon.getUTCDay() || 7;
  localNoon.setUTCDate(localNoon.getUTCDate() - day + 1);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(localNoon);
}

function bucketKeys(start: Date, end: Date, granularity: Granularity) {
  const keys = new Set<string>();
  const stepMs = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  for (let cursor = start.getTime(); cursor < end.getTime(); cursor += stepMs) {
    keys.add(bucketKey(new Date(cursor), granularity));
  }
  if (end > start) keys.add(bucketKey(new Date(end.getTime() - 1), granularity));
  return Array.from(keys).sort();
}

function normalizePath(value: string | null) {
  if (!value) return '/';
  try {
    if (value.startsWith('http')) return new URL(value).pathname;
  } catch {
    // fall through
  }
  return value.split('?')[0] || '/';
}

function isBookingStart(event: ParsedEvent) {
  return event.event_type === 'v2_booking_start'
    || event.event_type === 'v2_booking_started';
}

function isBookingComplete(event: ParsedEvent) {
  return ['v2_booking_created', 'v2_booking_complete', 'v2_booking_completed'].includes(event.event_type);
}

function summarize(events: ParsedEvent[]) {
  const users = new Set(events.map(event => event.user_id).filter(Boolean));
  const sessions = new Set(events.map(event => event.session_id).filter(Boolean));
  const pageViews = events.filter(event => event.event_type === 'v2_page_view').length;
  const activeMs = events
    .filter(event => event.event_type === 'v2_engagement')
    .reduce((sum, event) => sum + Number(event.metadata.active_ms || 0), 0);
  const bookingStarts = events.filter(isBookingStart).length;
  const bookingCompletes = events.filter(isBookingComplete).length;

  return {
    users: users.size,
    sessions: sessions.size,
    pageViews,
    activeMs,
    avgActiveMsPerSession: sessions.size ? Math.round(activeMs / sessions.size) : 0,
    bookingStarts,
    bookingCompletes,
  };
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;

  try {
    const now = new Date();
    const params = request.nextUrl.searchParams;
    const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const start = parseDate(params.get('start'), defaultStart);
    const end = parseDate(params.get('end'), now);
    const granularity = (['hour', 'day', 'week'].includes(params.get('granularity') || '')
      ? params.get('granularity')
      : 'hour') as Granularity;

    if (start >= end) {
      return NextResponse.json({ success: false, message: 'Invalid date range' }, { status: 400 });
    }

    const rangeMs = end.getTime() - start.getTime();
    if (rangeMs > MAX_RANGE_DAYS * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ success: false, message: `Maximum range is ${MAX_RANGE_DAYS} days` }, { status: 400 });
    }

    const previousEnd = new Date(start);
    const previousStart = new Date(start.getTime() - rangeMs);

    const [currentRows, previousRows, bookings, finance, previousFinance, ingestMetricRows] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: {
          event_type: { startsWith: 'v2_' },
          created_at: { gte: start, lt: end },
        },
        orderBy: { created_at: 'asc' },
      }),
      prisma.analyticsEvent.findMany({
        where: {
          event_type: { startsWith: 'v2_' },
          created_at: { gte: previousStart, lt: previousEnd },
        },
        orderBy: { created_at: 'asc' },
      }),
      prisma.booking.findMany({
        where: { created_at: { gte: start, lt: end } },
        select: { id: true, price: true, status: true, created_at: true, service: true, package: true },
      }),
      getFinanceSummary(start, end),
      getFinanceSummary(previousStart, previousEnd),
      prisma.$queryRaw<IngestMetricRow[]>(Prisma.sql`
        SELECT "reason_code", "outcome",
               SUM("batch_count")::bigint AS "batch_count",
               SUM("event_count")::bigint AS "event_count"
        FROM "analytics_ingest_metrics"
        WHERE "bucket_start" >= ${start} AND "bucket_start" < ${end}
        GROUP BY "reason_code", "outcome"
        ORDER BY SUM("batch_count") DESC
      `),
    ]);

    const events: ParsedEvent[] = currentRows.map(row => ({ ...row, metadata: parseMetadata(row.metadata) }));
    const previousEvents: ParsedEvent[] = previousRows.map(row => ({ ...row, metadata: parseMetadata(row.metadata) }));

    const summary = summarize(events);
    const previousSummary = summarize(previousEvents);
    const diagnostics = diagnoseFunnel(events);

    const seriesMap = new Map<string, {
      users: Set<string>;
      sessions: Set<string>;
      pageViews: number;
      activeMs: number;
      bookingStarts: number;
      bookingCompletes: number;
    }>();

    for (const key of bucketKeys(start, end, granularity)) {
      seriesMap.set(key, {
        users: new Set<string>(), sessions: new Set<string>(), pageViews: 0,
        activeMs: 0, bookingStarts: 0, bookingCompletes: 0,
      });
    }

    for (const event of events) {
      const key = bucketKey(event.created_at, granularity);
      const bucket = seriesMap.get(key) || {
        users: new Set<string>(), sessions: new Set<string>(), pageViews: 0,
        activeMs: 0, bookingStarts: 0, bookingCompletes: 0,
      };
      bucket.users.add(event.user_id);
      bucket.sessions.add(event.session_id);
      if (event.event_type === 'v2_page_view') bucket.pageViews++;
      if (event.event_type === 'v2_engagement') bucket.activeMs += Number(event.metadata.active_ms || 0);
      if (isBookingStart(event)) bucket.bookingStarts++;
      if (isBookingComplete(event)) bucket.bookingCompletes++;
      seriesMap.set(key, bucket);
    }

    const timeSeries = Array.from(seriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bucket, value]) => ({
        bucket,
        users: value.users.size,
        sessions: value.sessions.size,
        pageViews: value.pageViews,
        activeMinutes: Math.round(value.activeMs / 600) / 100,
        bookingStarts: value.bookingStarts,
        bookingCompletes: value.bookingCompletes,
      }));

    const sessionMap = new Map<string, any>();
    for (const event of events) {
      let session = sessionMap.get(event.session_id);
      if (!session) {
        session = {
          sessionId: event.session_id,
          userId: event.user_id,
          startedAt: event.created_at,
          endedAt: event.created_at,
          source: event.metadata.source || 'Unknown',
          landingPage: event.metadata.landing_page || event.page_url || '/',
          device: event.metadata.device || 'unknown',
          browser: event.metadata.browser || 'unknown',
          pageViews: 0,
          activeMs: 0,
          clicks: 0,
          bookingStarted: false,
          bookingCompleted: false,
          path: [] as Array<{ at: Date; event: string; page: string }>,
        };
      }

      if (event.created_at < session.startedAt) session.startedAt = event.created_at;
      if (event.created_at > session.endedAt) session.endedAt = event.created_at;
      if (event.metadata.source && session.source === 'Unknown') session.source = event.metadata.source;
      if (event.metadata.device && session.device === 'unknown') session.device = event.metadata.device;
      if (event.metadata.browser && session.browser === 'unknown') session.browser = event.metadata.browser;
      if (event.event_type === 'v2_page_view') session.pageViews++;
      if (event.event_type === 'v2_engagement') session.activeMs += Number(event.metadata.active_ms || 0);
      if (event.event_type === 'v2_click') session.clicks++;
      if (isBookingStart(event)) session.bookingStarted = true;
      if (isBookingComplete(event)) session.bookingCompleted = true;

      if ([
        'v2_session_start', 'v2_page_view', 'v2_click', 'v2_form_start', 'v2_form_submit',
        'v2_booking_view', 'v2_service_selected', 'v2_package_selected', 'v2_date_selected',
        'v2_time_selected', 'v2_booking_added_to_cart', 'v2_checkout_view', 'v2_checkout_submit',
        'v2_checkout_result', 'v2_payu_redirect', 'v2_booking_start', 'v2_booking_created',
        'v2_payment_success', 'v2_payment_failed',
      ].includes(event.event_type)) {
        session.path.push({ at: event.created_at, event: event.event_type.replace(/^v2_/, ''), page: normalizePath(event.page_url) });
      }
      sessionMap.set(event.session_id, session);
    }

    const recentSessions = Array.from(sessionMap.values())
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, 100)
      .map(session => ({
        ...session,
        durationMs: Math.max(0, session.endedAt.getTime() - session.startedAt.getTime()),
        activeMinutes: Math.round(session.activeMs / 600) / 100,
        path: session.path.slice(0, 80),
      }));

    const sourceMap = new Map<string, Set<string>>();
    for (const session of sessionMap.values()) {
      const source = session.source || 'Unknown';
      const set = sourceMap.get(source) || new Set<string>();
      set.add(session.sessionId);
      sourceMap.set(source, set);
    }
    const sources = Array.from(sourceMap.entries())
      .map(([source, sessionsSet]) => ({ source, sessions: sessionsSet.size }))
      .sort((a, b) => b.sessions - a.sessions);

    const pageMap = new Map<string, { views: number; sessions: Set<string>; activeMs: number }>();
    for (const event of events) {
      const page = normalizePath(event.page_url);
      const row = pageMap.get(page) || { views: 0, sessions: new Set<string>(), activeMs: 0 };
      row.sessions.add(event.session_id);
      if (event.event_type === 'v2_page_view') row.views++;
      if (event.event_type === 'v2_engagement') row.activeMs += Number(event.metadata.active_ms || 0);
      pageMap.set(page, row);
    }
    const pages = Array.from(pageMap.entries())
      .map(([page, row]) => ({
        page,
        views: row.views,
        sessions: row.sessions.size,
        activeMinutes: Math.round(row.activeMs / 600) / 100,
      }))
      .filter(row => row.views > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 50);

    const pctChange = (current: number, previous: number) => previous === 0
      ? (current === 0 ? 0 : null)
      : Math.round(((current - previous) / previous) * 1000) / 10;

    const ingestReasons = ingestMetricRows.map(row => ({
      reason: row.reason_code,
      outcome: row.outcome,
      batches: Number(row.batch_count),
      events: Number(row.event_count),
    }));
    const ingestCount = (outcome: string, field: 'batches' | 'events') => ingestReasons
      .filter(row => row.outcome === outcome)
      .reduce((sum, row) => sum + row[field], 0);

    return NextResponse.json({
      success: true,
      version: 2,
      timezone: TIME_ZONE,
      range: { start: start.toISOString(), end: end.toISOString(), granularity },
      dataQuality: {
        deterministic: true,
        legacyEventsExcluded: true,
        syntheticValues: false,
        sessionTimeoutMinutes: 30,
        note: 'Dashboard uses only event_type beginning with v2_. Legacy analytics are excluded.',
        ingest: {
          acceptedBatches: ingestCount('accepted', 'batches'),
          acceptedEvents: ingestCount('accepted', 'events'),
          rejectedBatches: ingestCount('rejected', 'batches'),
          rejectedEvents: ingestCount('rejected', 'events'),
          excludedBatches: ingestCount('excluded', 'batches'),
          errorBatches: ingestCount('error', 'batches'),
          reasons: ingestReasons,
        },
      },
      financeCoverage: {
        mode: finance.coverage,
        ledgerStartedAt: finance.coverageStartedAt?.toISOString() || null,
        note: 'Wpływy obejmują kanoniczny rejestr transakcji oraz rozpoznane starsze wpłaty. Historia sprzed uruchomienia rejestru może być niepełna.',
      },
      summary: {
        ...summary,
        activeMinutes: Math.round(summary.activeMs / 600) / 100,
        bookings: finance.bookingCount,
        bookingValue: finance.bookingValueGross / 100,
        receivedPaymentsNet: finance.receivedPaymentsNet / 100,
        refunds: finance.refundsGross / 100,
        accountingRevenue: null,
        income: null,
        conversionRate: summary.sessions ? Math.round((summary.bookingCompletes / summary.sessions) * 1000) / 10 : 0,
      },
      comparison: {
        usersPct: pctChange(summary.users, previousSummary.users),
        sessionsPct: pctChange(summary.sessions, previousSummary.sessions),
        pageViewsPct: pctChange(summary.pageViews, previousSummary.pageViews),
        activeTimePct: pctChange(summary.activeMs, previousSummary.activeMs),
        bookingsPct: pctChange(finance.bookingCount, previousFinance.bookingCount),
        bookingValuePct: pctChange(finance.bookingValueGross, previousFinance.bookingValueGross),
        receivedPaymentsPct: pctChange(finance.receivedPaymentsNet, previousFinance.receivedPaymentsNet),
      },
      timeSeries,
      diagnostics,
      sources,
      pages,
      recentSessions,
      bookings: bookings.map(booking => ({
        id: booking.id,
        createdAt: booking.created_at,
        service: booking.service,
        package: booking.package,
        status: booking.status,
        price: (booking.price || 0) / 100,
      })),
    });
  } catch (error) {
    console.error('[Analytics V2 dashboard]', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch Analytics V2' }, { status: 500 });
  }
}
