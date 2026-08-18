import 'server-only';

import { google } from 'googleapis';
import { configuredGscSites, gscCalendarComparisonRanges, gscComparisonRanges, gscInclusiveRange, latestCompleteGscDate, normalizeGscQueryRows, normalizeGscRows, type GscMetric, type GscQueryMetric } from './gscCore';
export { configuredGscSites, gscIdentity, gscInclusiveRange, latestCompleteGscDate, normalizeGscQueryRows, normalizeGscRows, propertyHost } from './gscCore';
export type { GscMetric, GscQueryMetric } from './gscCore';

const DEFAULT_TIMEOUT_MS = 8_000;
export type GscResult = {
  status: 'connected' | 'partial' | 'not_configured' | 'error';
  comparisonStatus: 'ready' | 'waiting_for_complete_data';
  checkedAt: string;
  latestCompleteDate: string;
  incompleteDays: number;
  sites: Array<{ siteUrl: string; status: 'connected' | 'error'; error?: string; truncated?: boolean; queryReport: 'connected' | 'partial' | 'error'; queryError?: string }>;
  current: GscMetric[];
  previous: GscMetric[];
  history: GscMetric[];
  queryCurrent: GscQueryMetric[];
  queryPrevious: GscQueryMetric[];
  message: string;
};

const historyCache = new Map<string, { expiresAt: number; rows: GscMetric[]; truncated: boolean }>();

// Keep production diagnostics useful without ever serializing request config, JWTs or keys.
// Google API errors carry the actionable HTTP status and a short reason in these fields.
function gscErrorDiagnostic(error: unknown) {
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    response?: { status?: unknown; data?: { error?: { code?: unknown; message?: unknown; status?: unknown; errors?: Array<{ reason?: unknown }> } } };
  };
  const apiError = candidate.response?.data?.error;
  const message = apiError?.message ?? candidate.message;
  const reason = apiError?.errors?.[0]?.reason ?? apiError?.status;
  return {
    status: Number(apiError?.code ?? candidate.response?.status ?? candidate.code ?? 0) || null,
    reason: typeof reason === 'string' ? reason.slice(0, 160) : null,
    message: typeof message === 'string' ? message.slice(0, 500) : 'unknown Google Search Console error',
  };
}

export async function checkGscConnection(env: NodeJS.ProcessEnv = process.env) {
  const email = env.GSC_SERVICE_ACCOUNT_EMAIL;
  const key = env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !key) return { status: 'not_configured' as const, sites: [] as string[] };
  try {
    const auth = new google.auth.JWT({ email, key, scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });
    const response = await google.searchconsole({ version: 'v1', auth }).sites.list({}, { timeout: 5_000 });
    const configured = new Set(configuredGscSites(env));
    const sites = (response.data.siteEntry || []).map(entry => entry.siteUrl || '').filter(site => configured.has(site));
    return { status: sites.length === configured.size ? 'connected' as const : sites.length ? 'partial' as const : 'error' as const, sites };
  } catch (error) {
    console.warn('[Analytics GSC] connection check failed', gscErrorDiagnostic(error));
    return { status: 'error' as const, sites: [] as string[] };
  }
}

function publicError(error: unknown) {
  const status = Number((error as any)?.code || (error as any)?.response?.status || 0);
  if (status === 403) return 'Brak uprawnienia service account do tej usługi GSC.';
  if (status === 404) return 'Usługa GSC nie istnieje albo nie jest zweryfikowana.';
  if (status === 429) return 'Limit zapytań GSC został chwilowo przekroczony.';
  return 'Nie udało się odczytać danych GSC.';
}

