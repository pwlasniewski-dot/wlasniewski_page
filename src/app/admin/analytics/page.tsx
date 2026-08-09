'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, BarChart3, CalendarDays, ChevronDown, ChevronRight, Clock3,
  Eye, Filter, MousePointerClick, RefreshCcw, Search, ShoppingCart,
  TrendingUp, Users, WalletCards
} from 'lucide-react';

type Granularity = 'hour' | 'day' | 'week';
type Metric = 'sessions' | 'users' | 'pageViews' | 'activeMinutes' | 'bookingStarts';

type AnalyticsData = {
  success: boolean;
  version: number;
  timezone: string;
  range: { start: string; end: string; granularity: Granularity };
  dataQuality: {
    deterministic: boolean;
    legacyEventsExcluded: boolean;
    syntheticValues: boolean;
    sessionTimeoutMinutes: number;
    note: string;
  };
  summary: {
    users: number;
    sessions: number;
    pageViews: number;
    activeMs: number;
    activeMinutes: number;
    avgActiveMsPerSession: number;
    bookingStarts: number;
    bookingCompletes: number;
    bookings: number;
    revenue: number;
    conversionRate: number;
  };
  comparison: Record<string, number | null>;
  timeSeries: Array<{
    bucket: string;
    users: number;
    sessions: number;
    pageViews: number;
    activeMinutes: number;
    bookingStarts: number;
    bookingCompletes: number;
  }>;
  sources: Array<{ source: string; sessions: number }>;
  pages: Array<{ page: string; views: number; sessions: number; activeMinutes: number }>;
  recentSessions: Array<{
    sessionId: string;
    userId: string;
    startedAt: string;
    endedAt: string;
    durationMs: number;
    source: string;
    landingPage: string;
    device: string;
    browser: string;
    pageViews: number;
    activeMinutes: number;
    clicks: number;
    bookingStarted: boolean;
    bookingCompleted: boolean;
    path: Array<{ at: string; event: string; page: string }>;
  }>;
};

const TIME_ZONE = 'Europe/Warsaw';

function isoInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function dateRange(kind: '1h' | 'today' | 'yesterday' | '7d' | '30d') {
  const end = new Date();
  let start = new Date(end);
  let granularity: Granularity = 'hour';

  if (kind === '1h') start = new Date(end.getTime() - 60 * 60 * 1000);
  if (kind === 'today') start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
  if (kind === 'yesterday') {
    const yesterdayStart = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1, 0, 0, 0, 0);
    const yesterdayEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0);
    return { start: yesterdayStart, end: yesterdayEnd, granularity: 'hour' as Granularity };
  }
  if (kind === '7d') {
    start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
    granularity = 'day';
  }
  if (kind === '30d') {
    start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    granularity = 'day';
  }
  return { start, end, granularity };
}

function formatDuration(ms: number) {
  if (!ms || ms < 1000) return '0 s';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function formatMinutes(minutes: number) {
  if (!minutes) return '0 min';
  if (minutes < 1) return `${Math.round(minutes * 60)} s`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pl-PL', {
    timeZone: TIME_ZONE,
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(value));
}

function changeLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return 'nowy';
  if (value === 0) return '0%';
  return `${value > 0 ? '+' : ''}${value}%`;
}

