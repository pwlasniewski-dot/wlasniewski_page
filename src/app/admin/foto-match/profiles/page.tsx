'use client';

/**
 * Admin Foto-Match: lista profili z filtrami.
 * URL params: ?status=PENDING|ACTIVE|SUSPENDED|REJECTED|ALL  &q=...  &flagged=true  &city=...
 */
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, ChevronRight, Phone, ShieldCheck, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../_components/StatusBadge';

type Profile = {
    id: number;
    display_name: string;
    status: string;
    city: string;
    birth_year: number;
    gender: string;
    flagged_count: number;
    phone: string | null;
    phone_verified_at: string | null;
    age_declared_at: string | null;
    selfie_url: string | null;
    verified_at: string | null;
    created_at: string;
    user: { id: number; email: string; name: string | null };
    photos: Array<{ id: number; url: string; ai_status: string; position: number }>;
};

const STATUS_OPTIONS = [
    { v: 'ALL', label: 'Wszystkie' },
    { v: 'PENDING', label: 'Oczekujące' },
    { v: 'ACTIVE', label: 'Aktywne' },
    { v: 'SUSPENDED', label: 'Zawieszone' },
    { v: 'REJECTED', label: 'Odrzucone' },
];

function ProfilesListInner() {
    const router = useRouter();
    const sp = useSearchParams();
    const status = sp.get('status') || 'ALL';
    const flagged = sp.get('flagged') === 'true';
    const initialQ = sp.get('q') || '';
    const initialCity = sp.get('city') || '';

    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState(initialQ);
    const [city, setCity] = useState(initialCity);

    const load = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        setLoading(true);
        const params = new URLSearchParams();
        if (status && status !== 'ALL') params.set('status', status);
        if (flagged) params.set('flagged', 'true');
        if (q.trim()) params.set('q', q.trim());
        if (city.trim()) params.set('city', city.trim());
        const r = await fetch(`/api/admin/foto-match/profiles?${params.toString()}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
            const data = await r.json();
            setProfiles(data.profiles || []);
            setTotal(data.total || 0);
        }
        setLoading(false);
    }, [status, flagged, q, city]);

    useEffect(() => { load(); }, [load]);

    const setStatusParam = (v: string) => {
        const params = new URLSearchParams(sp.toString());
        if (v === 'ALL') params.delete('status'); else params.set('status', v);
        router.push(`/admin/foto-match/profiles?${params.toString()}`);
    };

    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Profile Foto-Match</h1>
                    <p className="text-sm text-zinc-400">{loading ? 'Ładowanie…' : `${total} profili`}</p>
                </div>
                <Link href="/admin/foto-match" className="text-sm text-amber-400 hover:underline">← Panel programu</Link>
            </div>

            {/* Filtry status */}
            <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((o) => (
                    <button
                        key={o.v}
                        onClick={() => setStatusParam(o.v)}
                        className={`px-4 py-2 rounded-lg border text-sm transition ${status === o.v
                            ? 'bg-amber-500 border-amber-500 text-zinc-900 font-semibold'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-500/40'}`}
                    >
                        {o.label}
                    </button>
                ))}
                <button
                    onClick={() => {
                        const params = new URLSearchParams(sp.toString());
                        if (flagged) params.delete('flagged'); else params.set('flagged', 'true');
                        router.push(`/admin/foto-match/profiles?${params.toString()}`);
                    }}
                    className={`px-4 py-2 rounded-lg border text-sm transition flex items-center gap-2 ${flagged
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-rose-500/40'}`}
                >
                    <AlertTriangle className="w-4 h-4" /> Oflagowane
                </button>
            </div>

            {/* Search */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Szukaj: nick, email, imię…"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                </div>
                <input
                    type="text"
                    placeholder="Miasto"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') load(); }}
                    className="w-40 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500"
                />
                <button
                    onClick={load}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold text-sm"
                >
                    Filtruj
                </button>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                </div>
            ) : profiles.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    Brak profili spełniających kryteria.
                </div>
            ) : (
                <div className="grid gap-3">
                    {profiles.map((p) => {
                        const mainPhoto = p.photos.find((ph) => ph.position === 0) || p.photos[0];
                        const age = new Date().getFullYear() - p.birth_year;
                        const flaggedPhotos = p.photos.filter((ph) => ph.ai_status === 'FLAGGED').length;
                        return (
                            <Link
                                key={p.id}
                                href={`/admin/foto-match/profiles/${p.id}`}
                                className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 transition"
                            >
                                <div className="w-16 h-16 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                                    {mainPhoto ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={mainPhoto.url} alt={p.display_name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">brak</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-semibold text-white truncate">{p.display_name}</h3>
                                        <StatusBadge status={p.status} />
                                        {p.phone_verified_at && (
                                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-full border bg-emerald-500/10 text-emerald-300 border-emerald-500/30">
                                                <Phone className="w-3 h-3" /> Telefon OK
                                            </span>
                                        )}
                                        {p.verified_at && (
                                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-full border bg-amber-500/10 text-amber-300 border-amber-500/30">
                                                <ShieldCheck className="w-3 h-3" /> Zweryfikowany
                                            </span>
                                        )}
                                        {(p.flagged_count > 0 || flaggedPhotos > 0) && (
                                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded-full border bg-rose-500/10 text-rose-300 border-rose-500/30">
                                                <AlertTriangle className="w-3 h-3" /> {p.flagged_count + flaggedPhotos}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-400 truncate">
                                        {age} lat · {p.gender} · {p.city} · {p.user.email}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Dodany: {new Date(p.created_at).toLocaleString('pl-PL')} · zdjęć: {p.photos.length}
                                    </p>
                                </div>
                                <ChevronRight className="w-5 h-5 text-zinc-600 shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ProfilesListPage() {
    return (
        <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>}>
            <ProfilesListInner />
        </Suspense>
    );
}
