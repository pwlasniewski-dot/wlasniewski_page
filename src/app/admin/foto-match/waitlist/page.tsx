'use client';

/**
 * Admin Foto-Match: waitlist (zapisy przed startem programu).
 * Korzysta z istniejącego API: GET /api/foto-match/waitlist/admin
 */
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, Mail, ArrowLeft, Download, CheckCircle2, AlertTriangle } from 'lucide-react';

type Item = {
    id: number;
    email: string;
    city: string | null;
    role: string | null;
    age_range: string | null;
    source: string | null;
    marketing_opt_in: boolean;
    confirmed_at: string | null;
    unsubscribed_at: string | null;
    created_at: string;
};

type Stats = {
    total: number;
    confirmed: number;
    unconfirmed: number;
    conversion_pct: number;
    by_city: Array<{ city: string; count: number }>;
    by_role: Array<{ role: string; count: number }>;
};

export default function WaitlistPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'confirmed' | 'unconfirmed'>('all');

    const load = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams({ limit: '500' });
        if (filter === 'confirmed') params.set('confirmed', 'true');
        if (filter === 'unconfirmed') params.set('confirmed', 'false');
        const r = await fetch(`/api/foto-match/waitlist/admin?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await r.json();
        if (!r.ok || !data.success) {
            setError(data.message || 'Błąd ładowania waitlisty.');
        } else {
            setItems(data.items || []);
            setStats(data.stats || null);
        }
        setLoading(false);
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    const exportCsv = () => {
        const header = 'email,city,role,age_range,source,marketing,confirmed_at,created_at\n';
        const rows = items.map((i) =>
            [i.email, i.city || '', i.role || '', i.age_range || '', i.source || '',
            i.marketing_opt_in ? '1' : '0', i.confirmed_at || '', i.created_at].join(',')
        ).join('\n');
        const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `foto-match-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/foto-match" className="text-zinc-400 hover:text-amber-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Waitlist Foto-Match</h1>
                        <p className="text-sm text-zinc-400">Zapisy oczekujące na uruchomienie programu</p>
                    </div>
                </div>
                <button
                    onClick={exportCsv}
                    disabled={items.length === 0}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm hover:border-amber-500/40 disabled:opacity-40"
                >
                    <Download className="w-4 h-4" /> Eksportuj CSV
                </button>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Stat label="Łącznie" value={stats.total} />
                    <Stat label="Potwierdzone" value={stats.confirmed} />
                    <Stat label="Niepotwierdzone" value={stats.unconfirmed} />
                    <Stat label="Konwersja" value={`${stats.conversion_pct}%`} />
                </div>
            )}

            <div className="flex gap-2">
                {(['all', 'confirmed', 'unconfirmed'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg border text-sm ${filter === f
                            ? 'bg-amber-500 border-amber-500 text-zinc-900 font-semibold'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300'}`}
                    >
                        {f === 'all' ? 'Wszystkie' : f === 'confirmed' ? 'Potwierdzone' : 'Niepotwierdzone'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
            ) : items.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    Brak zapisów.
                </div>
            ) : (
                <div className="rounded-xl border border-zinc-800 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-zinc-900 text-zinc-400 text-xs uppercase">
                            <tr>
                                <th className="text-left px-3 py-2">Email</th>
                                <th className="text-left px-3 py-2">Miasto</th>
                                <th className="text-left px-3 py-2">Rola</th>
                                <th className="text-left px-3 py-2">Wiek</th>
                                <th className="text-left px-3 py-2">Marketing</th>
                                <th className="text-left px-3 py-2">Potwierdzony</th>
                                <th className="text-left px-3 py-2">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {items.map((i) => (
                                <tr key={i.id} className="hover:bg-zinc-900/50">
                                    <td className="px-3 py-2 text-zinc-200 flex items-center gap-1.5">
                                        <Mail className="w-3 h-3 text-zinc-500" /> {i.email}
                                    </td>
                                    <td className="px-3 py-2 text-zinc-300">{i.city || '—'}</td>
                                    <td className="px-3 py-2 text-zinc-300">{i.role || '—'}</td>
                                    <td className="px-3 py-2 text-zinc-300">{i.age_range || '—'}</td>
                                    <td className="px-3 py-2">{i.marketing_opt_in ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-zinc-600">—</span>}</td>
                                    <td className="px-3 py-2">{i.confirmed_at ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-zinc-600">—</span>}</td>
                                    <td className="px-3 py-2 text-zinc-500 text-xs">{new Date(i.created_at).toLocaleDateString('pl-PL')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
    );
}
