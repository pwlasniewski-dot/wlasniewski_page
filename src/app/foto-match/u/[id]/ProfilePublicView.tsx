'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, X, Star, Sparkles, MapPin, Loader2, ShieldCheck, Clock, ArrowLeft, Flag, Ban } from 'lucide-react';

type Photo = { id: number; url: string };
type Profile = {
    id: number;
    display_name: string;
    age: number;
    gender: string;
    city: string;
    bio: string | null;
    interests: string[];
    experience: string | null;
    comfort_level: string | null;
    verified: boolean;
    last_active: string | null;
    photos: Photo[];
};
type Relation = { is_self: boolean; i_liked: boolean; they_liked: boolean; is_match: boolean };

function getToken() {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('user_token') || '';
}

export default function ProfilePublicView({ id }: { id: string }) {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [relation, setRelation] = useState<Relation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activePhoto, setActivePhoto] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);
    const [matchToast, setMatchToast] = useState<string | null>(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/logowanie?next=' + encodeURIComponent(`/foto-match/u/${id}`);
            return;
        }
        fetch(`/api/foto-match/profile/${id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(async r => {
                const d = await r.json();
                if (!r.ok) {
                    if (d.error === 'NO_FOTO_MATCH_PROFILE') {
                        window.location.href = '/foto-match/onboarding';
                        return;
                    }
                    setError(d.error || 'Błąd');
                    return;
                }
                setProfile(d.profile);
                setRelation(d.relation);
            })
            .catch(e => setError(String(e?.message || e)))
            .finally(() => setLoading(false));
    }, [id]);

    async function swipe(action: 'LIKE' | 'SKIP' | 'SUPER_LIKE') {
        if (!profile || actionLoading) return;
        setActionLoading(true);
        try {
            const r = await fetch('/api/foto-match/swipe', {
                method: 'POST',
                headers: { 'content-type': 'application/json', Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ to_profile_id: profile.id, action }),
            });
            const d = await r.json();
            if (!r.ok) {
                setError(d.error || 'Błąd');
                return;
            }
            if (d.is_match) {
                setMatchToast(`To match z ${d.target?.display_name || profile.display_name}!`);
                setRelation(prev => prev ? { ...prev, i_liked: true, is_match: true } : prev);
            } else if (action === 'LIKE' || action === 'SUPER_LIKE') {
                setRelation(prev => prev ? { ...prev, i_liked: true } : prev);
            } else {
                // SKIP — wracamy do listy
                window.location.href = '/foto-match/odkryj';
            }
        } catch (e: any) {
            setError(e?.message || String(e));
        } finally {
            setActionLoading(false);
        }
    }

    async function blockProfile() {
        if (!profile || !confirm(`Zablokować ${profile.display_name}? Nie zobaczycie się więcej w odkrywaniu.`)) return;
        const r = await fetch('/api/foto-match/block', {
            method: 'POST',
            headers: { 'content-type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ profile_id: profile.id }),
        });
        if (r.ok) window.location.href = '/foto-match/odkryj';
        else { const d = await r.json(); setError(d.error || 'Błąd blokady'); }
    }

    async function reportProfile() {
        if (!profile) return;
        const category = prompt('Powod zgłoszenia (FAKE / INAPPROPRIATE / HARASSMENT / SPAM / OTHER):', 'INAPPROPRIATE');
        if (!category) return;
        const description = prompt('Opisz problem (opcjonalnie, max 2000 znaków):') || '';
        const r = await fetch('/api/foto-match/report', {
            method: 'POST',
            headers: { 'content-type': 'application/json', Authorization: `Bearer ${getToken()}` },
            body: JSON.stringify({ reported_profile_id: profile.id, category: category.toUpperCase(), description }),
        });
        const d = await r.json();
        if (r.ok) alert('Zgłoszenie wysłane. Moderacja zajmie się sprawą.');
        else setError(d.error || 'Błąd zgłoszenia');
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-amber-50 text-zinc-600"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }
    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 text-zinc-900 p-6">
                <p className="text-rose-700 mb-4">{error || 'Profil niedostępny'}</p>
                <Link href="/foto-match/odkryj" className="text-rose-600 underline">← Wróć do listy</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50 text-zinc-900 pb-12">
            {matchToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-4 rounded-2xl font-bold shadow-2xl z-50 flex items-center gap-3">
                    <span>💖 {matchToast}</span>
                    {relation?.is_match && (
                        <Link href={`/foto-match/wiadomosci/${profile.id}`} className="bg-white text-rose-600 px-3 py-1.5 rounded-full text-sm hover:scale-105 transition-transform">
                            Napisz →
                        </Link>
                    )}
                </div>
            )}

            <div className="max-w-3xl mx-auto px-4 pt-6">
                <Link href="/foto-match/odkryj" className="text-zinc-500 hover:text-zinc-900 inline-flex items-center gap-1 text-sm mb-4">
                    <ArrowLeft className="w-4 h-4" /> Lista kandydatów
                </Link>

                {/* Galeria */}
                <div className="relative bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-lg">
                    {profile.photos.length > 0 ? (
                        <>
                            <div className="aspect-[3/4] bg-zinc-100 relative">
                                <img
                                    src={profile.photos[activePhoto]?.url}
                                    alt={profile.display_name}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                />
                                {profile.verified && (
                                    <div className="absolute top-4 right-4 bg-emerald-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <ShieldCheck className="w-3.5 h-3.5" /> Zweryfikowany
                                    </div>
                                )}
                            </div>
                            {profile.photos.length > 1 && (
                                <div className="flex gap-2 p-3 overflow-x-auto">
                                    {profile.photos.map((p, i) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setActivePhoto(i)}
                                            className={`flex-none w-16 h-20 rounded-lg overflow-hidden border-2 ${i === activePhoto ? 'border-amber-500' : 'border-zinc-200'}`}
                                        >
                                            <img src={p.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="aspect-[3/4] flex items-center justify-center text-zinc-600">Brak zdjęć</div>
                    )}
                </div>

                {/* Pasek akcji \u2014 PROMINENT, zaraz pod galeri\u0105 */}
                {!relation?.is_self && (
                    <div className="mt-5">
                        {relation?.is_match ? (
                            <Link
                                href={`/foto-match/wiadomosci/${profile.id}`}
                                className="block w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:scale-[1.01] text-white text-center px-6 py-5 rounded-2xl font-bold text-lg shadow-2xl transition-transform"
                            >
                                💬 Napisz wiadomość
                            </Link>
                        ) : relation?.i_liked ? (
                            <div className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-5 text-center">
                                <p className="text-emerald-700 font-semibold">✓ Zaproszenie wysłane — czekamy aż ona też kliknie ❤</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <button
                                    disabled={actionLoading}
                                    onClick={() => swipe('LIKE')}
                                    className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-2xl py-5 px-6 flex items-center justify-center gap-2 font-bold text-lg shadow-lg disabled:opacity-50 transition"
                                >
                                    <Heart className="w-5 h-5" /> Zaproś na sesję
                                </button>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => swipe('SUPER_LIKE')}
                                        className="flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:border-amber-400 text-zinc-800 rounded-xl py-3 font-semibold disabled:opacity-50 transition"
                                    >
                                        <Star className="w-4 h-4 text-blue-500 fill-blue-500" /> Super
                                    </button>
                                    <button
                                        disabled={actionLoading}
                                        onClick={() => swipe('SKIP')}
                                        className="flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:border-zinc-400 text-zinc-500 rounded-xl py-3 font-semibold disabled:opacity-50 transition"
                                    >
                                        <X className="w-4 h-4" /> Pomiń
                                    </button>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center justify-center gap-3 mt-3 text-xs">
                            <button onClick={reportProfile} className="text-zinc-400 hover:text-amber-600 inline-flex items-center gap-1">
                                <Flag className="w-3 h-3" /> Zgłoś
                            </button>
                            <span className="text-zinc-300">·</span>
                            <button onClick={blockProfile} className="text-zinc-400 hover:text-red-600 inline-flex items-center gap-1">
                                <Ban className="w-3 h-3" /> Zablokuj
                            </button>
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="mt-6 space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold text-zinc-900 flex items-baseline gap-3">
                            {profile.display_name}
                            <span className="text-zinc-500 font-normal text-2xl">{profile.age}</span>
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}</span>
                            {profile.last_active && (
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Aktywny: {new Date(profile.last_active).toLocaleDateString('pl-PL')}</span>
                            )}
                        </p>
                    </div>

                    {profile.bio && (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                            <p className="text-zinc-700 whitespace-pre-line">{profile.bio}</p>
                        </div>
                    )}

                    {profile.interests?.length > 0 && (
                        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                            <h3 className="text-xs uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Zainteresowania
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map(i => (
                                    <span key={i} className="bg-amber-100 text-amber-900 text-xs px-3 py-1.5 rounded-full">{i}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {(profile.experience || profile.comfort_level) && (
                        <div className="grid grid-cols-2 gap-3">
                            {profile.experience && (
                                <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                                    <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Doświadczenie</p>
                                    <p className="text-zinc-900 font-medium">{translateExperience(profile.experience)}</p>
                                </div>
                            )}
                            {profile.comfort_level && (
                                <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                                    <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Komfort</p>
                                    <p className="text-zinc-900 font-medium">{translateComfort(profile.comfort_level)}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function translateExperience(v: string) {
    const map: Record<string, string> = {
        never_modeled: 'Nigdy nie pozowała/ł',
        few_times: 'Kilka razy',
        experienced: 'Doświadczona/y',
    };
    return map[v] || v;
}
function translateComfort(v: string) {
    const map: Record<string, string> = { shy: 'Nieśmiała/y', neutral: 'Neutralnie', open: 'Otwarta/y' };
    return map[v] || v;
}
