import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db/prisma';
import { requireAuth } from '@/lib/auth/middleware';
import { fetchGscComparison, gscIdentity, propertyHost, type GscMetric } from '@/lib/analytics/gsc';
import { diagnoseFunnel } from '@/lib/analytics/funnelDiagnostics';
import { isSemanticCta, pathsBeforeFirstBookingStart } from '@/lib/analytics/v3Attribution';
import { safeAnalyticsSiteHost } from '@/lib/analytics/siteHost';
import { previousEqualCalendarRange, warsawDateKey, warsawDateRange } from '@/lib/analytics/dateRange';
import { growthSignal, shouldCreateZeroBookingAction, trafficSampleStatus } from '@/lib/analytics/sampleStatus';
import {
  evaluatePageCompleteness, prioritizeDirectorActions, STATIC_PAGE_REGISTRY,
  portfolioPath, type DirectorAction, type PageSource,
} from '@/lib/analytics/pageRegistry';
import { b2bPublicPath, isB2bCmsPage } from '@/lib/sites/b2b-routing';
import { buildGscQueryReport } from '@/lib/analytics/gscQueryReport';

export const dynamic = 'force-dynamic';
const MAX_RANGE_DAYS = 120;

type Event = {
  event_type: string; page_url: string | null; user_id: string; session_id: string;
  created_at: Date; metadata: Record<string, unknown>;
};
type FirstPageRow = { page_url: string | null; created_at: Date; site_host: string };
type IngestRow = { reason_code: string; outcome: string; batch_count: bigint; event_count: bigint };
type RegistryRow = { site_host: string; path: string; first_published_at: Date | null; first_seen_analytics_at: Date | null; first_seen_gsc_at: Date | null };

async function fetchDashboardSource<T>(
  source: string,
  query: () => Promise<T>,
  fallback: T,
  unavailableSources: string[],
) {
  try {
    return await query();
  } catch (error) {
    unavailableSources.push(source);
    console.warn(`[Analytics V3 source unavailable: ${source}]`, error instanceof Error ? error.message : 'unknown');
    return fallback;
  }
}

function parseMetadata(raw: string | null): Record<string, unknown> {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function normalizePath(value: string | null | undefined) {
  if (!value) return '/';
  try { if (value.startsWith('http')) return new URL(value).pathname || '/'; } catch { /* invalid URL */ }
  const path = value.split('?')[0].split('#')[0] || '/';
  return path !== '/' ? path.replace(/\/$/, '') : path;
}

function analyticsPage(value: string | null | undefined, metadata?: Record<string, unknown>) {
  const path = normalizePath(value);
  const host = safeAnalyticsSiteHost(metadata?.site_host);
  return { host, path, identity: `${host}:${path}` } as const;
}

function countMedia(raw: string | null | undefined) {
  if (!raw) return 0;
  try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed.length : 1; } catch { return raw.split(',').filter(Boolean).length; }
}

function isBookingStart(event: Event) {
  return ['v2_booking_start', 'v2_booking_started', 'v2_booking_form_started', 'v2_drone_booking_started'].includes(event.event_type);
}

function isClientConversion(event: Event) {
  return ['v2_booking_created', 'v2_booking_complete', 'v2_booking_completed', 'v2_payment_success', 'v2_drone_booking_submitted'].includes(event.event_type);
}

function pct(current: number, previous: number) {
  return previous === 0 ? (current === 0 ? 0 : null) : Math.round(((current - previous) / previous) * 1000) / 10;
}

async function fetchIngestMetrics(start: Date, end: Date) {
  try {
    return await prisma.$queryRaw<IngestRow[]>(Prisma.sql`
      SELECT "reason_code", "outcome", SUM("batch_count")::bigint AS "batch_count", SUM("event_count")::bigint AS "event_count"
      FROM "analytics_ingest_metrics"
      WHERE "bucket_start" >= ${start} AND "bucket_start" < ${end}
      GROUP BY "reason_code", "outcome"
    `);
  } catch (error) {
    console.warn('[Analytics V3 ingest metrics unavailable]', error instanceof Error ? error.message : 'unknown');
    return [];
  }
}

