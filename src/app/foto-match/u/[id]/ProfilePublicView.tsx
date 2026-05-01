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
        return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }
    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-6">
                <p className="text-red-400 mb-4">{error || 'Profil niedostępny'}</p>
                <Link href="/foto-match/odkryj" className="text-amber-400 underline">← Wróć do listy</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-black text-white pb-32">
            {matchToast && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-6 py-3 rounded-full font-bold shadow-2xl z-50 animate-bounce">
                    💖 {matchToast}
                </div>
            )}

            <div className="max-w-3xl mx-auto px-4 pt-8">
                <Link href="/foto-match/odkryj" className="text-zinc-400 hover:text-white inline-flex items-center gap-1 text-sm mb-4">
                    <ArrowLeft className="w-4 h-4" /> Lista kandydatów
                </Link>

                {/* Galeria */}
                <div className="relative bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-800">
                    {profile.photos.length > 0 ? (
                        <>
                            <div className="aspect-[3/4] bg-zinc-900 relative">
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
                                            className={`flex-none w-16 h-20 rounded-lg overflow-hidden border-2 ${i === activePhoto ? 'border-amber-500' : 'border-zinc-800'}`}
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

                {/* Info */}
                <div className="mt-6 space-y-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-baseline gap-3">
                            {profile.display_name}
                            <span className="text-zinc-400 font-normal text-2xl">{profile.age}</span>
                        </h1>
                        <p className="text-zinc-400 text-sm mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city}</span>
                            {profile.last_active && (
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Aktywny: {new Date(profile.last_active).toLocaleDateString('pl-PL')}</span>
                            )}
                        </p>
                    </div>

                    {profile.bio && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                            <p className="text-zinc-200 whitespace-pre-line">{profile.bio}</p>
                        </div>
                    )}

                    {profile.interests?.length > 0 && (
                        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Zainteresowania
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map(i => (
                                    <span key={i} className="bg-zinc-800 text-zinc-200 text-xs px-3 py-1.5 rounded-full">{i}</span>
                                ))}
                            </div>
                        </div>
                    )}

                    {(profile.experience || profile.comfort_level) && (
                        <div className="grid grid-cols-2 gap-3">
                            {profile.experience && (
                                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Doświadczenie</p>
                                    <p className="text-white">{translateExperience(profile.experience)}</p>
                                </div>
                            )}
                            {profile.comfort_level && (
                                <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Komfort</p>
                                    <p className="text-white">{translateComfort(profile.comfort_level)}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Pasek akcji (sticky bottom) */}
            {!relation?.is_self && (
                <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-8 pb-6 px-4 z-40">
                    <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
                        <button
                            onClick={reportProfile}
                            className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center border border-zinc-800"
                            title="Zgłoś profil"
                        >
                            <Flag className="w-4 h-4 text-amber-400" />
                        </button>
                        <button
                            onClick={blockProfile}
                            className="w-12 h-12 rounded-full bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center border border-zinc-800"
                            title="Zablokuj"
                        >
                            <Ban className="w-4 h-4 text-red-400" />
                        </button>
                        {relation?.is_match ? (
                            <div className="bg-gradient-to-r from-rose-500/90 to-amber-500/90 text-white px-6 py-4 rounded-2xl font-bold shadow-xl">
                                💖 Macie match!
                            </div>
                        ) : (
                            <>
                                <button
                                    disabled={actionLoading}
                                    onClick={() => swipe('SKIP')}
                                    className="w-16 h-16 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center shadow-xl border border-zinc-700 disabled:opacity-50"
                                    title="Pomiń"
                                >
                                    <X className="w-7 h-7 text-zinc-300" />
                                </button>
                                <button
                                    disabled={actionLoading}
                                    onClick={() => swipe('SUPER_LIKE')}
                                    className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 hover:scale-105 flex items-center justify-center shadow-xl disabled:opacity-50 transition-transform"
                                    title="Super-like"
                                >
                                    <Star className="w-6 h-6 text-white fill-white" />
                                </button>
                                <button
                                    disabled={actionLoading || relation?.i_liked}
                                    onClick={() => swipe('LIKE')}
                                    className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 hover:scale-105 flex items-center justify-center shadow-xl disabled:opacity-50 transition-transform"
                                    title={relation?.i_liked ? 'Już polubiono' : 'Polub'}
                                >
                                    <Heart className={`w-7 h-7 text-white ${relation?.i_liked ? 'fill-white' : ''}`} />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
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
