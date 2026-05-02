'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Heart, Sparkles, Loader2, ArrowLeft, MapPin, Search, Filter } from 'lucide-react';

type Tab = 'sent' | 'received' | 'matches';

interface Item {
    id: number;
    display_name: string;
    city: string | null;
    birth_year: number | null;
    bio?: string | null;
    photos: { url: string }[];
    swiped_at?: string;
    matched_at?: string;
    action?: string;
}

function getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('user_token') || localStorage.getItem('client_token') || '';
}

const TAB_CONFIG: Record<Tab, { label: string; api: string; emptyTitle: string; emptyText: string }> = {
    sent: {
        label: 'Wysłane',
        api: '/api/foto-match/swipe?type=likes_sent',
        emptyTitle: 'Nie wysłałeś jeszcze żadnego polubienia',
        emptyText: 'Wejdź w „Odkryj" i kliknij ❤️ przy interesujących profilach.',
    },
    received: {
        label: 'Otrzymane',
        api: '/api/foto-match/swipe?type=likes_received',
        emptyTitle: 'Nikt Cię jeszcze nie polubił',
        emptyText: 'Uzupełnij profil i dodaj zdjęcia — to znacznie zwiększa szanse.',
    },
    matches: {
        label: 'Matche',
        api: '/api/foto-match/swipe?type=matches',
        emptyTitle: 'Brak wzajemnych dopasowań',
        emptyText: 'Match powstaje, gdy oboje się polubicie. Polub kogoś z „Otrzymanych" — może to już match!',
    },
};

export default function LikesClient() {
    const router = useRouter();
    const sp = useSearchParams();
    const initialTab = (sp.get('tab') as Tab) || 'sent';
    const [tab, setTab] = useState<Tab>(['sent', 'received', 'matches'].includes(initialTab) ? initialTab : 'sent');
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [cityFilter, setCityFilter] = useState<string>('');
    const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest');

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/logowanie?redirect=/foto-match/lajki';
            return;
        }
        setLoading(true);
        setError(null);
        fetch(TAB_CONFIG[tab].api, { headers: { Authorization: `Bearer ${token}` } })
            .then(async r => {
                const d = await r.json().catch(() => ({}));
                if (!r.ok) {
                    if (d.error === 'NO_FOTO_MATCH_PROFILE') {
                        window.location.href = '/foto-match/onboarding';
                        return;
                    }
                    setError(d.error || 'Błąd pobierania');
                    return;
                }
                setItems(d.likes || d.matches || []);
            })
            .catch(e => setError(String(e?.message || e)))
            .finally(() => setLoading(false));
    }, [tab]);

    function switchTab(t: Tab) {
        setTab(t);
        setQuery('');
        setCityFilter('');
        const url = new URL(window.location.href);
        url.searchParams.set('tab', t);
        router.replace(url.pathname + url.search, { scroll: false });
    }

    // Lista unikalnych miast do selecta
    const cities = Array.from(new Set(items.map(i => i.city).filter((c): c is string => !!c))).sort();

    // Filtrowanie + sortowanie po stronie klienta (lista <= 100 wpisów)
    const filtered = items
        .filter(it => !query || it.display_name.toLowerCase().includes(query.toLowerCase()))
        .filter(it => !cityFilter || it.city === cityFilter)
        .sort((a, b) => {
            if (sort === 'name') return a.display_name.localeCompare(b.display_name, 'pl');
            const dateA = new Date(a.matched_at || a.swiped_at || 0).getTime();
            const dateB = new Date(b.matched_at || b.swiped_at || 0).getTime();
            return sort === 'newest' ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 text-zinc-900">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-black mb-1 flex items-center gap-2 text-zinc-900">
                    <Heart className="w-7 h-7 text-rose-500" /> Twoje polubienia
                </h1>
                <p className="text-zinc-600 text-sm mb-6">Tutaj zobaczysz kogo zaprosiłeś na sesję, kto zaprosił Ciebie i z kim macie wzajemny match.</p>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white border border-zinc-200 rounded-2xl p-1.5 shadow-sm">
                    {(['sent', 'received', 'matches'] as Tab[]).map(t => (
                        <button
                            key={t}
                            onClick={() => switchTab(t)}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                                tab === t
                                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow'
                                    : 'text-zinc-500 hover:text-zinc-900'
                            }`}
                        >
                            {TAB_CONFIG[t].label}
                        </button>
                    ))}
                </div>

                {/* Filtry — widoczne tylko gdy są wyniki */}
                {!loading && !error && items.length > 0 && (
                    <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-3 mb-4 flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Szukaj po imieniu…"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:border-amber-500 outline-none"
                            />
                        </div>
                        <select
                            value={cityFilter}
                            onChange={e => setCityFilter(e.target.value)}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 outline-none"
                        >
                            <option value="">Wszystkie miasta</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value as any)}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:border-amber-500 outline-none"
                        >
                            <option value="newest">Najnowsze</option>
                            <option value="oldest">Najstarsze</option>
                            <option value="name">Alfabetycznie</option>
                        </select>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                    </div>
                ) : error ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
                        <p className="text-rose-700">{error}</p>
                    </div>
                ) : items.length === 0 ? (
                    <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-10 text-center">
                        <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                        <p className="text-lg font-bold mb-2 text-zinc-900">{TAB_CONFIG[tab].emptyTitle}</p>
                        <p className="text-zinc-600 text-sm mb-5">{TAB_CONFIG[tab].emptyText}</p>
                        <Link
                            href="/foto-match/odkryj"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-amber-500 px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:scale-[1.02] transition-transform"
                        >
                            <Sparkles className="w-4 h-4" /> Idź do Odkryj
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {filtered.map(it => {
                            const photo = it.photos?.[0]?.url;
                            const age = it.birth_year ? new Date().getFullYear() - it.birth_year : null;
                            const href = tab === 'matches'
                                ? `/foto-match/wiadomosci/${it.id}`
                                : `/foto-match/u/${it.id}`;
                            return (
                                <Link
                                    key={it.id}
                                    href={href}
                                    className="group relative bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden hover:shadow-lg hover:border-amber-300 transition"
                                >
                                    <div className="aspect-[3/4] bg-zinc-100 relative">
                                        {photo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photo} alt={it.display_name} loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-4xl">📸</div>
                                        )}
                                        {tab === 'matches' && (
                                            <div className="absolute top-2 right-2 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                                                💬 NAPISZ
                                            </div>
                                        )}
                                        {tab === 'received' && (
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow animate-pulse">
                                                ❤ ZAPROSIŁ CIĘ
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="font-bold truncate text-sm text-zinc-900">
                                            {it.display_name}{age ? `, ${age}` : ''}
                                        </p>
                                        {it.city && (
                                            <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" /> {it.city}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