export async function fetchGscComparison(input: {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  now?: Date;
  env?: NodeJS.ProcessEnv;
  calendarRanges?: { current: { startDate: string; endDate: string }; previous: { startDate: string; endDate: string } };
}): Promise<GscResult> {
  const env = input.env || process.env;
  const checkedAt = (input.now || new Date()).toISOString();
  const latestCompleteDate = latestCompleteGscDate(input.now);
  const email = env.GSC_SERVICE_ACCOUNT_EMAIL;
  const privateKey = env.GSC_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!email || !privateKey) {
    return {
      status: 'not_configured', comparisonStatus: 'waiting_for_complete_data', checkedAt, latestCompleteDate, incompleteDays: 2,
      sites: [], current: [], previous: [], history: [], queryCurrent: [], queryPrevious: [],
      message: 'Dodaj dane service account i udostępnij mu usługi w Google Search Console.',
    };
  }

  const sites = configuredGscSites(env);
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const searchConsole = google.searchconsole({ version: 'v1', auth });
  const timeout = Math.max(1_000, Math.min(20_000, Number(env.GSC_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)));
  const current: GscMetric[] = [];
  const previous: GscMetric[] = [];
  const history: GscMetric[] = [];
  const queryCurrent: GscQueryMetric[] = [];
  const queryPrevious: GscQueryMetric[] = [];
  const statuses: GscResult['sites'] = [];
  const comparison = input.calendarRanges
    ? gscCalendarComparisonRanges(input.calendarRanges.current, input.calendarRanges.previous, latestCompleteDate)
    : gscComparisonRanges(input.start, input.end, input.previousStart, input.previousEnd, latestCompleteDate);
  const currentRange = comparison.current;
  const comparisonStatus: GscResult['comparisonStatus'] = comparison.status;

  await Promise.all(sites.map(async siteUrl => {
    try {
      const query = async (range: { startDate: string; endDate: string } | null) => {
        if (!range) return { rows: [] as GscMetric[], truncated: false };
        const rows: GscMetric[] = []; const rowLimit = 25_000; const maxRows = 100_000;
        for (let startRow = 0; startRow < maxRows; startRow += rowLimit) {
          const response = await searchConsole.searchanalytics.query({ siteUrl, requestBody: {
            startDate: range.startDate, endDate: range.endDate, dimensions: ['page', 'date'], rowLimit, startRow, dataState: 'final',
          } }, { timeout });
          const page = normalizeGscRows(siteUrl, response.data.rows); rows.push(...page);
          if (page.length < rowLimit) return { rows, truncated: false };
        }
        return { rows, truncated: true };
      };
      const queryBySearchTerm = async (range: { startDate: string; endDate: string } | null) => {
        if (!range) return { rows: [] as GscQueryMetric[], truncated: false };
        const rows: GscQueryMetric[] = []; const rowLimit = 25_000; const maxRows = 100_000;
        for (let startRow = 0; startRow < maxRows; startRow += rowLimit) {
          const response = await searchConsole.searchanalytics.query({ siteUrl, requestBody: {
            startDate: range.startDate, endDate: range.endDate, dimensions: ['query', 'page'], rowLimit, startRow, dataState: 'final',
          } }, { timeout });
          const page = normalizeGscQueryRows(siteUrl, response.data.rows); rows.push(...page);
          if (page.length < rowLimit) return { rows, truncated: false };
        }
        return { rows, truncated: true };
      };
      const historyStart = new Date((input.now || new Date()).getTime() - 16 * 31 * 86_400_000);
      const cacheKey = `${siteUrl}:${latestCompleteDate}`;
      const cached = historyCache.get(cacheKey);
      const historyPromise = cached && cached.expiresAt > Date.now()
        ? Promise.resolve({ rows: cached.rows, truncated: cached.truncated })
        : query(gscInclusiveRange(historyStart, input.now || new Date(), latestCompleteDate)).then(result => {
          historyCache.set(cacheKey, { expiresAt: Date.now() + 86_400_000, ...result }); return result;
        });
      const [currentResult, previousResult, historyResult] = await Promise.all([
        query(currentRange),
        query(comparison.previous),
        historyPromise,
      ]);
      current.push(...currentResult.rows); previous.push(...previousResult.rows); history.push(...historyResult.rows);
      const [queryCurrentResult, queryPreviousResult] = await Promise.allSettled([
        queryBySearchTerm(currentRange),
        queryBySearchTerm(comparison.previous),
      ]);
      if (queryCurrentResult.status === 'fulfilled') queryCurrent.push(...queryCurrentResult.value.rows);
      if (queryPreviousResult.status === 'fulfilled') queryPrevious.push(...queryPreviousResult.value.rows);
      const queryFailures = [queryCurrentResult, queryPreviousResult].filter(result => result.status === 'rejected');
      if (queryFailures.length) console.warn('[Analytics GSC] query report failed', { siteUrl, failures: queryFailures.length });
      statuses.push({
        siteUrl,
        status: 'connected',
        truncated: currentResult.truncated || previousResult.truncated || historyResult.truncated
          || (queryCurrentResult.status === 'fulfilled' && queryCurrentResult.value.truncated)
          || (queryPreviousResult.status === 'fulfilled' && queryPreviousResult.value.truncated),
        queryReport: queryFailures.length === 0 ? 'connected' : queryFailures.length === 1 ? 'partial' : 'error',
        queryError: queryFailures.length ? 'Raport zapytań GSC jest chwilowo niepełny; podstawowe metryki stron pozostają dostępne.' : undefined,
      });
    } catch (error) {
      console.warn('[Analytics GSC] query failed', { siteUrl, ...gscErrorDiagnostic(error) });
      statuses.push({ siteUrl, status: 'error', error: publicError(error), queryReport: 'error' });
    }
  }));

  const connectedCount = statuses.filter(site => site.status === 'connected').length;
  const connected = connectedCount > 0;
  return {
    status: !connected ? 'error' : connectedCount === statuses.length ? 'connected' : 'partial', comparisonStatus,
    checkedAt, latestCompleteDate, incompleteDays: 2,
    sites: statuses, current, previous, history, queryCurrent, queryPrevious,
    message: connected
      ? 'Dane kończą się na ostatnim kompletnym dniu GSC; najnowsze dni mogą jeszcze ulec zmianie.'
      : 'Poświadczenia istnieją, ale żadna dozwolona usługa GSC nie odpowiedziała.',
  };
}
