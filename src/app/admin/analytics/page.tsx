'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SessionJourneys, { journeyDate } from '@/components/admin/analytics/SessionJourneys';
import type { SessionJourney } from '@/lib/analytics/sessionJourneyTypes';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Eye, MousePointerClick, RefreshCcw, Search, Users } from 'lucide-react';

type PageRow = {
  host: string; path: string; title: string; kind: string; completeness: number; stage: string; blockers: string[];
  updatedAt: string | null; publicationRecord: { publishedAt: string | null; status: string; note: string };
  firstSeenAt: string | null; firstSeenSource: string | null;
  gates: Array<{ key: string; label: string; state: 'pass' | 'block' | 'unknown'; reason: string }>;
  impact: { sessions: number; landingSessions: number; assistedBookingStarts: number; ctaSessions: number; bookingStartSessions: number; clientEventConversions: number; canonicalInquiries: number; canonicalBookings: number; attributionNote: string; gsc: { clicks: number; impressions: number; ctr: number; position: number | null; clicksPct: number | null; impressionsPct: number | null }; baseline28: { sampleStatus: 'high' | 'medium' | 'neutral' | 'small_sample'; growthConfidence: 'high' | 'medium' | 'neutral' | 'small_sample'; note: string; sessions: number; previousSessions: number; sessionsPct: number | null; impressions: number; previousImpressions: number; impressionsPct: number | null }; trend: Array<{ date: string; sessions: number; clicks: number; impressions: number }> };
};
type SearchQueryRow = {
  host: string; query: string; page: string; clicks: number; impressions: number; ctr: number; position: number | null;
  previousClicks: number; previousImpressions: number; clicksPct: number | null; impressionsPct: number | null;
  competingPages: string[]; multiplePagesSignal: boolean;
};
type Dashboard = {
  success: boolean; version: number; generatedAt: string;
  sources: { analytics: { status: string; events: number; unknownHostSessions: number; hostNote: string }; gsc: { status: string; latestCompleteDate: string; comparisonStatus: string; sites: Array<{ siteUrl: string; status: string; error?: string; truncated?: boolean; queryReport: 'connected' | 'partial' | 'error'; queryError?: string }>; message: string }; finance: { bookingAttempts: number; successfulBookings: number; canonicalBookings: number; attributedBookings: number; note: string }; photoSales: { canonicalInquiries: number; attributedInquiries: number; note: string }; aeroSales: { canonicalInquiries: number; note: string } };
  overview: Record<string, any> & { comparison: Record<string, number | null> };
  photo: {
    overview: { sessions: number; pageViews: number; engagedSessions: number; ctaSessions: number; inquiryStartSessions: number; clientInquirySubmissions: number; bookingStartSessions: number; checkoutSubmitSessions: number; paymentStartSessions: number; canonicalInquiries: number; bookingAttempts: number; successfulBookings: number };
    entryFunnel: Array<{ key: string; label: string; value: number; note?: string }>;
    branches: { inquiry: Array<{ key: string; label: string; value: number; note?: string }>; booking: Array<{ key: string; label: string; value: number; note?: string }> };
  };
  aero: { overview: { sessions: number; pageViews: number; engagedSessions: number; ctaSessions: number; inquiryStartSessions: number; clientInquirySubmissions: number; canonicalInquiries: number }; funnel: Array<{ key: string; label: string; value: number; note?: string }> };
  funnel: Array<{ key: string; label: string; value: number; note?: string }>;
  diagnostics: { funnel: Array<{ event: string; label: string; sessions: number; dropoff: number }>; actions: Array<{ kind: string; title: string; evidence: string; confidence: string; recommendation: string }> };
  trafficSources: Array<{ source: string; sessions: number }>;
  ingest: Array<{ reason: string; outcome: string; batches: number; events: number }>;
  dataQuality: { unavailableSources: string[] };
  actions: Array<{ kind: string; title: string; evidence: string; recommendation: string }>;
  searchQueries: SearchQueryRow[];
  querySummary: { rows: number; totalRows: number; truncated: boolean; multiplePagesSignals: number; note: string };
  pages: PageRow[];
  recentSessions: SessionJourney[];
};
const STAGES: Record<string, string> = { draft: 'Szkic', published_unseen: 'Opublikowana bez danych', visible_no_visit: 'Widoczna bez wizyt', visited_not_visible: 'Odwiedzana, niewidoczna w GSC', needs_work: 'Wymaga pracy', established: 'Kompletna — bez dodatniego trendu', growing: 'Kompletna i rośnie' };
function calendarDate(date: Date) { return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
function rangeFor(days: number) { const end = new Date(); return { start: calendarDate(new Date(end.getTime() - days * 86_400_000)), end: calendarDate(end) }; }
const TABS = [{ id: 'visits', label: 'Wizyty i rezerwacje' }, { id: 'sales', label: 'Wyniki sprzedaży' }, { id: 'seo', label: 'Google i SEO' }] as const;
type AnalyticsTab = typeof TABS[number]['id'];
function delta(value: number | null | undefined) { return value == null ? 'nowy wynik' : `${value > 0 ? '+' : ''}${value}%`; }
function fmtDate(value: string | null) { return value ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(new Date(value)) : 'brak obserwacji'; }

export default function AnalyticsPage() {
  const initial = useMemo(() => rangeFor(28), []);
  const [start, setStart] = useState(initial.start.slice(0, 10)); const [end, setEnd] = useState(initial.end.slice(0, 10));
  const [data, setData] = useState<Dashboard | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [query, setQuery] = useState(''); const [stage, setStage] = useState('all'); const [expanded, setExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(''); const [queryHost, setQueryHost] = useState('wlasniewski.pl');
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('visits');
  const [loadedRange, setLoadedRange] = useState('');
  const request = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true); setError('');
    if (!start || !end || start > end) { setError('Wybierz poprawny zakres dat: początek nie może być po końcu.'); setLoading(false); return; }
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({ startDate: start, endDate: end });
      const response = await fetch(`/api/analytics/v3/dashboard?${params}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, cache: 'no-store', signal: controller.signal });
      const body = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok || !body.success) {
        if (response.status === 401 || response.status === 403) setData(null);
        throw new Error(body.message || 'Nie udało się pobrać danych');
      }
      setData(body); setLoadedRange(`${start}/${end}`);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Błąd analityki');
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, [start, end]);
  useEffect(() => { void load(); return () => request.current?.abort(); }, [load]);
  const preset = (days: number) => { const range = rangeFor(days); setStart(range.start.slice(0, 10)); setEnd(range.end.slice(0, 10)); };
  const filtered = (data?.pages || []).filter(page => `${page.host} ${page.path} ${page.title}`.toLowerCase().includes(query.toLowerCase()) && (stage === 'all' || page.stage === stage));
  const filteredSearchQueries = (data?.searchQueries || []).filter(row =>
    (queryHost === 'all' || row.host === queryHost)
    && `${row.query} ${row.page}`.toLocaleLowerCase('pl-PL').includes(searchQuery.toLocaleLowerCase('pl-PL'))
  ).slice(0, 100);
  const queryReportSites = (data?.sources.gsc.sites || []).filter(site => queryHost === 'all' || site.siteUrl.replace('sc-domain:', '').replace(/^www\./, '') === queryHost);
  const queryReportIncomplete = queryReportSites.some(site => site.queryReport !== 'connected');
  const cards = data ? [
    ['Użytkownicy', data.overview.users, data.overview.comparison.usersPct, Users], ['Sesje', data.overview.sessions, data.overview.comparison.sessionsPct, Activity],
    ['Wyświetlenia Google', data.overview.gscImpressions, data.overview.comparison.gscImpressionsPct, Eye], ['Kliknięcia Google', data.overview.gscClicks, null, MousePointerClick],
    ['Starty kontaktu/rezerwacji', data.overview.salesIntentStartSessions, null, MousePointerClick], ['Zapytania foto', data.overview.canonicalPhotoInquiries, null, CheckCircle2],
    ['Próby rezerwacji', data.overview.bookingAttempts, null, MousePointerClick],
    ['Skuteczne zlecenia (wybrany okres)', data.overview.successfulBookings, null, CheckCircle2],
    ['Cel bieżącego miesiąca: 4', `${data.overview.currentMonthSuccessfulBookings}/4`, null, CheckCircle2],
  ] as const : [];

  const rangeMatches = loadedRange === `${start}/${end}`;
  return <div className="min-w-0 bg-zinc-950 text-zinc-100"><div className="mx-auto min-w-0 max-w-[1600px] space-y-4">
    <header className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><BarChart3 aria-hidden="true" className="text-emerald-400"/><h1 className="text-2xl font-semibold md:text-3xl">Analityka</h1></div><button type="button" onClick={() => void load()} disabled={loading} className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-sm disabled:opacity-60"><RefreshCcw aria-hidden="true" size={16} className={loading ? 'animate-spin' : ''}/>Odśwież</button></header>
    <section aria-label="Zakres dat analityki" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="grid grid-cols-4 gap-2">{[0, 7, 28, 90].map(days => { const range = rangeFor(days); const active = range.start === start && range.end === end; return <button type="button" key={days} aria-pressed={active} onClick={() => preset(days)} className={`min-h-11 rounded-lg border px-2 text-sm font-medium ${active ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' : 'border-zinc-700 bg-zinc-950 text-zinc-300'}`}>{days === 0 ? 'Dzisiaj' : `${days} dni`}</button>; })}</div>
      <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 text-sm text-zinc-300">Zakres: {start} — {end}</summary><div className="grid min-w-0 grid-cols-1 gap-3 pt-2 sm:grid-cols-2"><label className="min-w-0 text-sm text-zinc-400">Od<input aria-label="Data początkowa" type="date" value={start} max={end || undefined} onChange={event => setStart(event.target.value)} className="mt-1 block min-h-11 w-full min-w-0 max-w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-base"/></label><label className="min-w-0 text-sm text-zinc-400">Do<input aria-label="Data końcowa" type="date" value={end} min={start || undefined} onChange={event => setEnd(event.target.value)} className="mt-1 block min-h-11 w-full min-w-0 max-w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-base"/></label></div></details>
    </section>
    <div role="tablist" aria-label="Raporty analityki" className="grid grid-cols-3 gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">{TABS.map((tab, index) => <button key={tab.id} id={`analytics-tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`analytics-panel-${tab.id}`} tabIndex={activeTab === tab.id ? 0 : -1} onClick={() => setActiveTab(tab.id)} onKeyDown={event => { let next = index; if (event.key === 'ArrowRight') next = (index + 1) % TABS.length; else if (event.key === 'ArrowLeft') next = (index + TABS.length - 1) % TABS.length; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = TABS.length - 1; else return; event.preventDefault(); setActiveTab(TABS[next].id); document.getElementById(`analytics-tab-${TABS[next].id}`)?.focus(); }} className={`min-h-14 min-w-0 rounded-lg px-2 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-400 ${activeTab === tab.id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-100'}`}>{tab.label}</button>)}</div>
    {error && <div role="alert" className="rounded-xl border border-red-800 bg-red-950/30 p-4 text-sm text-red-200">{error}{data && rangeMatches && <p className="mt-2">Nie udało się odświeżyć. Poniżej pozostaje poprzedni odczyt.</p>}<button type="button" onClick={() => void load()} disabled={loading} className="mt-3 block min-h-11 rounded-lg border border-red-700 px-3 disabled:opacity-60">Spróbuj ponownie</button></div>}
    {loading && <p role="status" className="text-sm text-zinc-400">{data && rangeMatches ? 'Odświeżanie zapisanych zdarzeń…' : 'Pobieranie analityki…'}</p>}
    {data && rangeMatches && <>
      <div id="analytics-panel-visits" role="tabpanel" aria-labelledby="analytics-tab-visits" hidden={activeTab !== 'visits'} className="space-y-5">
        <SessionJourneys sessions={data.recentSessions} unavailable={data.dataQuality.unavailableSources.includes('analytics-current')}/>
        <details className="rounded-2xl border border-zinc-800"><summary className="min-h-11 cursor-pointer p-4 text-sm font-medium">Sygnały i zalecane działania</summary><div className="space-y-4 px-3 pb-3">
      <section className="rounded-2xl border border-amber-700/50 bg-amber-950/20 p-5"><h2 className="text-lg font-semibold">Co robimy teraz</h2><p className="mt-1 text-sm text-zinc-400">Maksymalnie trzy zadania według wpływu i jakości dowodu.</p><div className="mt-4 grid gap-3 lg:grid-cols-3">{data.actions.length ? data.actions.map(action => <div key={`${action.kind}-${action.title}`} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"><strong className="text-sm">{action.title}</strong><p className="mt-2 text-sm text-zinc-300">{action.evidence}</p><p className="mt-2 text-sm text-emerald-300">Działanie: {action.recommendation}</p></div>) : <p className="text-sm text-zinc-400">Brak alarmów z wystarczającym dowodem.</p>}</div></section>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><h2 className="font-semibold">Sygnały problemów w formularzu i na stronie</h2><p className="mt-1 text-sm text-zinc-400">Awarie, dostępność, walidacja, LCP i hipoteza ceny pozostają widoczne niezależnie od rankingu trzech zadań.</p><div className="mt-4 grid gap-3 lg:grid-cols-2">{data.diagnostics.actions.length ? data.diagnostics.actions.map((action, index) => <div key={`${action.kind}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"><div className="flex items-start justify-between gap-2"><strong className="text-sm">{action.title}</strong><span className="rounded bg-zinc-800 px-2 py-1 text-sm">{action.confidence}</span></div><p className="mt-2 text-sm text-zinc-300">{action.evidence}</p><p className="mt-2 text-sm text-emerald-300">{action.recommendation}</p></div>) : <p className="text-sm text-zinc-400">Brak diagnostycznych sygnałów w tym okresie.</p>}</div><div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">{data.diagnostics.funnel.map(step => <div key={step.event} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><div className="text-sm text-zinc-400">{step.label}</div><div className="text-lg font-semibold">{step.sessions}</div>{step.dropoff > 0 && <div className="text-sm text-amber-300">odpływ {step.dropoff}</div>}</div>)}</div></section>
        </div></details>
      </div>
      <div id="analytics-panel-sales" role="tabpanel" aria-labelledby="analytics-tab-sales" hidden={activeTab !== 'sales'} className="space-y-5">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value, compare, Icon]) => <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4"><div className="flex justify-between text-sm text-zinc-400"><span>{label}</span><Icon size={15}/></div><div className="mt-3 text-2xl font-semibold">{value}</div>{compare !== null && <div className={`mt-2 text-sm ${data.overview.dataStatus === 'sufficient' ? 'text-emerald-400' : 'text-zinc-400'}`}>{delta(compare)} vs poprzedni okres</div>}</div>)}</section>
      <section data-testid="photo-sales-funnel" className="rounded-2xl border border-amber-800/70 bg-amber-950/10 p-5">
        <h2 className="font-semibold text-amber-100">Fotografia — dwa równoległe sposoby pozyskania klienta</h2>
        <p className="mt-1 text-sm text-zinc-400">Wspólny ruch rozdziela się na miękkie zapytanie bez płatności albo pełną rezerwację. Rekord pending jest próbą, nie skutecznym zleceniem.</p>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
          {data.photo.entryFunnel.map(step => <div key={step.key} className="rounded-xl border border-amber-900/60 bg-zinc-950 p-3"><div className="text-sm text-zinc-400">{step.label}</div><div className="mt-1 text-2xl font-semibold">{step.value}</div>{step.note && <div className="mt-2 text-sm text-amber-300">{step.note}</div>}</div>)}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-sky-900/70 bg-sky-950/10 p-4"><h3 className="text-sm font-semibold text-sky-200">Ścieżka A · zapytanie bez płatności</h3><div className="mt-3 grid gap-2 sm:grid-cols-3">{data.photo.branches.inquiry.map((step, index) => <div key={step.key} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><div className="text-sm text-zinc-400">{index + 1}. {step.label}</div><div className="mt-1 text-xl font-semibold">{step.value}</div>{step.note && <div className="mt-2 text-sm text-sky-300">{step.note}</div>}</div>)}</div></div>
          <div className="rounded-xl border border-emerald-900/70 bg-emerald-950/10 p-4"><h3 className="text-sm font-semibold text-emerald-200">Ścieżka B · pełna rezerwacja</h3><div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{data.photo.branches.booking.map((step, index) => <div key={step.key} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3"><div className="text-sm text-zinc-400">{index + 1}. {step.label}</div><div className="mt-1 text-xl font-semibold">{step.value}</div>{step.note && <div className="mt-2 text-sm text-emerald-300">{step.note}</div>}</div>)}</div></div>
        </div>
      </section>
      <section data-testid="aero-sales-funnel" className="rounded-2xl border border-emerald-800/70 bg-emerald-950/20 p-5"><h2 className="font-semibold text-emerald-200">Aero Analiza — oddzielny lejek zapytań</h2><p className="mt-1 text-sm text-zinc-400">Wyłącznie zdarzenia domeny aeroanaliza.pl i kanoniczne rekordy Inquiry oznaczone źródłem Aero.</p><div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{data.aero.funnel.map((step, index) => <div key={step.key} className="rounded-xl border border-emerald-900/70 bg-zinc-950 p-3"><div className="text-sm text-zinc-400">{index + 1}. {step.label}</div><div className="mt-1 text-2xl font-semibold">{step.value}</div>{step.note && <div className="mt-2 text-sm text-emerald-300">{step.note}</div>}</div>)}</div></section>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><h2 className="font-semibold">Lejek łączny obu serwisów</h2><p className="mt-1 text-sm text-zinc-400">Widok porównawczy fotografii i Aero; decyzje Aero należy opierać na oddzielnym lejku powyżej.</p><div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{data.funnel.map((step, index) => <div key={step.key} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"><div className="text-sm text-zinc-400">{index + 1}. {step.label}</div><div className="mt-1 text-2xl font-semibold">{step.value}</div>{step.note && <div className="mt-2 text-sm text-amber-300">{step.note}</div>}</div>)}</div></section>
      <section data-testid="traffic-sources-ingest" className="min-w-0"><div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><h2 className="font-semibold">Źródła ruchu</h2>{data.trafficSources.map(source => <div key={source.source} className="mt-2 flex flex-wrap justify-between gap-2 text-sm"><span className="min-w-0 break-words [overflow-wrap:anywhere]">{source.source}</span><span className="shrink-0">{source.sessions} sesji</span></div>)}</div></section>
      </div>
      <div id="analytics-panel-seo" role="tabpanel" aria-labelledby="analytics-tab-seo" hidden={activeTab !== 'seo'} className="space-y-5">
      <section data-testid="gsc-query-page-report" className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <div className="border-b border-zinc-800 p-4">
          <h2 className="text-lg font-semibold">Zapytania Google → strony</h2>
          <p className="mt-2 text-sm text-zinc-400">{data.querySummary.note} Pokazujemy maksymalnie 100 dopasowanych wierszy.</p>
          {queryReportIncomplete && <p className="mt-2 text-sm text-red-300">Raport zapytań dla wybranej domeny jest niepełny. Nie interpretuj braku wierszy ani zmian względem poprzedniego okresu.</p>}
          <p className="mt-2 text-sm text-amber-300">Sygnały wielu URL-i: {data.querySummary.multiplePagesSignals}</p>
          <div className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
            <label className="relative min-w-0"><Search aria-hidden="true" size={16} className="absolute left-3 top-3.5 text-zinc-400"/><input aria-label="Szukaj frazy Google lub adresu strony" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Szukaj frazy lub URL…" className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-base"/></label>
            <select aria-label="Domena raportu Google" value={queryHost} onChange={event => setQueryHost(event.target.value)} className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-base"><option value="wlasniewski.pl">wlasniewski.pl</option><option value="aeroanaliza.pl">aeroanaliza.pl</option><option value="all">Obie domeny</option></select>
          </div>
        </div>
        <div data-testid="gsc-mobile-cards" className="divide-y divide-zinc-800 lg:hidden">
          {filteredSearchQueries.map(row => <article key={`${row.host}:${row.query}:${row.page}`} className="min-w-0 p-4">
            <h3 className="break-words font-semibold [overflow-wrap:anywhere]">{row.query}</h3>
            <p className="mt-1 break-words text-sm text-sky-300 [overflow-wrap:anywhere]">{row.host}</p>
            <p className="mt-1 break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">{row.page}</p>
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-zinc-400">Kliknięcia</dt><dd className="font-medium">{row.clicks}</dd></div>
              <div><dt className="text-zinc-400">Wyświetlenia</dt><dd className="font-medium">{row.impressions}</dd></div>
              <div><dt className="text-zinc-400">CTR</dt><dd>{(row.ctr * 100).toFixed(1)}%</dd></div>
              <div><dt className="text-zinc-400">Pozycja</dt><dd>{row.position?.toFixed(1) || 'brak'}</dd></div>
              <div className="col-span-2"><dt className="text-zinc-400">Zmiana wyświetleń</dt><dd>{queryReportIncomplete ? 'dane niepełne' : delta(row.impressionsPct)}</dd></div>
            </dl>
            <p className={`mt-3 break-words text-sm [overflow-wrap:anywhere] ${row.multiplePagesSignal ? 'text-amber-300' : 'text-emerald-300'}`}>{row.multiplePagesSignal ? `Wiele URL-i: ${row.competingPages.join(', ')}` : 'Jeden URL'}</p>
          </article>)}
          {filteredSearchQueries.length === 0 && <p className="p-4 text-sm text-zinc-400">{queryReportIncomplete ? 'Niepełny odczyt raportu zapytań GSC.' : 'Brak zapytań dla wybranych filtrów i okresu.'}</p>}
        </div>
<div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-zinc-950/70 text-zinc-400"><tr><th className="px-4 py-3">Zapytanie</th><th className="px-4 py-3">Strona</th><th className="px-4 py-3">Klik.</th><th className="px-4 py-3">Wyśw.</th><th className="px-4 py-3">CTR</th><th className="px-4 py-3">Pozycja</th><th className="px-4 py-3">Wyśw. vs okres</th><th className="px-4 py-3">Ocena</th></tr></thead><tbody className="divide-y divide-zinc-800">{filteredSearchQueries.map(row => <tr key={`${row.host}:${row.query}:${row.page}`} className={row.multiplePagesSignal ? 'bg-amber-950/10' : ''}><td className="px-4 py-3 font-medium text-zinc-100">{row.query}<div className="mt-1 text-sm uppercase text-sky-400">{row.host}</div></td><td className="px-4 py-3 font-mono text-zinc-300">{row.page}</td><td className="px-4 py-3">{row.clicks}</td><td className="px-4 py-3">{row.impressions}</td><td className="px-4 py-3">{(row.ctr * 100).toFixed(1)}%</td><td className="px-4 py-3">{row.position?.toFixed(1) || 'brak'}</td><td className="px-4 py-3">{queryReportIncomplete ? 'dane niepełne' : delta(row.impressionsPct)}</td><td className="px-4 py-3">{row.multiplePagesSignal ? <span className="text-amber-300">Wiele URL-i: {row.competingPages.join(', ')}</span> : <span className="text-emerald-300">Jeden URL</span>}</td></tr>)}{filteredSearchQueries.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-400">{queryReportIncomplete ? 'Niepełny odczyt raportu zapytań GSC.' : 'Brak zapytań dla wybranych filtrów i okresu.'}</td></tr>}</tbody></table></div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60"><div className="border-b border-zinc-800 p-5"><h2 className="text-lg font-semibold">Rozwój i wpływ podstron</h2><p className="mt-1 text-sm text-zinc-400">Kompletność liczy tylko sprawdzalne bramki. „Pierwsza obserwacja” nie jest datą publikacji.</p><div className="mt-4 grid gap-3 md:grid-cols-[1fr_240px]"><label className="relative"><Search size={15} className="absolute left-3 top-3 text-zinc-400"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Szukaj strony…" aria-label="Szukaj podstrony" className="min-h-11 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3"/></label><select aria-label="Etap rozwoju podstrony" value={stage} onChange={e => setStage(e.target.value)} className="min-h-11 min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"><option value="all">Wszystkie etapy</option>{Object.entries(STAGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div></div>
        <div className="divide-y divide-zinc-800">{filtered.map(page => { const pageId = `${page.host}:${page.path}`; return <article key={pageId}><button aria-expanded={expanded === pageId} onClick={() => setExpanded(expanded === pageId ? null : pageId)} className="grid w-full gap-3 p-4 text-left hover:bg-zinc-800/30 grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_110px_100px_100px_100px_90px] xl:items-center"><div className="col-span-2 min-w-0 xl:col-span-1"><div className="break-words font-medium [overflow-wrap:anywhere]">{page.title}</div><div className="text-sm uppercase text-sky-400">{page.host}</div><div className="break-words text-sm text-zinc-400 [overflow-wrap:anywhere]">{page.path}</div></div><div><div className="text-sm text-zinc-400">Etap</div><div className="text-sm">{STAGES[page.stage] || page.stage}</div></div><div><div className="text-sm text-zinc-400">Kompletność techn.</div><div className={page.completeness >= 80 ? 'text-emerald-300' : 'text-amber-300'}>{page.completeness}%</div></div><div><div className="text-sm text-zinc-400">Google klik./wyśw.</div><div>{page.impact.gsc.clicks} / {page.impact.gsc.impressions}</div></div><div><div className="text-sm text-zinc-400">Sesje / landing</div><div>{page.impact.sessions} / {page.impact.landingSessions}</div></div><div><div className="text-sm text-zinc-400">Zapyt./rez.</div><div>{page.impact.canonicalInquiries} / {page.impact.canonicalBookings}</div></div></button>
          {expanded === pageId && <div className="border-t border-zinc-800 bg-zinc-950/50 p-5"><div className="grid gap-4 lg:grid-cols-3"><div><h3 className="text-sm font-semibold">Rozwój</h3><p className="mt-2 text-sm text-zinc-400">Pierwsza obserwacja: {fmtDate(page.firstSeenAt)} {page.firstSeenSource ? `(${page.firstSeenSource})` : ''}</p><p className="mt-1 text-sm text-zinc-400">Ostatnia zmiana: {fmtDate(page.updatedAt)}</p><p className="mt-1 text-sm text-amber-300">{page.publicationRecord.note}</p><div className="mt-3 space-y-2">{page.gates.map(gate => <div key={gate.key} className="flex gap-2 text-sm"><span className={gate.state === 'pass' ? 'text-emerald-400' : gate.state === 'block' ? 'text-red-400' : 'text-zinc-400'}>{gate.state === 'pass' ? '✓' : gate.state === 'block' ? '✕' : '?'}</span><span><strong>{gate.label}:</strong> {gate.reason}</span></div>)}</div></div><div><h3 className="text-sm font-semibold">Wpływ i trend 28/28</h3><dl className="mt-2 grid grid-cols-2 gap-2 text-sm"><div><dt className="text-zinc-400">Sesje</dt><dd>{page.impact.baseline28.sessions} vs {page.impact.baseline28.previousSessions} ({delta(page.impact.baseline28.sessionsPct)})</dd></div><div><dt className="text-zinc-400">Wyświetlenia GSC</dt><dd>{page.impact.baseline28.impressions} vs {page.impact.baseline28.previousImpressions} ({delta(page.impact.baseline28.impressionsPct)})</dd></div><div><dt className="text-zinc-400">Asysta startu</dt><dd>{page.impact.assistedBookingStarts}</dd></div><div><dt className="text-zinc-400">CTA</dt><dd>{page.impact.ctaSessions}</dd></div><div><dt className="text-zinc-400">Konwersja klienta</dt><dd>{page.impact.clientEventConversions}</dd></div><div><dt className="text-zinc-400">Pozycja GSC</dt><dd>{page.impact.gsc.position?.toFixed(1) || 'brak'}</dd></div></dl><div className="mt-3 flex h-12 items-end gap-1">{page.impact.trend.slice(-28).map(point => <div key={point.date} title={`${point.date}: ${point.sessions}`} className="min-w-1 flex-1 bg-emerald-500" style={{height: `${Math.max(4, Math.min(48, point.sessions * 8))}px`}}/>)}</div></div><div><h3 className="text-sm font-semibold">Atrybucja sprzedaży</h3><p className="mt-2 text-sm text-amber-200">{page.impact.attributionNote}</p></div></div></div>}
        </article>})}</div></section>
      <section data-testid="page-baseline-status" className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><h2 className="font-semibold">Wiarygodność trendów podstron 28/28</h2><div className="mt-3 space-y-2">{filtered.map(page => <div key={`${page.host}:${page.path}:baseline`} className={`rounded-lg border border-zinc-800 p-3 text-sm ${page.impact.baseline28.sampleStatus === 'small_sample' ? 'text-zinc-400' : 'text-zinc-100'}`}><strong className="break-words [overflow-wrap:anywhere]">{page.host}{page.path}</strong><span className="ml-2">status: {page.impact.baseline28.sampleStatus} · pewność: {page.impact.baseline28.growthConfidence}</span><p className="mt-1">{page.impact.baseline28.note}</p><p className="mt-1">Sesje: {delta(page.impact.baseline28.sessionsPct)} · GSC: {delta(page.impact.baseline28.impressionsPct)}</p></div>)}</div></section>
      </div>
      <details className="rounded-2xl border border-zinc-800 bg-zinc-900/40"><summary className="min-h-11 cursor-pointer p-4 text-sm font-medium">Stan danych{data.dataQuality.unavailableSources.length > 0 ? ' · część źródeł niedostępna' : ''}</summary><div className="space-y-4 border-t border-zinc-800 p-3">
        <p className="text-sm text-zinc-400">Odczyt: {data.generatedAt ? journeyDate(data.generatedAt) : 'brak zapisu czasu odczytu'} · czas polski. Analityka obejmuje zapisane zdarzenia; nie każda wizyta zostawia kompletny ślad.</p>
    <section className="grid gap-3 md:grid-cols-3">{data && [
      ['Analityka własna', `${data.sources.analytics.events} zdarzeń`, data.sources.analytics.status === 'connected'],
      ['Google Search Console', `${data.sources.gsc.status} · ${data.sources.gsc.sites.map(site => `${site.siteUrl.replace('sc-domain:', '')}: ${site.status}${site.truncated ? ' (limit wierszy)' : ''}`).join(', ') || data.sources.gsc.message} · kompletne do ${data.sources.gsc.latestCompleteDate}`, data.sources.gsc.status === 'connected'],
      ['Sprzedaż', `${data.sources.finance.successfulBookings} skutecznych zleceń / ${data.sources.finance.bookingAttempts} prób · ${data.sources.photoSales.canonicalInquiries} zapytań foto · ${data.sources.aeroSales.canonicalInquiries} zapytań Aero`, true],
    ].map(([label, detail, ok]) => <div key={String(label)} className={`rounded-2xl border p-4 ${ok ? 'border-emerald-900 bg-emerald-950/20' : 'border-amber-800 bg-amber-950/20'}`}><div className="flex items-center gap-2 text-sm font-medium">{ok ? <CheckCircle2 size={16} className="text-emerald-400"/> : <AlertTriangle size={16} className="text-amber-400"/>}{label}</div><div className="mt-2 break-words text-sm text-zinc-300 [overflow-wrap:anywhere]">{String(detail)}</div></div>)}</section>
    {data && data.sources.analytics.unknownHostSessions > 0 && <section className="rounded-xl border border-amber-700 bg-amber-950/20 p-4 text-sm text-amber-100"><strong>Dane historyczne bez domeny: {data.sources.analytics.unknownHostSessions} sesji.</strong><p className="mt-1 text-sm text-zinc-300">{data.sources.analytics.hostNote} Są ujęte w sumach ogólnych i widoczne jako „unknown”.</p></section>}
    {data && data.dataQuality.unavailableSources.length > 0 && <section className="rounded-xl border border-amber-700 bg-amber-950/20 p-4 text-sm text-amber-100"><strong>Panel działa w trybie ograniczonym.</strong><p className="mt-1 text-sm text-zinc-300">Niedostępne źródła: {data.dataQuality.unavailableSources.join(', ')}. Pozostałe dane są nadal wyświetlane.</p></section>}
    {data && <section data-testid="sample-status-note" className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-200"><strong>Status danych: {data.overview.dataStatus}</strong><p className="mt-1 text-sm text-zinc-400">{data.overview.dataStatusNote} Przy małej próbie delty są informacyjne, nie stanowią sukcesu ani alarmu.</p></section>}
<div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"><h2 className="font-semibold">Jakość odbioru zdarzeń</h2>{data.ingest.map(row => <div key={`${row.outcome}-${row.reason}`} className="mt-2 flex flex-wrap justify-between gap-2 text-sm"><span className="min-w-0 break-words [overflow-wrap:anywhere]">{row.outcome}: {row.reason}</span><span className="shrink-0">{row.batches} / {row.events}</span></div>)}</div>      </div></details>
    </>}
  </div></div>;
}
