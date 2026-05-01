'use client';

import { useEffect, useState } from 'react';
import { MapPin, Heart, ShieldCheck, Camera, X } from 'lucide-react';

interface Candidate {
    id: number;
    display_name: string;
    age: number | null;
    gender: string | null;
    city: string | null;
    bio: string | null;
    interests: string[];
    experience: string | null;
    comfort_level: string | null;
    verified: boolean;
    photos: { id: number; url: string; position: number }[];
    distance_km?: number | null;
}

export default function DiscoverClient() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [actionId, setActionId] = useState<number | null>(null);
    const [matchToast, setMatchToast] = useState<string | null>(null);

    function getToken() {
        return typeof window !== 'undefined'
            ? (localStorage.getItem('user_token') || localStorage.getItem('client_token'))
            : null;
    }

    async function swipe(targetId: number, action: 'LIKE' | 'SKIP', name: string) {
        if (actionId) return;
        setActionId(targetId);
        try {
            const r = await fetch('/api/foto-match/swipe', {
                method: 'POST',
                headers: { 'content-type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ to_profile_id: targetId, action }),
            });
            const d = await r.json();
            if (!r.ok) {
                setError(d.error || 'Błąd akcji');
                return;
            }
            if (d.is_match) {
                setMatchToast(`💖 To match z ${d.target?.display_name || name}!`);
                setTimeout(() => setMatchToast(null), 4000);
            }
            // Niezależnie od wyniku usuwamy kandydata z listy.
            setCandidates(prev => prev.filter(c => c.id !== targetId));
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setActionId(null);
        }
    }

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/logowanie?redirect=/foto-match/odkryj';
            return;
        }
        fetch('/api/foto-match/discover?limit=24', {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(async (r) => {
                const data = await r.json().catch(() => ({}));
                if (!r.ok) {
                    if (data?.error === 'PROFILE_NOT_ACTIVE') {
                        setError('Twój profil nie został jeszcze zaakceptowany. Czekaj na weryfikację.');
                    } else if (data?.error === 'NO_FOTO_MATCH_PROFILE') {
                        window.location.href = '/foto-match/onboarding';
                        return;
                    } else {
                        setError(data?.error || 'Błąd ładowania kandydatów');
                    }
                    return;
                }
                setCandidates(data.candidates || []);
            })
            .catch((e) => setError(String(e?.message || e)))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white">
                <p className="text-lg animate-pulse">Wczytywanie dopasowań…</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 flex items-center justify-center text-white p-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 max-w-md text-center">
                    <p className="text-lg font-bold mb-2">Hej!</p>
                    <p className="text-white/90">{error}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-indigo-700 text-white">
            {matchToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-50 animate-bounce">
                    {matchToast}
                </div>
            )}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black">Odkryj</h1>
                        <p className="text-white/85 mt-2">Osoby dopasowane na podstawie kryteriów ustawionych przez fotografa.</p>
                    </div>
                    <a href="/foto-match/zapros" className="bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 rounded-full px-5 py-2 text-sm font-semibold">
                        💌 Polec znajomych
                    </a>
                </div>

                {candidates.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 text-center">
                        <p className="text-xl font-bold mb-2">Brak nowych dopasowań</p>
                        <p className="text-white/80">Sprawdź ponownie później — codziennie dochodzą nowi uczestnicy.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {candidates.map((c) => (
                            <article key={c.id} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-xl flex flex-col">
                                <a href={`/foto-match/u/${c.id}`} className="block">
                                    <div className="aspect-[3/4] bg-zinc-800 relative overflow-hidden">
                                        {c.photos[0] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={c.photos[0].url} alt={c.display_name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl">📸</div>
                                        )}
                                        {c.verified && (
                                            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" /> Zweryfikowany
                                            </div>
                                        )}
                                        {c.distance_km != null && (
                                            <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full">
                                                {c.distance_km} km
                                            </div>
                                        )}
                                    </div>
                                </a>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-xl font-extrabold">
                                            {c.display_name}{c.age ? `, ${c.age}` : ''}
                                        </h2>
                                    </div>
                                    {c.city && (
                                        <p className="text-sm text-white/80 flex items-center gap-1 mb-3">
                                            <MapPin className="w-4 h-4" /> {c.city}
                                        </p>
                                    )}
                                    {c.bio && <p className="text-sm text-white/85 line-clamp-3 mb-3">{c.bio}</p>}
                                    {c.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {c.interests.slice(0, 4).map((i, ix) => (
                                                <span key={ix} className="text-xs bg-white/15 px-2 py-0.5 rounded-full">{i}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2 text-xs text-white/70 mb-4">
                                        {c.photos.length > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Camera className="w-3 h-3" /> {c.photos.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-auto flex gap-2">
                                        <button
                                            disabled={actionId === c.id}
                                            onClick={() => swipe(c.id, 'SKIP', c.display_name)}
                                            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl py-2.5 flex items-center justify-center gap-1 font-semibold disabled:opacity-50"
                                        >
                                            <X className="w-4 h-4" /> Pomiń
                                        </button>
                                        <button
                                            disabled={actionId === c.id}
                                            onClick={() => swipe(c.id, 'LIKE', c.display_name)}
                                            className="flex-1 bg-gradient-to-r from-rose-500 to-amber-500 hover:scale-[1.02] rounded-xl py-2.5 flex items-center justify-center gap-1 font-bold disabled:opacity-50 transition-transform"
                                        >
                                            <Heart className="w-4 h-4" /> Polub
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
