'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, ShieldCheck, Camera, X, Calendar, Info } from 'lucide-react';

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
    const [matchToast, setMatchToast] = useState<{ name: string; partnerId: number } | null>(null);
    const [sentToast, setSentToast] = useState<string | null>(null);

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
                const errMap: Record<string, string> = {
                    BLOCKED: 'Ta osoba jest niedostępna',
                    TARGET_NOT_AVAILABLE: 'Profil chwilowo niedostępny',
                    RATE_LIMITED: 'Zbyt wiele akcji — poczekaj chwilę',
                    NO_TOKEN: 'Sesja wygasła — zaloguj się ponownie',
                    PROFILE_NOT_ACTIVE: 'Twój profil czeka na weryfikację',
                };
                setError(errMap[d.error] || d.error || 'Błąd akcji');
                return;
            }
            if (d.is_match) {
                setMatchToast({ name: d.target?.display_name || name, partnerId: targetId });
                setTimeout(() => setMatchToast(null), 8000);
            } else if (action === 'LIKE') {
                setSentToast(`Zaproszenie wysłane do ${name}. Czekamy aż ona też kliknie ❤`);
                setTimeout(() => setSentToast(null), 5000);
            }
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
            <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center text-zinc-700">
                <p className="text-lg animate-pulse">Wczytywanie dopasowań…</p>
            </main>
        );
    }

    if (error && !candidates.length) {
        return (
            <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center p-6">
                <div className="bg-white border border-zinc-200 shadow-lg rounded-2xl p-8 max-w-md text-center">
                    <p className="text-lg font-bold mb-2 text-zinc-900">Hej!</p>
                    <p className="text-zinc-600">{error}</p>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 text-zinc-900">
            {matchToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl z-50 flex items-center gap-3">
                    <span>💖 To match z {matchToast.name}!</span>
                    <Link
                        href={`/foto-match/wiadomosci/${matchToast.partnerId}`}
                        className="bg-white text-rose-600 px-3 py-1.5 rounded-full text-sm hover:scale-105 transition-transform"
                    >
                        Napisz →
                    </Link>
                </div>
            )}
            {sentToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-xl z-50">
                    ✓ {sentToast}
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900">Odkryj osoby do wspólnej sesji</h1>
                    <p className="text-zinc-600 mt-2 max-w-3xl">
                        Te osoby pasują do Twoich kryteriów. Wybierz kogoś i wyślij zaproszenie na wspólną sesję fotograficzną.
                    </p>
                    <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 flex gap-3">
                        <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <p>
                            <strong>Jak to działa:</strong> klikasz <span className="font-bold text-rose-700">„Zaproś na sesję"</span> przy osobie, która Cię zainteresowała. Jeśli ona też kliknie Ciebie — powstaje <strong>match</strong> i możecie napisać do siebie, żeby ustalić termin sesji z Przemkiem.
                        </p>
                    </div>
                </div>

                {candidates.length === 0 ? (
                    <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-10 text-center">
                        <p className="text-xl font-bold mb-2 text-zinc-900">Brak nowych dopasowań</p>
                        <p className="text-zinc-600 mb-5">Sprawdź ponownie później — codziennie dochodzą nowi uczestnicy.</p>
                        <Link href="/foto-match/lajki" className="inline-flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800">
                            Zobacz swoje polubienia
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {candidates.map((c) => (
                            <article key={c.id} className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow flex flex-col">
                                <Link href={`/foto-match/u/${c.id}`} className="block">
                                    <div className="aspect-[3/4] bg-zinc-100 relative overflow-hidden">
                                        {c.photos[0] ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={c.photos[0].url} alt={c.display_name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-6xl">📸</div>
                                        )}
                                        {c.verified && (
                                            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
                                                <ShieldCheck className="w-3 h-3" /> Zweryfikowany
                                            </div>
                                        )}
                                        {c.distance_km != null && (
                                            <div className="absolute top-3 left-3 bg-white/95 text-zinc-800 text-xs font-bold px-2.5 py-1 rounded-full shadow">
                                                {c.distance_km} km
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h2 className="text-xl font-extrabold text-zinc-900">
                                        {c.display_name}{c.age ? `, ${c.age}` : ''}
                                    </h2>
                                    {c.city && (
                                        <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5 mb-3">
                                            <MapPin className="w-4 h-4" /> {c.city}
                                        </p>
                                    )}
                                    {c.bio && <p className="text-sm text-zinc-700 line-clamp-3 mb-3">{c.bio}</p>}
                                    {c.interests.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {c.interests.slice(0, 4).map((i, ix) => (
                                                <span key={ix} className="text-xs bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">{i}</span>
                                            ))}
                                        </div>
                                    )}
                                    {c.photos.length > 1 && (
                                        <p className="text-xs text-zinc-500 inline-flex items-center gap-1 mb-4">
                                            <Camera className="w-3 h-3" /> {c.photos.length} zdjęć
                                        </p>
                                    )}

                                    <div className="mt-auto space-y-2">
                                        <button
                                            disabled={actionId === c.id}
                                            onClick={() => swipe(c.id, 'LIKE', c.display_name)}
                                            className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 font-bold text-base shadow-lg disabled:opacity-50 transition-all hover:scale-[1.01]"
                                        >
                                            <Calendar className="w-5 h-5" />
                                            Zaproś na sesję
                                        </button>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/foto-match/u/${c.id}`}
                                                className="flex-1 text-center bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-xl py-2 text-sm font-semibold transition"
                                            >
                                                Zobacz profil
                                            </Link>
                                            <button
                                                disabled={actionId === c.id}
                                                onClick={() => swipe(c.id, 'SKIP', c.display_name)}
                                                className="px-4 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-500 rounded-xl flex items-center justify-center gap-1 text-sm font-semibold disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" /> Pomiń
                                            </button>
                                        </div>
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
