'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
    Sparkles, MapPin, Edit3, Loader2, ShieldCheck, ShieldAlert,
    Clock, Heart, AlertCircle, Camera
} from 'lucide-react';

type Photo = {
    id: number;
    url: string;
    position: number;
    ai_status: string;
};

type Profile = {
    id: number;
    display_name: string;
    birth_year: number;
    city: string;
    bio: string | null;
    interests: string[];
    status: string;
    is_active: boolean;
    selfie_url: string | null;
    id_doc_url: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
};

export default function ProfileView() {
    const router = useRouter();
    const { user, token, isLoading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/logowanie?redirect=/foto-match/profil');
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const r = await fetch('/api/foto-match/profile/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!r.ok) {
                    setLoading(false);
                    return;
                }
                const data = await r.json();
                setProfile(data.profile);
                setPhotos(data.photos || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [token]);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Nie masz jeszcze profilu Foto-Match</h1>
                <p className="text-zinc-400 mb-6">Stwórz profil w 4 krokach.</p>
                <Link
                    href="/foto-match/onboarding"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-6 py-3 font-bold text-white"
                >
                    Zacznij onboarding
                </Link>
            </div>
        );
    }

    const age = new Date().getFullYear() - profile.birth_year;
    const isPending = profile.status === 'PENDING';
    const isActive = profile.status === 'ACTIVE';
    const isSuspended = profile.status === 'SUSPENDED';

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            <div className="flex items-center gap-2 mb-2 text-sm text-amber-300">
                <Sparkles className="w-4 h-4" /> Mój profil Foto-Match
            </div>

            {/* Status banner */}
            {isPending && (
                <div className="mb-6 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 flex gap-3 items-start">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-200 mb-1">Profil oczekuje na akceptację</p>
                        <p className="text-sm text-zinc-300">
                            Administrator weryfikuje Twoje zdjęcia i dokumenty. Damy znać mailem (zwykle do 24h).
                        </p>
                    </div>
                </div>
            )}
            {isActive && (
                <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                    <div className="flex gap-3 items-start mb-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-emerald-200 mb-1">Profil aktywny</p>
                            <p className="text-sm text-zinc-300">
                                Możesz przeglądać profile innych osób, polubić te które Cię zainteresują i pisać po wzajemnym dopasowaniu.
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-8">
                        <Link
                            href="/foto-match/odkryj"
                            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 px-5 py-2.5 font-semibold text-white shadow hover:shadow-lg transition text-sm"
                        >
                            <Sparkles className="w-4 h-4" /> Odkryj profile
                        </Link>
                        <Link
                            href="/foto-match/zapros"
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 hover:border-amber-400 px-5 py-2.5 font-semibold text-sm transition"
                        >
                            <Heart className="w-4 h-4" /> Zaproś znajomych
                        </Link>
                    </div>
                </div>
            )}
            {isSuspended && (
                <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 flex gap-3 items-start">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-rose-200 mb-1">Profil zawieszony</p>
                        {profile.rejection_reason && (
                            <p className="text-sm text-zinc-300">Powód: {profile.rejection_reason}</p>
                        )}
                    </div>
                </div>
            )}
            {profile.rejection_reason && !isSuspended && (
                <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-4 flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-rose-200 mb-1">Wymagana poprawka</p>
                        <p className="text-sm text-zinc-300">{profile.rejection_reason}</p>
                    </div>
                </div>
            )}

            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden mb-6">
                {/* Hero photo */}
                {photos[0] && (
                    <div className="aspect-[16/9] bg-zinc-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photos[0].url} alt={profile.display_name} className="w-full h-full object-cover" />
                    </div>
                )}

                <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-bold">{profile.display_name}, {age}</h1>
                            <p className="text-zinc-400 inline-flex items-center gap-1 mt-1">
                                <MapPin className="w-4 h-4" /> {profile.city}
                            </p>
                        </div>
                        <Link
                            href="/foto-match/onboarding"
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 hover:border-amber-400 px-4 py-2 text-sm font-semibold transition"
                        >
                            <Edit3 className="w-4 h-4" /> Edytuj
                        </Link>
                    </div>

                    {profile.bio && (
                        <p className="text-zinc-300 leading-relaxed mb-4">{profile.bio}</p>
                    )}

                    {profile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {profile.interests.map((i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs">
                                    {i}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Photos grid */}
            {photos.length > 1 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold mb-3 inline-flex items-center gap-2">
                        <Camera className="w-5 h-5 text-amber-400" /> Twoje zdjęcia ({photos.length})
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {photos.map((p) => (
                            <div key={p.id} className="aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt="" className="w-full h-full object-cover" />
                                {p.ai_status === 'FLAGGED' && (
                                    <div className="absolute top-2 left-2 bg-rose-500/90 text-white text-[10px] uppercase px-2 py-1 rounded-full font-bold">
                                        Do sprawdzenia
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-xl bg-zinc-900/40 border border-zinc-800 p-5 text-sm text-zinc-400">
                <Heart className="w-5 h-5 text-rose-400 inline mr-2" />
                Po akceptacji profilu odblokujemy tworzenie intencji sesji i wyszukiwanie partnerów.
                Pracujemy nad tymi funkcjami.
            </div>
        </div>
    );
}
