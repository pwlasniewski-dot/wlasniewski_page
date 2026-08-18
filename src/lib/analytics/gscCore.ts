const ALLOWED_HOSTS = new Set(['wlasniewski.pl', 'aeroanaliza.pl']);

export type GscMetric = {
  siteUrl: string; page: string; date: string; clicks: number; impressions: number; ctr: number; position: number;
};

export type GscQueryMetric = {
  siteUrl: string; query: string; page: string; clicks: number; impressions: number; ctr: number; position: number;
};

function safeSiteUrl(raw: string): string | null {
  const value = raw.trim();
  if (value.startsWith('sc-domain:')) {
    const host = value.slice('sc-domain:'.length).toLowerCase();
    return ALLOWED_HOSTS.has(host) ? `sc-domain:${host}` : null;
  }
  try {
    const parsed = new URL(value); const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    return parsed.protocol === 'https:' && ALLOWED_HOSTS.has(host) ? value : null;
  } catch { return null; }
}

export function configuredGscSites(env: NodeJS.ProcessEnv = process.env): string[] {
  return Array.from(new Set([
    env.GSC_SITE_URL_WLASNIEWSKI || 'sc-domain:wlasniewski.pl',
    env.GSC_SITE_URL_AEROANALIZA || 'sc-domain:aeroanaliza.pl',
  ].map(safeSiteUrl).filter((value): value is string => Boolean(value))));
}

export function dateOnly(date: Date) { return date.toISOString().slice(0, 10); }
export function latestCompleteGscDate(now = new Date(), lagDays = 2) { return dateOnly(new Date(now.getTime() - lagDays * 86_400_000)); }

export function propertyHost(siteUrl: string) {
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.slice('sc-domain:'.length).replace(/^www\./, '').toLowerCase();
  try { return new URL(siteUrl).hostname.replace(/^www\./, '').toLowerCase(); } catch { return '' }
}

export function gscInclusiveRange(start: Date, endExclusive: Date, latestCompleteDate: string) {
  const startDate = dateOnly(start);
  const requestedLast = dateOnly(new Date(endExclusive.getTime() - 1));
  const endDate = requestedLast < latestCompleteDate ? requestedLast : latestCompleteDate;
  return startDate <= endDate ? { startDate, endDate } : null;
}

export function gscIdentity(siteUrl: string, page: string) {
  return `${propertyHost(siteUrl)}:${page || '/'}`;
}

export function gscComparisonRanges(currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date, latestCompleteDate: string) {
  const current = gscInclusiveRange(currentStart, currentEnd, latestCompleteDate);
  return { current, previous: current ? gscInclusiveRange(previousStart, previousEnd, latestCompleteDate) : null, status: current ? 'ready' as const : 'waiting_for_complete_data' as const };
}

export function gscCalendarComparisonRanges(current: { startDate: string; endDate: string }, previous: { startDate: string; endDate: string }, latestCompleteDate: string) {
  const currentRange = current.startDate <= latestCompleteDate
    ? { startDate: current.startDate, endDate: current.endDate < latestCompleteDate ? current.endDate : latestCompleteDate }
    : null;
  return { current: currentRange, previous: currentRange ? previous : null, status: currentRange ? 'ready' as const : 'waiting_for_complete_data' as const };
}

export function normalizeGscRows(siteUrl: string, rows: any[] | undefined): GscMetric[] {
  return (rows || []).flatMap(row => {
    const [pageKey, dateKey] = Array.isArray(row.keys) ? row.keys : [];
    if (typeof pageKey !== 'string' || typeof dateKey !== 'string') return [];
    let page = '/'; try { page = new URL(pageKey).pathname || '/'; } catch { return []; }
    if (page !== '/') page = page.replace(/\/+$/, '');
    return [{ siteUrl, page, date: dateKey, clicks: Number(row.clicks || 0), impressions: Number(row.impressions || 0), ctr: Number(row.ctr || 0), position: Number(row.position || 0) }];
  });
}

export function normalizeGscQueryRows(siteUrl: string, rows: any[] | undefined): GscQueryMetric[] {
  return (rows || []).flatMap(row => {
    const [queryKey, pageKey] = Array.isArray(row.keys) ? row.keys : [];
    if (typeof queryKey !== 'string' || !queryKey.trim() || typeof pageKey !== 'string') return [];
    let page = '/'; try { page = new URL(pageKey).pathname || '/'; } catch { return []; }
    if (page !== '/') page = page.replace(/\/+$/, '');
    return [{
      siteUrl,
      query: queryKey.trim(),
      page,
      clicks: Number(row.clicks || 0),
      impressions: Number(row.impressions || 0),
      ctr: Number(row.ctr || 0),
      position: Number(row.position || 0),
    }];
  });
}
