'use client';

/**
 * Admin Foto-Match: szczegóły profilu + akcje moderacyjne.
 * NIE pokazuje skanu dowodu (RODO data minimization) — weryfikacja oparta o:
 *   - selfie (porównanie ze zdjęciami profilu),
 *   - numer telefonu zweryfikowany SMS-em (phone_verified_at),
 *   - oświadczenie 18+ (age_declared_at).
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Loader2, ShieldCheck, X, AlertTriangle, Phone, CheckCircle2,
    User as UserIcon, MapPin, Calendar, Mail, ArrowLeft, Trash2, Pause, Play
} from 'lucide-react';
import { StatusBadge } from '../../_components/StatusBadge';

type Profile = {
    id: number;
    display_name: string;
    status: string;
    is_active: boolean;
    city: string;
    radius_km: number;
    birth_year: number;
    gender: string;
    bio: string | null;
    interests: string[];
    experience: string | null;
    comfort_level: string | null;
    selfie_url: string | null;
    id_doc_url: string | null;
    verified_at: string | null;
    verified_by: number | null;
    rejection_reason: string | null;
    flagged_count: number;
    phone: string | null;
    phone_verified_at: string | null;
    age_declared_at: string | null;
    age_declared_ip: string | null;
    last_active: string | null;
    created_at: string;
    user: { id: number; email: string; name: string | null; phone: string | null; created_at: string; is_active: boolean };
    photos: Array<{ id: number; url: string; position: number; ai_status: string; ai_flagged_for: string | null }>;
};

export default function ProfileDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const profileId = Number(params.id);

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reason, setReason] = useState('');

    const load = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        setLoading(true);
        const r = await fetch(`/api/admin/foto-match/profiles/${profileId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
            const data = await r.json();
            setProfile(data.profile);
        } else {
            setError('Nie znaleziono profilu.');
        }
        setLoading(false);
    }, [profileId]);

    useEffect(() => { if (profileId) load(); }, [profileId, load]);

    const action = async (act: 'approve' | 'reject' | 'suspend' | 'reactivate') => {
        if (!profile) return;
        if ((act === 'reject' || act === 'suspend') && !reason.trim()) {
            setError('Podaj powód.');
            return;
        }
        if (act === 'approve' && !profile.phone_verified_at) {
            if (!confirm('UWAGA: numer telefonu nie został zweryfikowany. Mimo to zaakceptować profil?')) return;
        }
        setBusy(true);
        setError(null);
        const token = localStorage.getItem('admin_token');
        const r = await fetch(`/api/admin/foto-match/profiles/${profileId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ action: act, reason: reason.trim() || undefined }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            setError(data.error || 'Błąd akcji');
        } else {
            setReason('');
            await load();
        }
        setBusy(false);
    };

    const softDelete = async () => {
        if (!confirm('Soft-delete profilu (status=DELETED, is_active=false). Kontynuować?')) return;
        setBusy(true);
        const token = localStorage.getItem('admin_token');
        const r = await fetch(`/api/admin/foto-match/profiles/${profileId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
            router.push('/admin/foto-match/profiles');
        } else {
            setError('Błąd usuwania');
            setBusy(false);
        }
    };

    if (loading) {
        return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>;
    }
    if (!profile) {
        return <div className="p-8 text-rose-400">{error || 'Brak profilu.'}</div>;
    }

    const age = new Date().getFullYear() - profile.birth_year;

    return (
        <div className="p-6 sm:p-8 space-y-6 max-w-6xl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/foto-match/profiles" className="text-zinc-400 hover:text-amber-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            {profile.display_name}
                            <StatusBadge status={profile.status} />
                        </h1>
                        <p className="text-sm text-zinc-400">Profil #{profile.id} · User #{profile.user.id}</p>
                    </div>
                </div>
                <button
                    onClick={softDelete}
                    disabled={busy}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 text-sm hover:bg-rose-500/20 disabled:opacity-50"
                >
                    <Trash2 className="w-4 h-4" /> Soft-delete
                </button>
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lewa: dane + selfie */}
                <div className="lg:col-span-1 space-y-5">
                    {/* Selfie */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4">
                        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-amber-400" /> Selfie weryfikacyjne
                        </h3>
                        {profile.selfie_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.selfie_url} alt="selfie" className="w-full rounded-lg" loading="lazy" decoding="async" />
                        ) : (
                            <div className="aspect-square rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs">brak</div>
                        )}
                        <p className="text-xs text-zinc-500 mt-2">Porównaj selfie z głównym zdjęciem profilu.</p>
                    </div>

                    {/* Status weryfikacji */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
                        <h3 className="text-sm font-semibold text-zinc-300">Status weryfikacji</h3>
                        <Row icon={<Phone className="w-4 h-4" />} label="Telefon" ok={!!profile.phone_verified_at}>
                            {profile.phone || <span className="text-zinc-600">brak</span>}
                            {profile.phone_verified_at && (
                                <span className="ml-2 text-xs text-emerald-400">
                                    ({new Date(profile.phone_verified_at).toLocaleString('pl-PL')})
                                </span>
                            )}
                        </Row>
                        <Row icon={<CheckCircle2 className="w-4 h-4" />} label="Oświadczenie 18+" ok={!!profile.age_declared_at}>
                            {profile.age_declared_at
                                ? `${new Date(profile.age_declared_at).toLocaleString('pl-PL')} (IP: ${profile.age_declared_ip || '?'})`
                                : <span className="text-zinc-600">brak</span>}
                        </Row>
                        <Row icon={<ShieldCheck className="w-4 h-4" />} label="Zatwierdzony" ok={!!profile.verified_at}>
                            {profile.verified_at
                                ? `${new Date(profile.verified_at).toLocaleString('pl-PL')} (admin #${profile.verified_by ?? '?'})`
                                : <span className="text-zinc-600">brak</span>}
                        </Row>
                        {profile.id_doc_url && (
                            <p className="text-xs text-amber-400 border border-amber-500/30 bg-amber-500/5 rounded p-2">
                                Profil ma starszy zapis skanu dowodu (sprzed migracji RODO). Rozważ wyczyszczenie.
                            </p>
                        )}
                    </div>

                    {/* Dane konta */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 space-y-2 text-sm">
                        <h3 className="font-semibold text-zinc-300 mb-2">Konto</h3>
                        <p className="flex items-center gap-2 text-zinc-300"><Mail className="w-4 h-4 text-zinc-500" /> {profile.user.email}</p>
                        <p className="flex items-center gap-2 text-zinc-300"><UserIcon className="w-4 h-4 text-zinc-500" /> {profile.user.name || '—'}</p>
                        <p className="flex items-center gap-2 text-zinc-400"><Calendar className="w-4 h-4 text-zinc-500" /> Konto: {new Date(profile.user.created_at).toLocaleDateString('pl-PL')}</p>
                    </div>
                </div>

                {/* Prawa: profil + zdjęcia */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Dane profilu */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 space-y-3">
                        <h3 className="font-semibold text-white">Profil publiczny</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                            <Info label="Wiek" value={`${age} lat (rocz. ${profile.birth_year})`} />
                            <Info label="Płeć" value={profile.gender} />
                            <Info label="Miasto" value={profile.city} icon={<MapPin className="w-3 h-3" />} />
                            <Info label="Promień" value={`${profile.radius_km} km`} />
                            <Info label="Doświadczenie" value={profile.experience || '—'} />
                            <Info label="Komfort" value={profile.comfort_level || '—'} />
                            <Info label="Aktywne" value={profile.is_active ? 'TAK' : 'NIE'} />
                            <Info label="Zgłoszenia" value={String(profile.flagged_count)} />
                            <Info label="Ostatnia akt." value={profile.last_active ? new Date(profile.last_active).toLocaleString('pl-PL') : '—'} />
                        </div>
                        {profile.bio && (
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Bio</p>
                                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{profile.bio}</p>
                            </div>
                        )}
                        {profile.interests.length > 0 && (
                            <div>
                                <p className="text-xs text-zinc-500 mb-1">Zainteresowania</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {profile.interests.map((i) => (
                                        <span key={i} className="text-xs px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">{i}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {profile.rejection_reason && (
                            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-sm">
                                <strong className="block text-xs uppercase mb-1">Powód odrzucenia/zawieszenia:</strong>
                                {profile.rejection_reason}
                            </div>
                        )}
                    </div>

                    {/* Zdjęcia */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5">
                        <h3 className="font-semibold text-white mb-3">Zdjęcia ({profile.photos.length})</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {profile.photos.map((ph) => (
                                <div key={ph.id} className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={ph.url} alt={`zdj ${ph.position}`} className="w-full aspect-[3/4] object-cover rounded-lg" loading="lazy" decoding="async" />
                                    <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">#{ph.position}</span>
                                    {ph.ai_status === 'FLAGGED' && (
                                        <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/90 text-white flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> {ph.ai_flagged_for || 'flagged'}
                                        </span>
                                    )}
                                    {ph.ai_status === 'APPROVED' && (
                                        <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/90 text-white">OK</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Akcje moderacyjne */}
                    <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-5 space-y-4">
                        <h3 className="font-semibold text-white">Akcje moderacyjne</h3>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Powód (wymagany przy odrzuceniu/zawieszeniu, opcjonalny przy reszcie)"
                            rows={2}
                            maxLength={500}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-amber-500"
                        />
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => action('approve')}
                                disabled={busy || profile.status === 'ACTIVE'}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-semibold text-sm disabled:opacity-40"
                            >
                                <CheckCircle2 className="w-4 h-4" /> Zaakceptuj
                            </button>
                            <button
                                onClick={() => action('reject')}
                                disabled={busy || profile.status === 'REJECTED'}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-200 font-semibold text-sm hover:bg-rose-500/30 disabled:opacity-40"
                            >
                                <X className="w-4 h-4" /> Odrzuć
                            </button>
                            <button
                                onClick={() => action('suspend')}
                                disabled={busy || profile.status === 'SUSPENDED'}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 font-semibold text-sm hover:bg-amber-500/30 disabled:opacity-40"
                            >
                                <Pause className="w-4 h-4" /> Zawieś
                            </button>
                            <button
                                onClick={() => action('reactivate')}
                                disabled={busy || profile.status === 'ACTIVE'}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 font-semibold text-sm hover:border-emerald-500/40 disabled:opacity-40"
                            >
                                <Play className="w-4 h-4" /> Reaktywuj
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Row({ icon, label, ok, children }: { icon: React.ReactNode; label: string; ok: boolean; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2 text-sm">
            <span className={`mt-0.5 ${ok ? 'text-emerald-400' : 'text-zinc-600'}`}>{icon}</span>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className={`${ok ? 'text-zinc-200' : 'text-zinc-500'} break-words`}>{children}</p>
            </div>
        </div>
    );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs text-zinc-500 mb-0.5 flex items-center gap-1">{icon} {label}</p>
            <p className="text-zinc-200 text-sm">{value}</p>
        </div>
    );
}
