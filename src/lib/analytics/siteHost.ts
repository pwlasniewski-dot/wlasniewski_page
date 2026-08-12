export type AnalyticsSiteHost = 'wlasniewski.pl' | 'aeroanaliza.pl' | 'unknown';
const ALLOWED = new Set<AnalyticsSiteHost>(['wlasniewski.pl', 'aeroanaliza.pl']);

export function safeAnalyticsSiteHost(value: unknown): AnalyticsSiteHost {
  if (typeof value !== 'string') return 'unknown';
  const host = value.trim().toLowerCase().replace(/^www\./, '').split(':')[0];
  return ALLOWED.has(host as AnalyticsSiteHost) ? host as AnalyticsSiteHost : 'unknown';
}

export function trustedSiteHostFromOrigin(origin: string | null): AnalyticsSiteHost {
  if (!origin) return 'unknown';
  try { return safeAnalyticsSiteHost(new URL(origin).hostname); } catch { return 'unknown'; }
}
