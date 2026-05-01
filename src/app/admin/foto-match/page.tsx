'use client';

/**
 * Foto-Match: admin dashboard.
 * Liczniki + toggle programu + szybkie linki + ostatnie profile.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Sparkles, Users, Image as ImageIcon, ShieldCheck, Mail, Power,
    Loader2, Clock, AlertTriangle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { StatusBadge } from './_components/StatusBadge';

type Stats = {
    counts: {
        pending: number;
        active: number;
        suspended: number;
        rejected: number;
        flaggedPhotos: number;
        waitlist: number;
        pendingReports?: number;
    };
    enabled: boolean;
    recentProfiles: Array<{
        id: number;
        display_name: string;
        status: string;
        city: string;
        created_at: string;
        user: { email: string; name: string | null };
    }>;
};

export default function FotoMatchDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);

    const load = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        const r = await fetch('/api/admin/foto-match/stats', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) setStats(await r.json());
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const toggleProgram = async () => {
        if (!stats) return;
        if (!confirm(stats.enabled
            ? 'Wyłączyć Foto-Match? Klienci nie będą mogli dołączać do programu.'
            : 'Włączyć Foto-Match? Klienci z konta CRM będą mogli się zapisywać.')) return;
        setToggling(true);
        const token = localStorage.getItem('admin_token');
        const r = await fetch('/api/admin/foto-match/settings', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ enabled: !stats.enabled }),
        });
        if (r.ok) {
            await load();
        }
        setToggling(false);
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-gold-500" />
            </div>
        );
    }
    if (!stats) {
        return <div className="p-8 text-red-400">Błąd ładowania statystyk.</div>;
    }

    const c = stats.counts;

    return (
        <div className="p-6 sm:p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                        <Sparkles className="w-4 h-4" /> Foto-Match
                    </div>
                    <h1 className="text-2xl font-bold text-white">Panel programu</h1>
                </div>

                {/* Toggle programu */}
                <button
                    onClick={toggleProgram}
                    disabled={toggling}
                    className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold transition ${stats.enabled
                        ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20'
                        : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-amber-500'
                        }`}
                >
                    {toggling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                    {stats.enabled ? 'Program: AKTYWNY' : 'Program: WYŁĄCZONY'}
                </button>
            </div>

            {!stats.enabled && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-200 text-sm">
                    Program jest wyłączony — nowi klienci nie zobaczą CTA w `/konto` ani nie przejdą onboardingu.
                    Istniejące profile pozostają widoczne i edytowalne.
                </div>
            )}

            {/* Statystyki */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                <StatCard label="Oczekujące" value={c.pending} icon={<Clock />} color="amber" href="/admin/foto-match/profiles?status=PENDING" />
                <StatCard label="Aktywne" value={c.active} icon={<CheckCircle2 />} color="emerald" href="/admin/foto-match/profiles?status=ACTIVE" />
                <StatCard label="Zawieszone" value={c.suspended} icon={<ShieldCheck />} color="rose" href="/admin/foto-match/profiles?status=SUSPENDED" />
                <StatCard label="Odrzucone" value={c.rejected} icon={<AlertTriangle />} color="zinc" href="/admin/foto-match/profiles?status=REJECTED" />
                <StatCard label="Zdjęcia FLAGGED" value={c.flaggedPhotos} icon={<ImageIcon />} color="rose" href="/admin/foto-match/photos" />
                <StatCard label="Zgłoszenia" value={c.pendingReports ?? 0} icon={<AlertTriangle />} color="rose" href="/admin/foto-match/reports?status=PENDING" />
                <StatCard label="Waitlist" value={c.waitlist} icon={<Mail />} color="blue" href="/admin/foto-match/waitlist" />
            </div>

            {/* Ostatnie profile */}
            <div>
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-gold-500" /> Ostatnio dołączeni
                </h2>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
                    {stats.recentProfiles.length === 0 && (
                        <div className="p-6 text-zinc-500 text-sm">Brak profili.</div>
                    )}
                    {stats.recentProfiles.map((p) => (
                        <Link
                            key={p.id}
                            href={`/admin/foto-match/profiles/${p.id}`}
                            className="flex items-center justify-between p-4 border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition"
                        >
                            <div>
                                <p className="font-semibold text-white">{p.display_name}</p>
                                <p className="text-xs text-zinc-500">{p.user.email} · {p.city}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={p.status} />
                                <ChevronRight className="w-4 h-4 text-zinc-600" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color, href }: { label: string; value: number; icon: React.ReactNode; color: string; href: string }) {
    const colorMap: Record<string, string> = {
        amber: 'border-amber-500/30 hover:border-amber-400 text-amber-400',
        emerald: 'border-emerald-500/30 hover:border-emerald-400 text-emerald-400',
        rose: 'border-rose-500/30 hover:border-rose-400 text-rose-400',
        zinc: 'border-zinc-700 hover:border-zinc-500 text-zinc-400',
        blue: 'border-blue-500/30 hover:border-blue-400 text-blue-400',
    };
    return (
        <Link href={href} className={`block rounded-xl border bg-zinc-900/40 p-4 transition ${colorMap[color]}`}>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide mb-2">
                {icon} {label}
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
        </Link>
    );
}
