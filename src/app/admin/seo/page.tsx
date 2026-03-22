'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
    Activity,
    AlertTriangle,
    ArrowUpRight,
    BarChart3,
    Bot,
    CheckCircle2,
    CircleAlert,
    ExternalLink,
    Gauge,
    Globe,
    LineChart,
    Rocket,
    Save,
    Search,
    Send,
    Sparkles,
    Tag,
    Wrench,
    Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── Types ─── */
type ChecklistItem = {
    id: string;
    category: 'Technical' | 'Content' | 'Authority' | 'Conversion' | 'Automation';
    title: string;
    why: string;
    toolName: string;
    toolUrl: string;
    effort: 'S' | 'M' | 'L';
    impactPoints: number;
    done: boolean;
    note: string;
    updatedAt?: string;
};

type ToolConnection = {
    id: string;
    name: string;
    connected: boolean;
    source: string;
    setupUrl: string;
    free: boolean;
};

type LandingPageItem = { page: string; views: number };
type KeywordEntry = { keyword: string; count: number; density: number; pages: string[] };
type AiRecommendation = { page: string; severity: 'critical' | 'warning' | 'info'; category: string; finding: string; recommendation: string };

type SeoOpsPayload = {
    success: boolean;
    generatedAt: string;
    summary: {
        score: number;
        rankBand: string;
        pageCount: number;
        completionPercent: number;
        unresolvedCritical: number;
        organicShare: number;
        currentOrganicVisits30d: number;
        organicDeltaPercent: number;
        trafficDeltaPercent: number;
    };
    diagnostics: {
        missingMetaTitlePages: number;
        missingMetaDescriptionPages: number;
        thinPages: number;
        missingSessionMeta: number;
        missingBlogMeta: number;
        weakBlogExcerpts: number;
        analyticsConfigured: boolean;
        gscConfigured: boolean;
    };
    trend: {
        currentWindowDays: number;
        currentPageViews: number;
        previousPageViews: number;
        currentOrganicVisits: number;
        previousOrganicVisits: number;
        topOrganicLandingPages: LandingPageItem[];
    };
    checklist: ChecklistItem[];
    tools: ToolConnection[];
    keywordAnalytics: {
        b2c: KeywordEntry[];
        b2b: KeywordEntry[];
        b2cPageCount: number;
        b2bPageCount: number;
    };
    aiRecommendations: AiRecommendation[];
    b2bDiagnostics: {
        status: string;
        issues: string[];
        recommendations: string[];
    };
    competitorAudit: {
        checkedAt: string;
        findings: Array<{ domain: string; verdict: string; weaknesses: string[] }>;
    };
    roadmap90Days: Array<{ phase: string; goal: string; tasks: string[] }>;
};

type PageSpeedResult = { performance: number; seo: number; accessibility: number; bestPractices: number } | null;

/* ─── Helpers ─── */
function clamp(v: number, min: number, max: number) { return Math.min(max, Math.max(min, v)); }
function estimateRankBand(s: number) { if (s >= 85) return 'TOP 10'; if (s >= 72) return '11-20'; if (s >= 58) return '21-40'; if (s >= 45) return '41-70'; return '70+'; }
function trendClass(d: number) { return d > 0 ? 'text-emerald-400' : d < 0 ? 'text-rose-400' : 'text-zinc-400'; }
function severityColor(s: string) { return s === 'critical' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' : s === 'warning' ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' : 'text-sky-400 bg-sky-500/10 border-sky-500/30'; }
function severityLabel(s: string) { return s === 'critical' ? 'KRYTYCZNE' : s === 'warning' ? 'OSTRZEŻENIE' : 'INFO'; }