export default function AnalyticsPage() {
  const initial = useMemo(() => dateRange('today'), []);
  const [start, setStart] = useState(isoInput(initial.start));
  const [end, setEnd] = useState(isoInput(initial.end));
  const [granularity, setGranularity] = useState<Granularity>(initial.granularity);
  const [metric, setMetric] = useState<Metric>('sessions');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('admin_token');
      const startDate = new Date(start);
      const endDate = new Date(end);
      const query = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        granularity,
      });
      const response = await fetch(`/api/analytics/v2/dashboard?${query}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: 'no-store',
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Nie udało się pobrać danych');
      setData(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd analityki');
    } finally {
      setLoading(false);
    }
  }, [start, end, granularity]);

  useEffect(() => { void load(); }, [load]);

  const applyPreset = (kind: '1h' | 'today' | 'yesterday' | '7d' | '30d') => {
    const range = dateRange(kind);
    setStart(isoInput(range.start));
    setEnd(isoInput(range.end));
    setGranularity(range.granularity);
  };

  const maxMetric = Math.max(1, ...(data?.timeSeries.map(point => Number(point[metric] || 0)) || [1]));
  const filteredSessions = (data?.recentSessions || []).filter(session => {
    const q = sessionSearch.trim().toLowerCase();
    if (!q) return true;
    return [session.source, session.landingPage, session.device, session.browser, session.sessionId]
      .some(value => String(value || '').toLowerCase().includes(q));
  });

  const cards = data ? [
    { label: 'Użytkownicy', value: data.summary.users, compare: data.comparison.usersPct, icon: Users },
    { label: 'Sesje', value: data.summary.sessions, compare: data.comparison.sessionsPct, icon: Activity },
    { label: 'Odsłony', value: data.summary.pageViews, compare: data.comparison.pageViewsPct, icon: Eye },
    { label: 'Aktywny czas', value: formatMinutes(data.summary.activeMinutes), compare: data.comparison.activeTimePct, icon: Clock3 },
    { label: 'Start rezerwacji', value: data.summary.bookingStarts, compare: null, icon: MousePointerClick },
    { label: 'Rezerwacje', value: data.summary.bookings, compare: data.comparison.bookingsPct, icon: ShoppingCart },
    { label: 'Konwersja', value: `${data.summary.conversionRate}%`, compare: null, icon: TrendingUp },
    { label: 'Przychód', value: `${data.summary.revenue.toLocaleString('pl-PL')} zł`, compare: data.comparison.revenuePct, icon: WalletCards },
  ] : [];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="text-emerald-400" size={26} />
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Analityka 2.0</h1>
            </div>
            <p className="text-sm text-zinc-400">Jednoznaczne dane o ruchu, aktywności i drodze do rezerwacji. Stare rekordy są wykluczone.</p>
          </div>

          <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-sm">
            <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} /> Odśwież
          </button>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              ['1h', 'Ostatnia godzina'], ['today', 'Dzisiaj'], ['yesterday', 'Wczoraj'], ['7d', '7 dni'], ['30d', '30 dni']
            ] as const).map(([key, label]) => (
              <button key={key} onClick={() => applyPreset(key)} className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-xs md:text-sm">
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-xs text-zinc-400">Od
              <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
            </label>
            <label className="text-xs text-zinc-400">Do
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100" />
            </label>
            <label className="text-xs text-zinc-400">Grupowanie
              <select value={granularity} onChange={e => setGranularity(e.target.value as Granularity)} className="mt-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100">
                <option value="hour">Godzina</option>
                <option value="day">Dzień</option>
                <option value="week">Tydzień</option>
              </select>
            </label>
            <button onClick={() => void load()} className="mt-auto h-[38px] rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-sm hover:bg-emerald-400 inline-flex items-center justify-center gap-2">
              <Filter size={15} /> Analizuj okres
            </button>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-900 bg-red-950/50 p-4 text-red-300 text-sm">{error}</div>}

        {data && (
          <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-4 py-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-emerald-200">
            <span>✓ Dane V2</span>
            <span>✓ Bez wartości losowych</span>
            <span>✓ Legacy wykluczone</span>
            <span>✓ Sesja wygasa po {data.dataQuality.sessionTimeoutMinutes} min bezczynności</span>
            <span>Strefa: {data.timezone}</span>
          </div>
        )}

        <section className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          {loading && !data ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-zinc-900 animate-pulse" />) : cards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 min-h-28">
                <div className="flex items-center justify-between text-zinc-500 mb-3"><span className="text-[11px] uppercase tracking-wide">{card.label}</span><Icon size={16} /></div>
                <div className="text-xl font-semibold whitespace-nowrap">{card.value}</div>
                {card.compare !== null && <div className={`text-xs mt-2 ${typeof card.compare === 'number' && card.compare < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>{changeLabel(card.compare)} vs poprzedni okres</div>}
              </div>
            );
          })}
        </section>

        {data && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
              <div><h2 className="font-semibold">Ruch w czasie</h2><p className="text-xs text-zinc-500 mt-1">Kliknij inny okres lub zmień grupowanie na godzinę / dzień / tydzień.</p></div>
              <select value={metric} onChange={e => setMetric(e.target.value as Metric)} className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm">
                <option value="sessions">Sesje</option>
                <option value="users">Użytkownicy</option>
                <option value="pageViews">Odsłony</option>
                <option value="activeMinutes">Aktywny czas (min)</option>
                <option value="bookingStarts">Start rezerwacji</option>
              </select>
            </div>

            {data.timeSeries.length === 0 ? <div className="text-sm text-zinc-500 py-12 text-center">Brak danych V2 w wybranym okresie.</div> : (
              <div className="overflow-x-auto pb-2">
                <div className="flex items-end gap-2 min-w-max h-64 border-b border-zinc-800 px-2">
                  {data.timeSeries.map(point => {
                    const value = Number(point[metric] || 0);
                    const height = Math.max(value ? 8 : 1, Math.round((value / maxMetric) * 205));
                    return (
                      <div key={point.bucket} className="w-14 flex flex-col justify-end items-center h-full group">
                        <span className="text-[10px] text-zinc-400 mb-1 opacity-0 group-hover:opacity-100">{value}</span>
                        <div className="w-9 rounded-t-md bg-emerald-500/80 hover:bg-emerald-400 transition-all" style={{ height }} title={`${point.bucket}: ${value}`} />
                        <span className="mt-2 text-[9px] text-zinc-500 whitespace-nowrap -rotate-45 origin-top-left translate-x-4">{point.bucket}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {data && (
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold mb-4">Skąd przychodzą</h2>
              <div className="space-y-3">
                {data.sources.length === 0 ? <p className="text-sm text-zinc-500">Brak danych.</p> : data.sources.map(source => {
                  const max = Math.max(1, ...data.sources.map(item => item.sessions));
                  return <div key={source.source}>
                    <div className="flex justify-between text-sm mb-1"><span>{source.source}</span><span className="text-zinc-400">{source.sessions} sesji</span></div>
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden"><div className="h-full bg-sky-500" style={{ width: `${(source.sessions / max) * 100}%` }} /></div>
                  </div>;
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="font-semibold mb-4">Najczęściej oglądane strony</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-zinc-500 border-b border-zinc-800"><tr><th className="text-left py-2">Strona</th><th className="text-right">Odsłony</th><th className="text-right">Sesje</th><th className="text-right">Aktywnie</th></tr></thead>
                  <tbody>{data.pages.slice(0, 12).map(page => <tr key={page.page} className="border-b border-zinc-800/60"><td className="py-2 pr-4 font-mono text-xs">{page.page}</td><td className="text-right">{page.views}</td><td className="text-right">{page.sessions}</td><td className="text-right text-zinc-400">{formatMinutes(page.activeMinutes)}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {data && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div><h2 className="font-semibold">Ostatnie sesje</h2><p className="text-xs text-zinc-500 mt-1">Kliknij sesję, aby zobaczyć jej ścieżkę krok po kroku.</p></div>
              <div className="relative"><Search size={14} className="absolute left-3 top-3 text-zinc-500" /><input value={sessionSearch} onChange={e => setSessionSearch(e.target.value)} placeholder="Źródło, strona, urządzenie…" className="w-full md:w-72 bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm" /></div>
            </div>

            <div className="divide-y divide-zinc-800">
              {filteredSessions.length === 0 ? <div className="p-8 text-center text-sm text-zinc-500">Brak sesji V2 w tym okresie.</div> : filteredSessions.map(session => {
                const expanded = expandedSession === session.sessionId;
                return <div key={session.sessionId}>
                  <button onClick={() => setExpandedSession(expanded ? null : session.sessionId)} className="w-full p-4 grid grid-cols-[24px_1fr] xl:grid-cols-[24px_150px_1fr_100px_90px_90px_150px] gap-3 items-center text-left hover:bg-zinc-800/30">
                    {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <div className="text-xs"><div className="font-medium">{formatDateTime(session.startedAt)}</div><div className="text-zinc-500 xl:hidden">{session.source}</div></div>
                    <div className="hidden xl:block"><div className="text-sm">{session.source}</div><div className="text-xs text-zinc-500 truncate">{session.landingPage}</div></div>
                    <div className="hidden xl:block text-xs text-zinc-400">{session.device}<br />{session.browser}</div>
                    <div className="hidden xl:block text-sm">{session.pageViews} stron</div>
                    <div className="hidden xl:block text-sm">{formatMinutes(session.activeMinutes)}</div>
                    <div className="flex flex-wrap gap-1">
                      {session.bookingCompleted ? <span className="px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px]">REZERWACJA</span> : session.bookingStarted ? <span className="px-2 py-1 rounded-md bg-amber-500/15 text-amber-300 text-[10px]">START REZERWACJI</span> : null}
                      <span className="px-2 py-1 rounded-md bg-zinc-800 text-zinc-400 text-[10px]">{session.clicks} klik.</span>
                    </div>
                  </button>

                  {expanded && <div className="px-6 pb-6 pt-2 bg-zinc-950/40">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5 text-xs">
                      <div><span className="text-zinc-500">Czas sesji</span><div className="mt-1">{formatDuration(session.durationMs)}</div></div>
                      <div><span className="text-zinc-500">Aktywny czas</span><div className="mt-1">{formatMinutes(session.activeMinutes)}</div></div>
                      <div><span className="text-zinc-500">Landing</span><div className="mt-1 break-all">{session.landingPage}</div></div>
                      <div><span className="text-zinc-500">ID</span><div className="mt-1 font-mono text-[10px] break-all">{session.sessionId}</div></div>
                    </div>
                    <div className="border-l border-zinc-700 ml-2 space-y-0">
                      {session.path.map((step, index) => <div key={`${step.at}-${index}`} className="relative pl-6 py-2">
                        <div className="absolute -left-1.5 top-4 h-3 w-3 rounded-full bg-zinc-700 border-2 border-zinc-950" />
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs"><span className="text-zinc-500 tabular-nums">{formatDateTime(step.at)}</span><span className="text-emerald-300">{step.event}</span><span className="font-mono text-zinc-300">{step.page}</span></div>
                      </div>)}
                    </div>
                  </div>}
                </div>;
              })}
            </div>
          </section>
        )}

        <footer className="text-xs text-zinc-600 pb-6 flex items-center gap-2"><CalendarDays size={13} /> Wszystkie czasy raportowane w strefie Europe/Warsaw. Rezerwacje i przychód pochodzą z tabeli zamówień; zachowanie użytkowników wyłącznie z Analytics V2.</footer>
      </div>
    </div>
  );
}
