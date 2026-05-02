'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Camera, Heart, Trophy, ToggleLeft, ToggleRight, ArrowLeft, Calendar } from 'lucide-react';

type Profile = {
    id: number;
    display_name: string | null;
    slug: string | null;
    bio: string | null;
    is_active: boolean;
    available_for_bookings: boolean;
    available_for_foto_match: boolean;
    available_for_challenges: boolean;
    avatar_url: string | null;
    specialties: string | null;
    experience_years: number | null;
    google_calendar_id: string | null;
};

type Photographer = {
    id: number;
    email: string;
    name: string | null;
    role: string;
    is_active: boolean;
    photographer_profile_id: number | null;
    photographer_profile: Profile | null;
    _count: { assigned_bookings: number };
};

export default function AdminPhotographersPage() {
    const router = useRouter();
    const [list, setList] = useState<Photographer[]>([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState<number | null>(null);

    const load = useCallback(async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        if (!token) {
            router.replace('/admin/login');
            return;
        }
        setLoading(true);
        const res = await fetch('/api/admin/photographers', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) {
            localStorage.removeItem('admin_token');
            router.replace('/admin/login');
            return;
        }
        const data = await res.json();
        setList(data.photographers || []);
        setLoading(false);
    }, [router]);

    useEffect(() => { load(); }, [load]);

    const updateProfile = async (userId: number, patch: Partial<Profile>) => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        setSavingId(userId);
        // optimistic
        setList(prev => prev.map(p => p.id === userId ? {
            ...p,
            photographer_profile: { ...(p.photographer_profile || {} as any), ...patch },
        } : p));
        try {
            await fetch(`/api/admin/photographers?id=${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(patch),
            });
        } finally {
            setSavingId(null);
            load();
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-rose-50">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6">
                <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-3">
                    <ArrowLeft className="w-4 h-4" /> Panel admina
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 flex items-center gap-2">
                            <Users className="w-7 h-7 text-rose-500" /> Fotografowie
                        </h1>
                        <p className="text-sm text-zinc-500 mt-1">
                            Włączaj / wyłączaj profile w rezerwacjach, foto-match i wyzwaniach.
                        </p>
                    </div>
                    <Link
                        href="/admin/bookings/calendar"
                        className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm font-semibold text-zinc-700 hover:border-amber-400 inline-flex items-center gap-1 self-start"
                    >
                        <Calendar className="w-4 h-4" /> Kalendarz
                    </Link>
                </div>

                {loading ? (
                    <p className="text-zinc-500">Wczytywanie…</p>
                ) : list.length === 0 ? (
                    <div className="bg-white border border-zinc-200 rounded-xl p-8 text-center">
                        <p className="text-zinc-500">Brak fotografów. Dodaj nowego użytkownika z rolą PHOTOGRAPHER.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {list.map(p => {
                            const prof = p.photographer_profile;
                            const isSaving = savingId === p.id;
                            return (
                                <div key={p.id} className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
                                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center mb-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                            {(prof?.display_name || p.name || p.email)[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-zinc-900">
                                                    {prof?.display_name || p.name || p.email}
                                                </h3>
                                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${p.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {p.role}
                                                </span>
                                                {prof?.is_active ? (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">Aktywny</span>
                                                ) : (
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-500">Wyłączony</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-zinc-500">{p.email} · {p._count.assigned_bookings} rezerwacji</p>
                                        </div>
                                        <Link
                                            href={`/admin/bookings/calendar?photographer=${p.id}`}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 font-semibold text-zinc-700"
                                        >
                                            Kalendarz →
                                        </Link>
                                    </div>

                                    {/* Toggles */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        <Toggle
                                            icon={<Users className="w-3.5 h-3.5" />}
                                            label="Profil aktywny"
                                            value={!!prof?.is_active}
                                            disabled={isSaving}
                                            onChange={v => updateProfile(p.id, { is_active: v })}
                                        />
                                        <Toggle
                                            icon={<Camera className="w-3.5 h-3.5" />}
                                            label="Rezerwacje"
                                            value={!!prof?.available_for_bookings}
                                            disabled={isSaving}
                                            onChange={v => updateProfile(p.id, { available_for_bookings: v })}
                                        />
                                        <Toggle
                                            icon={<Heart className="w-3.5 h-3.5" />}
                                            label="Foto-Match"
                                            value={!!prof?.available_for_foto_match}
                                            disabled={isSaving}
                                            onChange={v => updateProfile(p.id, { available_for_foto_match: v })}
                                        />
                                        <Toggle
                                            icon={<Trophy className="w-3.5 h-3.5" />}
                                            label="Wyzwania"
                                            value={!!prof?.available_for_challenges}
                                            disabled={isSaving}
                                            onChange={v => updateProfile(p.id, { available_for_challenges: v })}
                                        />
                                    </div>

                                    {/* Quick edit display name + slug */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                                        <input
                                            defaultValue={prof?.display_name || ''}
                                            placeholder="Nazwa publiczna"
                                            onBlur={e => {
                                                const v = e.target.value.trim();
                                                if (v && v !== prof?.display_name) updateProfile(p.id, { display_name: v });
                                            }}
                                            className="px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
                                        />
                                        <input
                                            defaultValue={prof?.slug || ''}
                                            placeholder="slug-url"
                                            onBlur={e => {
                                                const v = e.target.value.trim();
                                                if (v && v !== prof?.slug) updateProfile(p.id, { slug: v });
                                            }}
                                            className="px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-mono"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function Toggle({ icon, label, value, onChange, disabled }: {
    icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
    return (
        <button
            onClick={() => onChange(!value)}
            disabled={disabled}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition disabled:opacity-50
                ${value
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-zinc-50 border-zinc-200 text-zinc-500'}`}
        >
            <span className="inline-flex items-center gap-1.5">{icon} {label}</span>
            {value ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
    );
}