export default function SeoOpsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<SeoOpsPayload | null>(null);
    const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
    const [simulatedIds, setSimulatedIds] = useState<string[]>([]);
    const [psiUrl, setPsiUrl] = useState('https://wlasniewski.pl');
    const [psiLoading, setPsiLoading] = useState(false);
    const [psiResult, setPsiResult] = useState<PageSpeedResult>(null);
    const [indexNowLoading, setIndexNowLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'b2c' | 'b2b'>('b2c');
    const [aiFilterSeverity, setAiFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) { window.location.href = '/admin/login'; return; }
            const res = await fetch('/api/admin/seo-ops', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                window.location.href = '/admin/login';
                return;
            }
            const payload = (await res.json()) as SeoOpsPayload;
            if (!res.ok || !payload.success) throw new Error('Nie udało się pobrać raportu SEO Ops.');
            setData(payload);
            setChecklist(payload.checklist);
            setSimulatedIds(payload.checklist.filter(i => !i.done).slice(0, 3).map(i => i.id));
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania SEO Ops.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { void fetchReport(); }, [fetchReport]);

    const updateChecklistItem = (id: string, patch: Partial<ChecklistItem>) => {
        setChecklist(prev => prev.map(item => (item.id === id ? { ...item, ...patch } : item)));
    };

    const saveChecklist = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/seo-ops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({
                    action: 'save-checklist',
                    checklist: checklist.map(i => ({ id: i.id, done: i.done, note: i.note, updatedAt: new Date().toISOString() })),
                }),
            });
            if (!res.ok) throw new Error('Błąd zapisu.');
            toast.success('Checklista SEO zapisana.');
            void fetchReport();
        } catch (error) { console.error(error); toast.error('Nie udało się zapisać checklisty.'); }
        finally { setSaving(false); }
    };

    const runPageSpeed = async () => {
        setPsiLoading(true);
        setPsiResult(null);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/seo-ops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ action: 'pagespeed', url: psiUrl }),
            });
            const result = await res.json() as { success: boolean; scores?: PageSpeedResult };
            if (!res.ok || !result.success) throw new Error('PageSpeed błąd');
            setPsiResult(result.scores ?? null);
            toast.success('PageSpeed Insights: wyniki gotowe');
        } catch { toast.error('Nie udało się pobrać wyników PageSpeed.'); }
        finally { setPsiLoading(false); }
    };

    const runIndexNow = async () => {
        setIndexNowLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const urls = [
                'https://wlasniewski.pl/',
                'https://wlasniewski.pl/portfolio',
                'https://wlasniewski.pl/blog',
                'https://wlasniewski.pl/rezerwacja',
                'https://wlasniewski.pl/o-mnie',
            ];
            const res = await fetch('/api/admin/seo-ops', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ action: 'indexnow', urls }),
            });
            const result = await res.json() as { success: boolean; submitted?: number };
            if (result.success) toast.success(`IndexNow: ${result.submitted} URL-i wysłano do indeksacji`);
            else toast.error('IndexNow: błąd wysyłki');
        } catch { toast.error('IndexNow: błąd połączenia'); }
        finally { setIndexNowLoading(false); }
    };

    const simulation = useMemo(() => {
        if (!data) return { predictedScore: 0, predictedRankBand: '70+', selectedImpact: 0 };
        const selectedImpact = checklist
            .filter(i => simulatedIds.includes(i.id) && !i.done)
            .reduce((sum, i) => sum + i.impactPoints, 0);
        const predictedScore = clamp(Math.round(data.summary.score + selectedImpact * 0.9), 10, 99);
        return { predictedScore, predictedRankBand: estimateRankBand(predictedScore), selectedImpact };
    }, [data, checklist, simulatedIds]);

    const filteredAiRecs = useMemo(() => {
        if (!data) return [];
        return aiFilterSeverity === 'all' ? data.aiRecommendations : data.aiRecommendations.filter(r => r.severity === aiFilterSeverity);
    }, [data, aiFilterSeverity]);

    if (loading || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center text-zinc-400">
                <BarChart3 className="animate-pulse" />
                <span className="ml-3">Ładowanie SEO Ops...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 text-white pb-10">
            {/* ─── Header ─── */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">SEO Ops Command Center</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">Pełny audyt + plan wzrostu SEO</h1>
                        <p className="mt-3 text-sm text-zinc-400 max-w-3xl">
                            Panel łączy audyt techniczny, analizę konkurencji, Agent AI SEO, analitykę słów kluczowych B2C/B2B,
                            diagnostykę domeny aeroanaliza.pl, PageSpeed Insights, IndexNow i symulator &quot;co się zmieni gdy...&quot;.
                        </p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button onClick={runIndexNow} disabled={indexNowLoading}
                            className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50">
                            <Zap className="mr-2 h-4 w-4" />
                            {indexNowLoading ? 'Wysyłanie...' : 'IndexNow'}
                        </button>
                        <button onClick={saveChecklist} disabled={saving}
                            className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-50">
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? 'Zapisywanie...' : 'Zapisz checklistę'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── Metric Cards ─── */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <MetricCard icon={<Gauge className="h-5 w-5 text-emerald-400" />} label="SEO Score" value={`${data.summary.score}/100`} hint={`Pokrycie checklisty: ${data.summary.completionPercent}%`} />
                <MetricCard icon={<Search className="h-5 w-5 text-sky-400" />} label="Aktualny ranking" value={data.summary.rankBand} hint="Estymacja pozycji dla fraz lokalnych" />
                <MetricCard icon={<LineChart className="h-5 w-5 text-violet-400" />} label="Organic 30d" value={String(data.summary.currentOrganicVisits30d)} hint={`Zmiana m/m: ${data.summary.organicDeltaPercent}%`} hintClass={trendClass(data.summary.organicDeltaPercent)} />
                <MetricCard icon={<CircleAlert className="h-5 w-5 text-amber-400" />} label="Krytyczne luki" value={String(data.summary.unresolvedCritical)} hint={`Przeanalizowane URL: ${data.summary.pageCount}`} />
                <MetricCard icon={<Bot className="h-5 w-5 text-fuchsia-400" />} label="AI rekomendacje" value={String(data.aiRecommendations.length)} hint={`Krytyczne: ${data.aiRecommendations.filter(r => r.severity === 'critical').length}`} hintClass="text-rose-400" />
            </section>

            {/* ─── PageSpeed Insights ─── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Rocket className="h-5 w-5 text-orange-400" />
                    <h2 className="text-lg font-semibold">PageSpeed Insights (Google API)</h2>
                    <span className="text-xs text-zinc-500">Darmowe — bez klucza API</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                        <label className="text-xs text-zinc-500 block mb-1">URL do przetestowania</label>
                        <select value={psiUrl} onChange={e => setPsiUrl(e.target.value)}
                            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-zinc-200 outline-none focus:border-orange-500">
                            <option value="https://wlasniewski.pl">wlasniewski.pl (strona główna)</option>
                            <option value="https://wlasniewski.pl/rezerwacja">wlasniewski.pl/rezerwacja</option>
                            <option value="https://wlasniewski.pl/portfolio">wlasniewski.pl/portfolio</option>
                            <option value="https://wlasniewski.pl/blog">wlasniewski.pl/blog</option>
                            <option value="https://aeroanaliza.pl">aeroanaliza.pl (B2B)</option>
                        </select>
                    </div>
                    <button onClick={runPageSpeed} disabled={psiLoading}
                        className="inline-flex items-center rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:opacity-50">
                        <Rocket className="mr-2 h-4 w-4" />
                        {psiLoading ? 'Testowanie (do 30s)...' : 'Uruchom test'}
                    </button>
                </div>
                {psiResult && (
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <ScoreBox label="Performance" score={psiResult.performance} />
                        <ScoreBox label="SEO" score={psiResult.seo} />
                        <ScoreBox label="Accessibility" score={psiResult.accessibility} />
                        <ScoreBox label="Best Practices" score={psiResult.bestPractices} />
                    </div>
                )}
            </section>

            {/* ─── AI Agent SEO Recommendations ─── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-fuchsia-400" />
                        <h2 className="text-lg font-semibold">Agent AI SEO — Automatyczne rekomendacje</h2>
                    </div>
                    <div className="flex gap-2">
                        {(['all', 'critical', 'warning', 'info'] as const).map(f => (
                            <button key={f} onClick={() => setAiFilterSeverity(f)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${aiFilterSeverity === f ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'}`}>
                                {f === 'all' ? `Wszystkie (${data.aiRecommendations.length})` : f === 'critical' ? `Krytyczne (${data.aiRecommendations.filter(r => r.severity === 'critical').length})` : f === 'warning' ? `Ostrzeżenia (${data.aiRecommendations.filter(r => r.severity === 'warning').length})` : `Info (${data.aiRecommendations.filter(r => r.severity === 'info').length})`}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {filteredAiRecs.map((rec, i) => (
                        <div key={i} className={`rounded-xl border p-4 ${severityColor(rec.severity)}`}>
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{severityLabel(rec.severity)}</span>
                                        <span className="text-xs text-zinc-500">{rec.category}</span>
                                        <span className="text-xs text-zinc-500">•</span>
                                        <span className="text-xs text-zinc-300 font-mono">{rec.page}</span>
                                    </div>
                                    <p className="text-sm font-medium">{rec.finding}</p>
                                    <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">{rec.recommendation}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredAiRecs.length === 0 && <p className="text-xs text-zinc-500 py-4 text-center">Brak rekomendacji dla wybranego filtra.</p>}
                </div>
            </section>

            {/* ─── Keyword Analytics B2C vs B2B ─── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Tag className="h-5 w-5 text-emerald-400" />
                    <h2 className="text-lg font-semibold">Analityka słów kluczowych — B2C vs B2B</h2>
                </div>
                <div className="flex gap-2 mb-5">
                    <button onClick={() => setActiveTab('b2c')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === 'b2c' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                        B2C — wlasniewski.pl ({data.keywordAnalytics.b2cPageCount} stron)
                    </button>
                    <button onClick={() => setActiveTab('b2b')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${activeTab === 'b2b' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                        B2B — aeroanaliza.pl ({data.keywordAnalytics.b2bPageCount} stron)
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                                <th className="pb-3 pr-4">#</th>
                                <th className="pb-3 pr-4">Słowo / fraza</th>
                                <th className="pb-3 pr-4">Wystąpienia</th>
                                <th className="pb-3 pr-4">Gęstość %</th>
                                <th className="pb-3">Strony</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeTab === 'b2c' ? data.keywordAnalytics.b2c : data.keywordAnalytics.b2b).map((kw, i) => (
                                <tr key={kw.keyword} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition">
                                    <td className="py-2.5 pr-4 text-zinc-500">{i + 1}</td>
                                    <td className="py-2.5 pr-4 font-medium">{kw.keyword}</td>
                                    <td className="py-2.5 pr-4 text-zinc-300">{kw.count}</td>
                                    <td className="py-2.5 pr-4">
                                        <span className={`${kw.density > 3 ? 'text-rose-400' : kw.density > 1 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                                            {kw.density}%
                                        </span>
                                    </td>
                                    <td className="py-2.5 text-xs text-zinc-500 max-w-[200px] truncate">{kw.pages.join(', ')}</td>
                                </tr>
                            ))}
                            {(activeTab === 'b2c' ? data.keywordAnalytics.b2c : data.keywordAnalytics.b2b).length === 0 && (
                                <tr><td colSpan={5} className="py-6 text-center text-zinc-500">Brak danych — dodaj więcej treści do stron {activeTab === 'b2b' ? 'B2B' : 'B2C'}.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ─── B2B Domain Diagnostics (aeroanaliza.pl) ─── */}
            <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-amber-400" />
                    <h2 className="text-lg font-semibold">Diagnostyka domeny B2B: aeroanaliza.pl</h2>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${data.b2bDiagnostics.status === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {data.b2bDiagnostics.status === 'critical' ? 'KRYTYCZNY' : 'CZĘŚCIOWY'}
                    </span>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div>
                        <h3 className="text-sm font-medium text-rose-400 mb-2">Problemy wykryte:</h3>
                        <ul className="space-y-2">
                            {data.b2bDiagnostics.issues.map((issue, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                    <CircleAlert className="h-4 w-4 mt-0.5 text-rose-400 shrink-0" />
                                    {issue}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-emerald-400 mb-2">Rekomendacje naprawcze:</h3>
                        <ul className="space-y-2">
                            {data.b2bDiagnostics.recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-400 shrink-0" />
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ─── Simulator ─── */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Symulator &quot;co się zmieni gdy...&quot;</h2>
                        <span className="text-xs text-zinc-500">Wybierz zadania i zobacz estymowany efekt</span>
                    </div>
                    <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {checklist.filter(i => !i.done).map(item => {
                            const selected = simulatedIds.includes(item.id);
                            return (
                                <label key={item.id}
                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${selected ? 'border-emerald-500/60 bg-emerald-500/10' : 'border-zinc-800 bg-black/30 hover:border-zinc-700'}`}>
                                    <input type="checkbox" checked={selected}
                                        onChange={e => setSimulatedIds(prev => e.target.checked ? [...prev, item.id] : prev.filter(id => id !== item.id))}
                                        className="mt-1" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-sm font-medium">{item.title}</p>
                                            <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">+{item.impactPoints}</span>
                                        </div>
                                        <p className="mt-1 text-xs text-zinc-500">{item.why}</p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <h3 className="text-sm uppercase tracking-[0.12em] text-zinc-500">Prognoza 90 dni</h3>
                    <p className="mt-4 text-zinc-400 text-sm">Po wdrożeniu zaznaczonych zadań:</p>
                    <div className="mt-5 space-y-4">
                        <div>
                            <p className="text-xs text-zinc-500">Nowy SEO Score</p>
                            <p className="text-3xl font-bold text-emerald-400">{simulation.predictedScore}/100</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Estymowany ranking</p>
                            <p className="text-2xl font-semibold">{simulation.predictedRankBand}</p>
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500">Suma punktów zmian</p>
                            <p className="text-xl font-semibold">+{simulation.selectedImpact}</p>
                        </div>
                        <p className="text-xs text-zinc-500 leading-relaxed">
                            Symulator pokazuje kierunek i skalę poprawy. Realny wynik zależy od konkurencji, sezonowości i tempa indeksacji Google.
                        </p>
                    </div>
                </div>
            </section>

            {/* ─── Checklist ─── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-5">
                    <h2 className="text-lg font-semibold">Checklista SEO ({checklist.filter(i => i.done).length}/{checklist.length} ukończone)</h2>
                    <p className="text-xs text-zinc-500">Każdy punkt podłączony pod darmowe narzędzie</p>
                </div>
                <div className="space-y-3">
                    {checklist.map(item => (
                        <div key={item.id} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <input type="checkbox" checked={item.done} onChange={e => updateChecklistItem(item.id, { done: e.target.checked })} />
                                        <p className={`font-medium ${item.done ? 'line-through text-zinc-500' : ''}`}>{item.title}</p>
                                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">{item.category}</span>
                                        <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300">Effort {item.effort}</span>
                                        <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">Impact +{item.impactPoints}</span>
                                    </div>
                                    <p className="mt-2 text-xs text-zinc-500">{item.why}</p>
                                    <textarea value={item.note} onChange={e => updateChecklistItem(item.id, { note: e.target.value })}
                                        placeholder="Notatka operacyjna: co robimy, do kiedy, kto odpowiada"
                                        className="mt-3 min-h-[74px] w-full rounded-lg border border-zinc-700 bg-zinc-950 p-2 text-sm text-zinc-200 outline-none focus:border-emerald-500" />
                                </div>
                                <a href={item.toolUrl} target="_blank" rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 transition hover:border-zinc-500">
                                    <Wrench className="h-3.5 w-3.5" />
                                    {item.toolName}
                                    <ArrowUpRight className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ─── Tools + Analytics row ─── */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Connected Tools */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <h2 className="text-lg font-semibold mb-4">Podłączone narzędzia SEO ({data.tools.filter(t => t.connected).length}/{data.tools.length})</h2>
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {data.tools.map(tool => (
                            <div key={tool.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-black/30 p-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium truncate">{tool.name}</p>
                                        {tool.free && <span className="text-[10px] text-emerald-400 font-bold">FREE</span>}
                                    </div>
                                    <p className="text-xs text-zinc-500">{tool.source}</p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-xs font-semibold ${tool.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
                                        {tool.connected ? 'OK' : 'TODO'}
                                    </span>
                                    <a href={tool.setupUrl} target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Continuous Analytics */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <h2 className="text-lg font-semibold mb-4">Ciągła analityka SEO</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MiniBox label="Page views 30d" value={String(data.trend.currentPageViews)} />
                        <MiniBox label="Page views poprzednie 30d" value={String(data.trend.previousPageViews)} />
                        <MiniBox label="Organic 30d" value={String(data.trend.currentOrganicVisits)} />
                        <MiniBox label="Organic poprzednie 30d" value={String(data.trend.previousOrganicVisits)} />
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                        <Activity className="h-4 w-4 text-sky-400" />
                        <span className={trendClass(data.summary.trafficDeltaPercent)}>
                            Zmiana ruchu całkowitego: {data.summary.trafficDeltaPercent}%
                        </span>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-zinc-500 mb-2">Top landing pages (30 dni)</p>
                        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                            {data.trend.topOrganicLandingPages.map(item => (
                                <div key={item.page} className="flex items-center justify-between rounded border border-zinc-800 bg-black/25 px-3 py-2 text-sm">
                                    <span className="truncate pr-3">{item.page}</span>
                                    <span className="text-zinc-400">{item.views}</span>
                                </div>
                            ))}
                            {data.trend.topOrganicLandingPages.length === 0 && <p className="text-xs text-zinc-500">Brak danych.</p>}
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Competitor Audit + Roadmap ─── */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <h2 className="text-lg font-semibold mb-4">Analiza domen: dlaczego wyniki są słabe</h2>
                    <div className="space-y-4">
                        {data.competitorAudit.findings.map(site => (
                            <div key={site.domain} className="rounded-xl border border-zinc-800 bg-black/25 p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Globe className="h-4 w-4 text-sky-400" />
                                    <p className="font-medium">{site.domain}</p>
                                </div>
                                <p className="text-sm text-zinc-300">{site.verdict}</p>
                                <ul className="mt-3 space-y-1 text-xs text-zinc-500">
                                    {site.weaknesses.map(point => <li key={point}>— {point}</li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <h2 className="text-lg font-semibold mb-4">Plan profesjonalny 90 dni</h2>
                    <div className="space-y-4">
                        {data.roadmap90Days.map(phase => (
                            <div key={phase.phase} className="rounded-xl border border-zinc-800 bg-black/25 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium">{phase.phase}</p>
                                    <span className="text-xs text-emerald-400">{phase.goal}</span>
                                </div>
                                <ul className="mt-3 space-y-1 text-xs text-zinc-400">
                                    {phase.tasks.map(task => (
                                        <li key={task} className="flex items-start gap-2">
                                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500" />
                                            <span>{task}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/70 p-3 text-xs text-zinc-500">
                        <Bot className="inline mr-2 h-4 w-4 text-violet-400" />
                        Rytm: poniedziałek raport + backlog, wtorek/czwartek wdrożenia SEO, piątek walidacja i eksperymenty CTR.
                    </div>
                </div>
            </section>

            {/* ─── Free Tools Quick Reference ─── */}
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                <div className="flex items-center gap-3 mb-4">
                    <Send className="h-5 w-5 text-sky-400" />
                    <h2 className="text-lg font-semibold">Darmowe narzędzia SEO — szybki dostęp</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {FREE_TOOLS.map(tool => (
                        <a key={tool.name} href={tool.url} target="_blank" rel="noreferrer"
                            className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-black/25 p-4 transition hover:border-zinc-600 hover:bg-zinc-800/30">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{tool.name}</p>
                                <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{tool.desc}</p>
                            </div>
                            <ExternalLink className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                        </a>
                    ))}
                </div>
            </section>
        </div>
    );
}

/* ─── Free Tools List ─── */
const FREE_TOOLS = [
    { name: 'Google Search Console', url: 'https://search.google.com/search-console', desc: 'Raporty zapytań, CTR, indeksacja, problemy.' },
    { name: 'Google Analytics 4', url: 'https://analytics.google.com', desc: 'Ruch, konwersje, engagement, ścieżki.' },
    { name: 'PageSpeed Insights', url: 'https://pagespeed.web.dev/', desc: 'Core Web Vitals, audyt szybkości mobile.' },
    { name: 'Microsoft Clarity', url: 'https://clarity.microsoft.com', desc: 'Heatmapy, nagrania sesji, dead clicks.' },
    { name: 'Ubersuggest', url: 'https://neilpatel.com/ubersuggest/', desc: 'Analiza fraz, konkurencji, backlinków.' },
    { name: 'AnswerThePublic', url: 'https://answerthepublic.com/', desc: 'Pytania użytkowników i pomysły na content.' },
    { name: 'Google Trends', url: 'https://trends.google.pl/', desc: 'Sezonowość fraz i trending topics.' },
    { name: 'Ahrefs Webmaster Tools', url: 'https://ahrefs.com/webmaster-tools', desc: 'Darmowy audyt SEO i backlinki.' },
    { name: 'Bing Webmaster Tools', url: 'https://www.bing.com/webmasters/', desc: 'IndexNow, audyt, sitemap Bing.' },
    { name: 'Rich Results Test', url: 'https://search.google.com/test/rich-results', desc: 'Walidacja schema.org / JSON-LD.' },
    { name: 'Schema Validator', url: 'https://validator.schema.org/', desc: 'Sprawdzenie poprawności danych strukturalnych.' },
    { name: 'IndexNow', url: 'https://www.indexnow.org/', desc: 'Natychmiastowa notyfikacja do wyszukiwarek.' },
    { name: 'Screaming Frog (500 URL free)', url: 'https://www.screamingfrog.co.uk/seo-spider/', desc: 'Desktop crawler — meta, linki, duplikaty.' },
    { name: 'Looker Studio', url: 'https://lookerstudio.google.com', desc: 'Darmowe dashboardy SEO z GSC + GA4.' },
    { name: 'Canva (social graphics)', url: 'https://www.canva.com', desc: 'Grafiki do social media i Open Graph.' },
    { name: 'TinyPNG', url: 'https://tinypng.com/', desc: 'Kompresja obrazów — szybszy LCP.' },
];

/* ─── Components ─── */
function MetricCard({ icon, label, value, hint, hintClass }: { icon: ReactNode; label: string; value: string; hint: string; hintClass?: string }) {
    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">{label}</p>
                {icon}
            </div>
            <p className="mt-3 text-3xl font-semibold">{value}</p>
            <p className={`mt-2 text-xs ${hintClass || 'text-zinc-500'}`}>{hint}</p>
        </div>
    );
}

function MiniBox({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-lg border border-zinc-800 bg-black/25 p-3">
            <p className="text-[11px] uppercase tracking-[0.1em] text-zinc-500">{label}</p>
            <p className="mt-1 text-lg font-semibold">{value}</p>
        </div>
    );
}

function ScoreBox({ label, score }: { label: string; score: number }) {
    const color = score >= 90 ? 'text-emerald-400 border-emerald-500/40' : score >= 50 ? 'text-amber-400 border-amber-500/40' : 'text-rose-400 border-rose-500/40';
    return (
        <div className={`rounded-xl border bg-black/25 p-4 text-center ${color}`}>
            <p className="text-3xl font-bold">{score}</p>
            <p className="mt-1 text-xs text-zinc-400">{label}</p>
        </div>
    );
}
