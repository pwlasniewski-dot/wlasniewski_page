'use client';

/**
 * Admin Foto-Match: zgłoszenia użytkowników (FAKE / INAPPROPRIATE / HARASSMENT / SPAM / OTHER).
 */
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle2, X, Eye, Flag } from 'lucide-react';

type Report = {
    id: number;
    category: string;
    description: string | null;
    status: string;
    admin_note: string | null;
    created_at: string;
    resolved_at: string | null;
    reporter: { id: number; display_name: string; user: { email: string } };
    reported: { id: number; display_name: string; status: string; flagged_count: number; user: { email: string } };
};

const STATUS_OPTIONS = [
    { v: 'PENDING', label: 'Oczekujące' },
    { v: 'REVIEWING', label: 'W trakcie' },
    { v: 'RESOLVED', label: 'Rozwiązane' },
    { v: 'DISMISSED', label: 'Odrzucone' },
    { v: 'ALL', label: 'Wszystkie' },
];

const CATEGORY_LABEL: Record<string, string> = {
    FAKE: 'Fałszywy profil',
    INAPPROPRIATE: 'Nieodpowiednie treści',
    HARASSMENT: 'Nękanie',
    SPAM: 'Spam',
    OTHER: 'Inne',
};

function ReportsInner() {
    const router = useRouter();
    const sp = useSearchParams();
    const status = sp.get('status') || 'PENDING';

    const [reports, setReports] = useState<Report[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        setLoading(true);
        const r = await fetch(`/api/admin/foto-match/reports?status=${status}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
            const data = await r.json();
            setReports(data.reports || []);
            setCounts(data.counts || {});
        } else {
            setError('Błąd ładowania.');
        }
        setLoading(false);
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const setStatus = (v: string) => {
        const params = new URLSearchParams(sp.toString());
        if (v === 'ALL') params.delete('status'); else params.set('status', v);
        router.push(`/admin/foto-match/reports?${params.toString()}`);
    };

    const action = async (reportId: number, newStatus: 'REVIEWING' | 'RESOLVED' | 'DISMISSED') => {
        setBusyId(reportId);
        const token = localStorage.getItem('admin_token');
        const note = newStatus !== 'REVIEWING' ? prompt('Notatka admina (opcjonalna):') : null;
        const r = await fetch(`/api/admin/foto-match/reports/${reportId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus, admin_note: note || undefined }),
        });
        if (r.ok) {
            await load();
        } else {
            setError('Błąd akcji');
        }
        setBusyId(null);
    };

    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/foto-match" className="text-zinc-400 hover:text-amber-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Flag className="w-6 h-6 text-rose-400" /> Zgłoszenia użytkowników
                        </h1>
                        <p className="text-sm text-zinc-400">{loading ? 'Ładowanie…' : `${reports.length} zgłoszeń`}</p>
                    </div>
                </div>
                {counts.PENDING > 0 && (
                    <span className="px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm font-semibold">
                        {counts.PENDING} oczekuje na akcję
                    </span>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((o) => (
                    <button
                        key={o.v}
                        onClick={() => setStatus(o.v)}
                        className={`px-4 py-2 rounded-lg border text-sm transition ${status === o.v
                            ? 'bg-amber-500 border-amber-500 text-zinc-900 font-semibold'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-500/40'}`}
                    >
                        {o.label} {counts[o.v] != null && o.v !== 'ALL' && `(${counts[o.v]})`}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
            ) : reports.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    Brak zgłoszeń w stanie <strong>{status}</strong>.
                </div>
            ) : (
                <div className="grid gap-3">
                    {reports.map((r) => (
                        <div key={r.id} className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-xs uppercase font-bold px-2 py-1 rounded-full border bg-rose-500/10 text-rose-300 border-rose-500/30">
                                        {CATEGORY_LABEL[r.category] || r.category}
                                    </span>
                                    <span className="text-xs text-zinc-500">#{r.id} · {new Date(r.created_at).toLocaleString('pl-PL')}</span>
                                </div>
                                <span className={`text-xs uppercase font-bold px-2 py-1 rounded-full border ${
                                    r.status === 'PENDING' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                                    r.status === 'REVIEWING' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                                    r.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                                    'bg-zinc-700/40 text-zinc-400 border-zinc-700'
                                }`}>{r.status}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
                                    <p className="text-xs text-zinc-500 mb-1">Zgłaszający</p>
                                    <p className="text-zinc-200">{r.reporter.display_name}</p>
                                    <p className="text-xs text-zinc-500">{r.reporter.user.email}</p>
                                </div>
                                <div className="rounded-lg bg-rose-950/30 border border-rose-900/40 p-3">
                                    <p className="text-xs text-rose-400 mb-1 flex items-center gap-1">
                                        <Flag className="w-3 h-3" /> Zgłoszony
                                    </p>
                                    <Link href={`/admin/foto-match/profiles/${r.reported.id}`} className="text-amber-300 hover:underline font-medium">
                                        {r.reported.display_name}
                                    </Link>
                                    <p className="text-xs text-zinc-500">{r.reported.user.email} · {r.reported.status} · zgłoszeń: {r.reported.flagged_count}</p>
                                </div>
                            </div>

                            {r.description && (
                                <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3">
                                    <p className="text-xs text-zinc-500 mb-1">Opis</p>
                                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{r.description}</p>
                                </div>
                            )}

                            {r.admin_note && (
                                <div className="rounded-lg bg-amber-950/30 border border-amber-900/40 p-3">
                                    <p className="text-xs text-amber-400 mb-1">Notatka admina</p>
                                    <p className="text-sm text-zinc-300 whitespace-pre-wrap">{r.admin_note}</p>
                                </div>
                            )}

                            {r.status !== 'RESOLVED' && r.status !== 'DISMISSED' && (
                                <div className="flex flex-wrap gap-2">
                                    {r.status === 'PENDING' && (
                                        <button
                                            onClick={() => action(r.id, 'REVIEWING')}
                                            disabled={busyId === r.id}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm hover:bg-amber-500/30 disabled:opacity-40"
                                        >
                                            <Eye className="w-4 h-4" /> Weź na warsztat
                                        </button>
                                    )}
                                    <button
                                        onClick={() => action(r.id, 'RESOLVED')}
                                        disabled={busyId === r.id}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-900 font-semibold text-sm hover:bg-emerald-400 disabled:opacity-40"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Rozwiąż
                                    </button>
                                    <button
                                        onClick={() => action(r.id, 'DISMISSED')}
                                        disabled={busyId === r.id}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm hover:border-rose-500/40 disabled:opacity-40"
                                    >
                                        <X className="w-4 h-4" /> Odrzuć zgłoszenie
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>}>
            <ReportsInner />
        </Suspense>
    );
}
