import type { GscQueryMetric } from './gscCore';

export type GscQueryReportRow = {
  host: string;
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number | null;
  previousClicks: number;
  previousImpressions: number;
  clicksPct: number | null;
  impressionsPct: number | null;
  competingPages: string[];
  multiplePagesSignal: boolean;
};

function pct(current: number, previous: number) {
  return previous === 0 ? (current === 0 ? 0 : null) : Math.round(((current - previous) / previous) * 1000) / 10;
}

function siteHost(siteUrl: string) {
  if (siteUrl.startsWith('sc-domain:')) return siteUrl.slice('sc-domain:'.length).replace(/^www\./, '');
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function aggregate(rows: GscQueryMetric[]) {
  const map = new Map<string, {
    host: string; query: string; page: string; clicks: number; impressions: number; positionTotal: number;
  }>();
  for (const row of rows) {
    const host = siteHost(row.siteUrl);
    if (!host) continue;
    const key = `${host}\u0000${row.query.toLocaleLowerCase('pl-PL')}\u0000${row.page}`;
    const value = map.get(key) || { host, query: row.query, page: row.page, clicks: 0, impressions: 0, positionTotal: 0 };
    value.clicks += row.clicks;
    value.impressions += row.impressions;
    value.positionTotal += row.position * row.impressions;
    map.set(key, value);
  }
  return map;
}

export function buildGscQueryReport(current: GscQueryMetric[], previous: GscQueryMetric[], limit = Number.POSITIVE_INFINITY): GscQueryReportRow[] {
  const currentMap = aggregate(current);
  const previousMap = aggregate(previous);
  const pagesByQuery = new Map<string, Set<string>>();
  for (const value of currentMap.values()) {
    if (value.impressions <= 0) continue;
    const key = `${value.host}\u0000${value.query.toLocaleLowerCase('pl-PL')}`;
    const pages = pagesByQuery.get(key) || new Set<string>();
    pages.add(value.page);
    pagesByQuery.set(key, pages);
  }

  return Array.from(currentMap.entries(), ([key, value]) => {
    const previousValue = previousMap.get(key);
    const queryKey = `${value.host}\u0000${value.query.toLocaleLowerCase('pl-PL')}`;
    const competingPages = Array.from(pagesByQuery.get(queryKey) || []).sort();
    return {
      host: value.host,
      query: value.query,
      page: value.page,
      clicks: value.clicks,
      impressions: value.impressions,
      ctr: value.impressions ? value.clicks / value.impressions : 0,
      position: value.impressions ? value.positionTotal / value.impressions : null,
      previousClicks: previousValue?.clicks || 0,
      previousImpressions: previousValue?.impressions || 0,
      clicksPct: pct(value.clicks, previousValue?.clicks || 0),
      impressionsPct: pct(value.impressions, previousValue?.impressions || 0),
      competingPages,
      multiplePagesSignal: competingPages.length > 1,
    };
  }).sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks || a.query.localeCompare(b.query, 'pl-PL')).slice(0, limit);
}