function aggregateGsc(rows: GscMetric[]) {
  const map = new Map<string, { clicks: number; impressions: number; positionTotal: number; firstDate: string | null }>();
  for (const row of rows) {
    const identity = gscIdentity(row.siteUrl, row.page);
    const current = map.get(identity) || { clicks: 0, impressions: 0, positionTotal: 0, firstDate: null };
    current.clicks += row.clicks;
    current.impressions += row.impressions;
    current.positionTotal += row.position * row.impressions;
    current.firstDate = !current.firstDate || row.date < current.firstDate ? row.date : current.firstDate;
    map.set(identity, current);
  }
  return map;
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth(request);
  if (authError) return authError;
  try {
    const now = new Date();
    const startDateParam = request.nextUrl.searchParams.get('startDate'); const endDateParam = request.nextUrl.searchParams.get('endDate');
    const localRange = startDateParam && endDateParam ? warsawDateRange(startDateParam, endDateParam) : null;
    const previousCalendar = startDateParam && endDateParam ? previousEqualCalendarRange(startDateParam, endDateParam) : null;
    const end = localRange?.end || (request.nextUrl.searchParams.get('end') ? new Date(request.nextUrl.searchParams.get('end')!) : now);
    const start = localRange?.start || (request.nextUrl.searchParams.get('start')
      ? new Date(request.nextUrl.searchParams.get('start')!)
      : new Date(end.getTime() - 28 * 86_400_000));
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
      return NextResponse.json({ success: false, message: 'Nieprawidłowy zakres dat.' }, { status: 400 });
    }
    const rangeMs = end.getTime() - start.getTime();
    if (rangeMs > MAX_RANGE_DAYS * 86_400_000) {
      return NextResponse.json({ success: false, message: `Maksymalny zakres to ${MAX_RANGE_DAYS} dni.` }, { status: 400 });
    }
    const previousEnd = new Date(start);
    const previousStart = new Date(start.getTime() - rangeMs);

    const baselineNow = now;
    const baselineCurrentStart = new Date(baselineNow.getTime() - 28 * 86_400_000);
    const baselinePreviousStart = new Date(baselineNow.getTime() - 56 * 86_400_000);
    const unavailableSources: string[] = [];
    const [currentRaw, previousRaw, firstRaw, baselineRaw, cmsPages, blogPosts, portfolios, canonicalBookings, ingestRaw, gsc] = await Promise.all([
      fetchDashboardSource('analytics-current', () => prisma.analyticsEvent.findMany({ where: { event_type: { startsWith: 'v2_' }, created_at: { gte: start, lt: end } }, orderBy: { created_at: 'asc' } }), [], unavailableSources),
      fetchDashboardSource('analytics-previous', () => prisma.analyticsEvent.findMany({ where: { event_type: { startsWith: 'v2_' }, created_at: { gte: previousStart, lt: previousEnd } }, orderBy: { created_at: 'asc' } }), [], unavailableSources),
      fetchDashboardSource('analytics-first-seen', () => prisma.$queryRaw<FirstPageRow[]>(Prisma.sql`
        SELECT "page_url", MIN("created_at") AS "created_at",
               COALESCE(NULLIF((regexp_match(COALESCE("metadata", ''), '"site_host"\s*:\s*"([^"\\]+)"'))[1], ''), 'unknown') AS "site_host"
        FROM "analytics_events"
        WHERE "event_type" = 'v2_page_view'
        GROUP BY "page_url", COALESCE(NULLIF((regexp_match(COALESCE("metadata", ''), '"site_host"\s*:\s*"([^"\\]+)"'))[1], ''), 'unknown')
      `), [] as FirstPageRow[], unavailableSources),
      fetchDashboardSource('analytics-baseline', () => prisma.analyticsEvent.findMany({ where: { event_type: 'v2_page_view', created_at: { gte: baselinePreviousStart, lt: baselineNow } }, select: { event_type: true, page_url: true, session_id: true, created_at: true, metadata: true } }), [], unavailableSources),
      fetchDashboardSource('cms-pages', () => prisma.page.findMany({ select: { slug: true, page_type: true, title: true, content: true, meta_title: true, meta_description: true, is_published: true, hero_image: true, content_images: true, sections: true, updated_at: true } }), [], unavailableSources),
      fetchDashboardSource('blog-posts', () => prisma.blogPost.findMany({ select: { slug: true, title: true, content: true, meta_title: true, meta_description: true, status: true, published_at: true, featured_image_id: true, updated_at: true } }), [], unavailableSources),
      fetchDashboardSource('portfolio', () => prisma.portfolioSession.findMany({ select: { slug: true, category: true, title: true, description: true, meta_title: true, meta_description: true, is_published: true, cover_image_id: true, media_ids: true, updated_at: true } }), [], unavailableSources),
      fetchDashboardSource('bookings', () => prisma.booking.findMany({ where: { created_at: { gte: start, lt: end } }, select: { id: true, created_at: true, price: true, status: true } }), [], unavailableSources),
      fetchIngestMetrics(start, end),
      fetchGscComparison({ start, end, previousStart, previousEnd, now, calendarRanges: startDateParam && endDateParam && previousCalendar ? { current: { startDate: startDateParam, endDate: endDateParam }, previous: previousCalendar } : undefined }),
    ]);

    const events: Event[] = currentRaw.map(row => ({ ...row, metadata: parseMetadata(row.metadata) }));
    const previousEvents: Event[] = previousRaw.map(row => ({ ...row, metadata: parseMetadata(row.metadata) }));
    const sessions = new Map<string, Event[]>();
    for (const event of events) sessions.set(event.session_id, [...(sessions.get(event.session_id) || []), event]);

    const sessionIds = new Set(events.map(event => event.session_id));
    const userIds = new Set(events.map(event => event.user_id));
    const pageViews = events.filter(event => event.event_type === 'v2_page_view').length;
    const engagedSessions = Array.from(sessions.values()).filter(items => items.some(event => event.event_type === 'v2_engagement' && Number(event.metadata.active_ms || 0) >= 10_000)).length;
    const ctaSessions = new Set(events.filter(isSemanticCta).map(event => event.session_id)).size;
    const bookingStartSessions = new Set(events.filter(isBookingStart).map(event => event.session_id)).size;
    const conversionSessions = new Set(events.filter(isClientConversion).map(event => event.session_id)).size;
    const diagnostics = diagnoseFunnel(events);
    const previousSessions = new Set(previousEvents.map(event => event.session_id)).size;
    const previousUsers = new Set(previousEvents.map(event => event.user_id)).size;
    const previousPageViews = previousEvents.filter(event => event.event_type === 'v2_page_view').length;
    const unknownHostSessions = new Set(events.filter(event => safeAnalyticsSiteHost(event.metadata.site_host) === 'unknown').map(event => event.session_id));
    const sourceMap = new Map<string, Set<string>>();
    for (const event of events) {
      const source = typeof event.metadata.source === 'string' ? event.metadata.source : 'Unknown';
      const set = sourceMap.get(source) || new Set<string>(); set.add(event.session_id); sourceMap.set(source, set);
    }

    const pageAnalytics = new Map<string, {
      sessions: Set<string>; landing: Set<string>; assisted: Set<string>; cta: Set<string>;
      bookingStarts: Set<string>; clientConversions: Set<string>; firstAt: Date | null; daily: Map<string, Set<string>>;
    }>();
    const ensurePage = (path: string) => {
      const current = pageAnalytics.get(path) || {
        sessions: new Set<string>(), landing: new Set<string>(), assisted: new Set<string>(), cta: new Set<string>(),
        bookingStarts: new Set<string>(), clientConversions: new Set<string>(), firstAt: null, daily: new Map<string, Set<string>>(),
      };
      pageAnalytics.set(path, current);
      return current;
    };
    for (const [sessionId, items] of sessions) {
      const ordered = [...items].sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
      const viewedPages = Array.from(new Map(ordered.filter(event => event.event_type === 'v2_page_view').map(event => {
        const page = analyticsPage(event.page_url, event.metadata); return [page.identity, page];
      })).values());
      if (viewedPages[0]) ensurePage(viewedPages[0].identity).landing.add(sessionId);
      const hasStart = ordered.some(isBookingStart);
      const assistedPaths = new Set(pathsBeforeFirstBookingStart(ordered, event => analyticsPage(event.page_url, event.metadata).identity));
      for (const page of viewedPages) {
        const metric = ensurePage(page.identity);
        metric.sessions.add(sessionId);
        const viewedAt = ordered.find(event => event.event_type === 'v2_page_view' && analyticsPage(event.page_url, event.metadata).identity === page.identity)?.created_at;
        const day = viewedAt ? warsawDateKey(viewedAt) : null;
        if (day) { const set = metric.daily.get(day) || new Set<string>(); set.add(sessionId); metric.daily.set(day, set); }
        if (hasStart && assistedPaths.has(page.identity)) metric.assisted.add(sessionId);
      }
      for (const event of ordered) {
        const metric = ensurePage(analyticsPage(event.page_url, event.metadata).identity);
        if (isSemanticCta(event)) metric.cta.add(sessionId);
        if (isBookingStart(event)) metric.bookingStarts.add(sessionId);
        if (isClientConversion(event)) metric.clientConversions.add(sessionId);
      }
    }
    for (const row of firstRaw) {
      const metric = ensurePage(analyticsPage(row.page_url, { site_host: row.site_host }).identity);
      if (!metric.firstAt || row.created_at < metric.firstAt) metric.firstAt = row.created_at;
    }

    const pageSources: PageSource[] = [
      ...STATIC_PAGE_REGISTRY,
      ...cmsPages.map(page => {
        const isB2b = isB2bCmsPage(page);
        return ({
        host: isB2b ? 'aeroanaliza.pl' as const : 'wlasniewski.pl' as const,
        path: ['home', 'strona-glowna'].includes(page.slug) ? '/' : isB2b ? b2bPublicPath(page.slug) : `/${page.slug}`, title: page.title, kind: 'cms' as const,
        published: page.is_published, metaTitle: page.meta_title, metaDescription: page.meta_description,
        content: `${page.content || ''} ${page.sections || ''}`, mediaCount: countMedia(page.content_images) + (page.hero_image ? 1 : 0),
        hasCta: /href=|button|rezerw|kontakt/i.test(`${page.content} ${page.sections}`), updatedAt: page.updated_at,
      })}),
      ...blogPosts.map(post => ({
        host: 'wlasniewski.pl' as const, path: `/blog/${post.slug}`, title: post.title, kind: 'blog' as const, published: post.status === 'published',
        metaTitle: post.meta_title, metaDescription: post.meta_description, content: post.content,
        mediaCount: post.featured_image_id ? 1 : 0, hasCta: /href=|rezerw|kontakt/i.test(post.content), updatedAt: post.updated_at, publishedAt: post.published_at,
      })),
      ...portfolios.map(portfolio => ({
        host: 'wlasniewski.pl' as const, path: portfolioPath(portfolio.category, portfolio.slug), title: portfolio.title, kind: 'portfolio' as const, published: portfolio.is_published,
        metaTitle: portfolio.meta_title, metaDescription: portfolio.meta_description, content: portfolio.description || '',
        mediaCount: countMedia(portfolio.media_ids) + (portfolio.cover_image_id ? 1 : 0), hasCta: true, updatedAt: portfolio.updated_at,
      })),
    ];
    const uniqueSources = new Map<string, PageSource>();
    for (const source of pageSources) {
      const path = normalizePath(source.path);
      const identity = `${source.host}:${path}`;
      const existing = uniqueSources.get(identity);
      if (!existing || (existing.kind === 'static' && source.kind !== 'static')) uniqueSources.set(identity, { ...source, path });
    }
    for (const identity of pageAnalytics.keys()) if (!uniqueSources.has(identity)) {
      const separator = identity.indexOf(':'); const host = safeAnalyticsSiteHost(identity.slice(0, separator)) as PageSource['host']; const path = identity.slice(separator + 1);
      uniqueSources.set(identity, { host, path, title: path, kind: 'static', published: null });
    }
    for (const metric of gsc.history) {
      const host = propertyHost(metric.siteUrl) as PageSource['host']; const identity = gscIdentity(metric.siteUrl, metric.page);
      if (!uniqueSources.has(identity) && (host === 'wlasniewski.pl' || host === 'aeroanaliza.pl')) uniqueSources.set(identity, { host, path: metric.page, title: metric.page, kind: 'static', published: null });
    }

    const gscCurrent = aggregateGsc(gsc.current);
    const gscPrevious = aggregateGsc(gsc.previous);
    const gscHistory = aggregateGsc(gsc.history);
    let registryRows: RegistryRow[] = [];
    try { registryRows = await prisma.$queryRaw<RegistryRow[]>(Prisma.sql`SELECT "site_host", "path", "first_published_at", "first_seen_analytics_at", "first_seen_gsc_at" FROM "page_analytics_registry"`); }
    catch { registryRows = []; }
    const registry = new Map(registryRows.map(row => [`${row.site_host}:${normalizePath(row.path)}`, row]));
    const baseline = new Map<string, { current: Set<string>; previous: Set<string> }>();
    for (const event of baselineRaw) {
      if (event.event_type !== 'v2_page_view') continue;
      const identity = analyticsPage(event.page_url, parseMetadata(event.metadata)).identity;
      const row = baseline.get(identity) || { current: new Set<string>(), previous: new Set<string>() };
      (event.created_at >= baselineCurrentStart ? row.current : row.previous).add(event.session_id);
      baseline.set(identity, row);
    }
    const historyCurrentStart = baselineCurrentStart.toISOString().slice(0, 10);
    const historyPreviousStart = baselinePreviousStart.toISOString().slice(0, 10);
    const gscBaseline = new Map<string, { currentImpressions: number; previousImpressions: number; currentClicks: number; previousClicks: number }>();
    for (const metric of gsc.history) {
      if (metric.date < historyPreviousStart) continue;
      const identity = gscIdentity(metric.siteUrl, metric.page);
      const row = gscBaseline.get(identity) || { currentImpressions: 0, previousImpressions: 0, currentClicks: 0, previousClicks: 0 };
      if (metric.date >= historyCurrentStart) { row.currentImpressions += metric.impressions; row.currentClicks += metric.clicks; }
      else { row.previousImpressions += metric.impressions; row.previousClicks += metric.clicks; }
      gscBaseline.set(identity, row);
    }
    const pageRows = Array.from(uniqueSources.values()).map(source => {
      const identity = `${source.host}:${source.path}`;
      const stored = registry.get(identity);
      const analytics = pageAnalytics.get(identity);
      const google = gscCurrent.get(identity);
      const googlePrevious = gscPrevious.get(identity);
      const googleHistory = gscHistory.get(identity);
      const analyticsBaseline = baseline.get(identity) || { current: new Set<string>(), previous: new Set<string>() };
      const googleBaseline = gscBaseline.get(identity) || { currentImpressions: 0, previousImpressions: 0, currentClicks: 0, previousClicks: 0 };
      const gscDaily = new Map<string, { clicks: number; impressions: number }>();
      for (const metric of gsc.current.filter(item => gscIdentity(item.siteUrl, item.page) === identity)) {
        const row = gscDaily.get(metric.date) || { clicks: 0, impressions: 0 };
        row.clicks += metric.clicks; row.impressions += metric.impressions; gscDaily.set(metric.date, row);
      }
      const sessions28Pct = pct(analyticsBaseline.current.size, analyticsBaseline.previous.size);
      const impressions28Pct = pct(googleBaseline.currentImpressions, googleBaseline.previousImpressions);
      const growth = growthSignal({ currentSessions: analyticsBaseline.current.size, previousSessions: analyticsBaseline.previous.size, currentImpressions: googleBaseline.currentImpressions, previousImpressions: googleBaseline.previousImpressions });
      const development = evaluatePageCompleteness(source, {
        analyticsObserved: Boolean(analytics?.sessions.size), gscObserved: Boolean(google?.impressions),
        firstAnalyticsAt: stored?.first_seen_analytics_at && (!analytics?.firstAt || stored.first_seen_analytics_at < analytics.firstAt) ? stored.first_seen_analytics_at : analytics?.firstAt,
        firstGscAt: stored?.first_seen_gsc_at && (!googleHistory?.firstDate || stored.first_seen_gsc_at.toISOString().slice(0, 10) < googleHistory.firstDate) ? stored.first_seen_gsc_at.toISOString().slice(0, 10) : googleHistory?.firstDate,
        trendPositive: growth.growing,
      });
      return {
        host: source.host, path: source.path, title: source.title, kind: source.kind, isPublished: source.published, updatedAt: source.updatedAt?.toISOString() || null,
        publicationRecord: stored?.first_published_at || source.publishedAt
          ? { publishedAt: (stored?.first_published_at || source.publishedAt)!.toISOString(), status: 'recorded', note: stored?.first_published_at ? 'Trwała data pierwszej publikacji z rejestru V3.' : 'Kanoniczna data publikacji BlogPost (oczekuje na synchronizację rejestru).' }
          : { publishedAt: null, status: 'unavailable', note: 'Brak rejestru daty publikacji dla treści sprzed V3; updatedAt oznacza wyłącznie ostatnią zmianę.' },
        firstSeenAnalyticsAt: stored?.first_seen_analytics_at?.toISOString() || analytics?.firstAt?.toISOString() || null,
        firstSeenGscAt: stored?.first_seen_gsc_at?.toISOString() || (googleHistory?.firstDate ? `${googleHistory.firstDate}T00:00:00.000Z` : null),
        ...development,
        impact: {
          sessions: analytics?.sessions.size || 0, landingSessions: analytics?.landing.size || 0,
          assistedBookingStarts: analytics?.assisted.size || 0, ctaSessions: analytics?.cta.size || 0,
          bookingStartSessions: analytics?.bookingStarts.size || 0, clientEventConversions: analytics?.clientConversions.size || 0,
          canonicalBookings: null,
          attributionNote: 'Kanoniczne rezerwacje/płatności nie mają session_id ani landing_page, więc nie są przypisywane do podstrony.',
          gsc: {
            clicks: google?.clicks || 0, impressions: google?.impressions || 0,
            ctr: google?.impressions ? google.clicks / google.impressions : 0,
            position: google?.impressions ? google.positionTotal / google.impressions : null,
            clicksPct: gsc.comparisonStatus === 'ready' ? pct(google?.clicks || 0, googlePrevious?.clicks || 0) : null,
            impressionsPct: gsc.comparisonStatus === 'ready' ? pct(google?.impressions || 0, googlePrevious?.impressions || 0) : null,
          },
          baseline28: {
            sampleStatus: growth.confidence, growthConfidence: growth.confidence,
            note: growth.confidence === 'small_sample' ? 'Za mała próba: potrzeba łącznie 10 sesji Analytics lub 20 wyświetleń GSC.' : 'Analytics i GSC mają niezależne progi oceny trendu.',
            sessions: analyticsBaseline.current.size, previousSessions: analyticsBaseline.previous.size, sessionsPct: sessions28Pct,
            impressions: googleBaseline.currentImpressions, previousImpressions: googleBaseline.previousImpressions, impressionsPct: impressions28Pct,
            clicks: googleBaseline.currentClicks, previousClicks: googleBaseline.previousClicks, clicksPct: pct(googleBaseline.currentClicks, googleBaseline.previousClicks),
          },
          trend: Array.from(new Set([...(analytics?.daily.keys() || []), ...gscDaily.keys()])).sort().map(date => ({
            date, sessions: analytics?.daily.get(date)?.size || 0,
            clicks: gscDaily.get(date)?.clicks || 0, impressions: gscDaily.get(date)?.impressions || 0,
          })),
        },
      };
    }).sort((a, b) => b.impact.gsc.impressions - a.impact.gsc.impressions || b.impact.sessions - a.impact.sessions || a.path.localeCompare(b.path));

    try {
      if (pageRows.length) await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "page_analytics_registry" (
        "site_host", "path", "first_seen_analytics_at", "first_seen_gsc_at", "created_at", "updated_at"
      ) VALUES ${Prisma.join(pageRows.map(page => Prisma.sql`(
        ${page.host}, ${page.path}, ${page.firstSeenAnalyticsAt ? new Date(page.firstSeenAnalyticsAt) : null},
        ${page.firstSeenGscAt ? new Date(page.firstSeenGscAt) : null}, NOW(), NOW()
      )`))}
      ON CONFLICT ("site_host", "path") DO UPDATE SET
        "first_seen_analytics_at" = CASE
          WHEN EXCLUDED."first_seen_analytics_at" IS NULL THEN "page_analytics_registry"."first_seen_analytics_at"
          WHEN "page_analytics_registry"."first_seen_analytics_at" IS NULL THEN EXCLUDED."first_seen_analytics_at"
          ELSE LEAST("page_analytics_registry"."first_seen_analytics_at", EXCLUDED."first_seen_analytics_at") END,
        "first_seen_gsc_at" = CASE
          WHEN EXCLUDED."first_seen_gsc_at" IS NULL THEN "page_analytics_registry"."first_seen_gsc_at"
          WHEN "page_analytics_registry"."first_seen_gsc_at" IS NULL THEN EXCLUDED."first_seen_gsc_at"
          ELSE LEAST("page_analytics_registry"."first_seen_gsc_at", EXCLUDED."first_seen_gsc_at") END,
        "updated_at" = NOW()
      `);
    } catch (registryError) {
      console.warn('[Analytics V3 registry unavailable]', registryError instanceof Error ? registryError.message : 'unknown');
    }

    const totalGsc = (rows: GscMetric[]) => rows.reduce((sum, row) => sum + row.impressions, 0);
    const allSearchQueries = buildGscQueryReport(gsc.queryCurrent, gsc.queryPrevious);
    const priorityQuery = (row: typeof allSearchQueries[number]) => row.host === 'wlasniewski.pl' && row.query.toLocaleLowerCase('pl-PL') === 'fotograf toruń';
    const searchQueries = [...allSearchQueries.filter(priorityQuery), ...allSearchQueries.filter(row => !priorityQuery(row))].slice(0, 500);
    const actions: DirectorAction[] = [];
    for (const diagnostic of diagnostics.actions) {
      const priority = diagnostic.kind === 'error' ? 140 : diagnostic.kind === 'availability' ? 130 : diagnostic.kind === 'dropoff' ? 120 : diagnostic.kind === 'performance' ? 115 : diagnostic.kind === 'hypothesis' ? 105 : 90;
      actions.push({ priority, kind: `diagnostic_${diagnostic.kind}`, title: diagnostic.title, evidence: `${diagnostic.evidence} Pewność: ${diagnostic.confidence}.`, recommendation: diagnostic.recommendation });
    }
    if (gsc.status !== 'connected') actions.push({ priority: 110, kind: 'source', title: 'Podłącz Google Search Console', evidence: gsc.message, recommendation: 'Uzupełnij zmienne Netlify i dodaj service account jako użytkownika obu usług GSC.' });
    if (events.length === 0) actions.push({ priority: 125, kind: 'tracking', title: 'Brak danych własnej analityki', evidence: 'Nie przyjęto żadnego zdarzenia V2 w wybranym okresie.', recommendation: 'Sprawdź tracker, zgodę analityczną i endpoint ingest na produkcji.' });
    const visibleWithoutClicks = pageRows.find(page => page.impact.gsc.impressions >= 20 && page.impact.gsc.clicks === 0);
    if (visibleWithoutClicks) actions.push({ priority: 80, kind: 'ctr', title: `Widoczność bez kliknięć: ${visibleWithoutClicks.path}`, evidence: `${visibleWithoutClicks.impact.gsc.impressions} wyświetleń i 0 kliknięć.`, recommendation: 'Popraw title i description zgodnie z intencją zapytania; oceń wynik po 28 dniach.' });
    const torunQuerySignal = searchQueries.find(row => row.host === 'wlasniewski.pl' && row.query.toLocaleLowerCase('pl-PL') === 'fotograf toruń' && row.multiplePagesSignal);
    if (torunQuerySignal) actions.push({ priority: 95, kind: 'query_overlap', title: 'Sprawdź rozdzielenie frazy „fotograf Toruń”', evidence: `To samo zapytanie wyświetla ${torunQuerySignal.competingPages.length} URL-e: ${torunQuerySignal.competingPages.join(', ')}. To sygnał, nie automatyczny dowód kanibalizacji.`, recommendation: 'Porównaj kliknięcia, wyświetlenia, CTR i pozycję URL-i; zmieniaj tylko jeden title w kontrolowanym teście 28/28.' });
    const importantIncomplete = pageRows.find(page => page.completeness < 70 && (page.impact.sessions > 0 || page.impact.gsc.impressions > 0));
    if (importantIncomplete) actions.push({ priority: 70, kind: 'completeness', title: `Dokończ ${importantIncomplete.path}`, evidence: `Kompletność ${importantIncomplete.completeness}%. ${importantIncomplete.blockers.slice(0, 2).join('; ')}`, recommendation: 'Usuń wskazane blokery strony, zaczynając od publikacji, meta i CTA.' });
    if (shouldCreateZeroBookingAction(sessionIds.size, bookingStartSessions)) actions.push({ priority: 60, kind: 'funnel', title: 'Ruch nie rozpoczyna rezerwacji', evidence: `${sessionIds.size} sesji i 0 startów rezerwacji.`, recommendation: 'Sprawdź CTA na najczęstszych landing pages i ręcznie przetestuj rezerwację mobile.' });
    const missingPublicationDate = pageRows.find(page => page.isPublished === true && page.publicationRecord.publishedAt === null);
    if (missingPublicationDate) actions.push({ priority: 10, kind: 'publication_history', title: `Uzupełnij historyczną datę publikacji: ${missingPublicationDate.path}`, evidence: 'Strona była opublikowana przed uruchomieniem trwałego rejestru V3, dlatego data pozostaje nieznana.', recommendation: 'Uzupełnij datę tylko na podstawie wiarygodnego źródła; nie używaj updatedAt jako daty publikacji.' });

    return NextResponse.json({
      success: true, version: 3, generatedAt: now.toISOString(), timezone: 'Europe/Warsaw',
      range: { start: start.toISOString(), end: end.toISOString(), previousStart: previousStart.toISOString(), previousEnd: previousEnd.toISOString() },
      sources: {
        analytics: { status: events.length ? 'connected' : 'no_data', events: events.length, lastEventAt: events.at(-1)?.created_at.toISOString() || null, unknownHostSessions: unknownHostSessions.size, hostNote: 'Starsze zdarzenia bez serwerowego site_host pozostają unknown i nie są przypisywane do domeny.' },
        gsc: { status: gsc.status, comparisonStatus: gsc.comparisonStatus, checkedAt: gsc.checkedAt, latestCompleteDate: gsc.latestCompleteDate, incompleteDays: gsc.incompleteDays, sites: gsc.sites, message: gsc.message },
        finance: { status: 'connected_unattributed', canonicalBookings: canonicalBookings.length, note: 'Suma kanoniczna jest wiarygodna, ale bezpieczne przypisanie do podstrony nie jest obecnie możliwe.' },
      },
      overview: {
        users: userIds.size, sessions: sessionIds.size, pageViews, engagedSessions, ctaSessions,
        bookingStartSessions, clientEventConversions: conversionSessions,
        canonicalBookings: canonicalBookings.length, canonicalBookingValue: canonicalBookings.reduce((sum, item) => sum + (item.price || 0), 0) / 100,
        gscImpressions: totalGsc(gsc.current), gscClicks: gsc.current.reduce((sum, row) => sum + row.clicks, 0),
        dataStatus: trafficSampleStatus(sessionIds.size),
        dataStatusNote: trafficSampleStatus(sessionIds.size) === 'small_sample' ? 'Za mała próba do oceny konwersji: potrzeba co najmniej 10 sesji.' : trafficSampleStatus(sessionIds.size) === 'no_data' ? 'Brak sesji w wybranym okresie.' : 'Próba wystarczająca do podstawowej oceny lejka.',
        comparison: { usersPct: pct(userIds.size, previousUsers), sessionsPct: pct(sessionIds.size, previousSessions), pageViewsPct: pct(pageViews, previousPageViews), gscImpressionsPct: gsc.comparisonStatus === 'ready' ? pct(totalGsc(gsc.current), totalGsc(gsc.previous)) : null },
      },
      funnel: [
        { key: 'sessions', label: 'Sesje', value: sessionIds.size },
        { key: 'engaged', label: 'Zaangażowane', value: engagedSessions },
        { key: 'cta', label: 'Kliknięcia CTA', value: ctaSessions },
        { key: 'booking_start', label: 'Start rezerwacji', value: bookingStartSessions },
        { key: 'client_conversion', label: 'Konwersje klienta', value: conversionSessions, note: 'Sygnał zdarzeniowy; nie zastępuje danych kanonicznych.' },
        { key: 'canonical', label: 'Rezerwacje kanoniczne', value: canonicalBookings.length, note: 'Bez przypisania do sesji/podstrony.' },
      ],
      actions: prioritizeDirectorActions(actions),
      diagnostics,
      trafficSources: Array.from(sourceMap, ([source, ids]) => ({ source, sessions: ids.size })).sort((a, b) => b.sessions - a.sessions),
      ingest: ingestRaw.map(row => ({ reason: row.reason_code, outcome: row.outcome, batches: Number(row.batch_count), events: Number(row.event_count) })),
      searchQueries,
      querySummary: {
        rows: searchQueries.length,
        totalRows: allSearchQueries.length,
        truncated: allSearchQueries.length > searchQueries.length,
        multiplePagesSignals: new Set(allSearchQueries.filter(row => row.multiplePagesSignal).map(row => `${row.host}\u0000${row.query.toLocaleLowerCase('pl-PL')}`)).size,
        note: allSearchQueries.length > searchQueries.length
          ? 'Wiele URL-i dla jednego zapytania jest sygnałem do analizy, a nie automatycznym dowodem kanibalizacji. Raport zawiera 500 priorytetowych wierszy; brak wyniku filtra nie dowodzi braku zapytania w GSC.'
          : `Wiele URL-i dla jednego zapytania jest sygnałem do analizy, a nie automatycznym dowodem kanibalizacji. Raport zawiera wszystkie dostępne wiersze (${allSearchQueries.length}).`,
      },
      pages: pageRows,
      recentSessions: Array.from(sessions.entries()).slice(-50).reverse().map(([sessionId, items]) => ({
        sessionId, startedAt: items[0]?.created_at, landingPage: normalizePath(items.find(event => event.event_type === 'v2_page_view')?.page_url),
        siteHost: safeAnalyticsSiteHost(items.find(event => event.event_type === 'v2_page_view')?.metadata.site_host),
        pageViews: items.filter(event => event.event_type === 'v2_page_view').length,
        bookingStarted: items.some(isBookingStart), clientConversion: items.some(isClientConversion),
        path: items.filter(event => ['v2_page_view', 'v2_click', 'v2_booking_start', 'v2_booking_form_started', 'v2_booking_created', 'v2_payment_success', 'v2_drone_booking_started', 'v2_drone_booking_submitted'].includes(event.event_type)).map(event => ({ at: event.created_at, event: event.event_type.replace(/^v2_/, ''), page: normalizePath(event.page_url) })).slice(0, 80),
      })),
      dataQuality: { syntheticValues: false, unavailableSources: Array.from(new Set(unavailableSources)), privacy: 'Zapytania GSC są dostępne wyłącznie w chronionym panelu administratora; Google może pomijać rzadkie zapytania.', gscFreshness: gsc.message },
    });
  } catch (error) {
    console.error('[Analytics V3 dashboard]', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ success: false, message: 'Nie udało się pobrać Analityki V3.' }, { status: 500 });
  }
}
