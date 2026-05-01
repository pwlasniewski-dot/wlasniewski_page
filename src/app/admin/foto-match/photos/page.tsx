'use client';

/**
 * Admin Foto-Match: kolejka zdjęć FLAGGED do akceptacji/odrzucenia.
 */
import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, X, ArrowLeft, AlertTriangle, Trash2 } from 'lucide-react';

type Photo = {
    id: number;
    url: string;
    position: number;
    ai_status: string;
    ai_flagged_for: string | null;
    ai_labels: any;
    created_at: string;
    profile: {
        id: number;
        display_name: string;
        status: string;
        user: { id: number; email: string; name: string | null };
    };
};

const STATUS_OPTIONS = [
    { v: 'FLAGGED', label: 'Oflagowane', color: 'rose' },
    { v: 'PENDING', label: 'Oczekujące', color: 'amber' },
    { v: 'APPROVED', label: 'Zaakceptowane', color: 'emerald' },
    { v: 'REJECTED', label: 'Odrzucone', color: 'zinc' },
];

function PhotosInner() {
    const router = useRouter();
    const sp = useSearchParams();
    const status = sp.get('status') || 'FLAGGED';
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;
        setLoading(true);
        const r = await fetch(`/api/admin/foto-match/photos?status=${status}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
            const data = await r.json();
            setPhotos(data.photos || []);
        } else {
            setError('Błąd ładowania.');
        }
        setLoading(false);
    }, [status]);

    useEffect(() => { load(); }, [load]);

    const setStatus = (v: string) => {
        const params = new URLSearchParams(sp.toString());
        params.set('status', v);
        router.push(`/admin/foto-match/photos?${params.toString()}`);
    };

    const action = async (photoId: number, act: 'approve' | 'reject', hardDelete = false) => {
        if (hardDelete && !confirm('Twardo usunąć zdjęcie z S3 i bazy?')) return;
        setBusyId(photoId);
        const token = localStorage.getItem('admin_token');
        const r = hardDelete
            ? await fetch(`/api/admin/foto-match/photos/${photoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            })
            : await fetch(`/api/admin/foto-match/photos/${photoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ action: act }),
            });
        if (r.ok) {
            setPhotos((prev) => prev.filter((p) => p.id !== photoId));
        } else {
            const data = await r.json().catch(() => ({}));
            setError(data.error || 'Błąd akcji');
        }
        setBusyId(null);
    };

    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/admin/foto-match" className="text-zinc-400 hover:text-amber-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Kolejka zdjęć</h1>
                        <p className="text-sm text-zinc-400">{loading ? 'Ładowanie…' : `${photos.length} zdjęć`}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((o) => (
                    <button
                        key={o.v}
                        onClick={() => setStatus(o.v)}
                        className={`px-4 py-2 rounded-lg border text-sm transition ${status === o.v
                            ? 'bg-amber-500 border-amber-500 text-zinc-900 font-semibold'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-amber-500/40'}`}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> {error}
                </div>
            )}

            {loading ? (
                <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
            ) : photos.length === 0 ? (
                <div className="p-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                    Brak zdjęć w stanie <strong>{status}</strong>.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {photos.map((p) => (
                        <div key={p.id} className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                            <div className="relative aspect-[3/4] bg-zinc-950">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                {p.ai_flagged_for && (
                                    <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-rose-500/90 text-white font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> {p.ai_flagged_for}
                                    </span>
                                )}
                            </div>
                            <div className="p-3 space-y-2">
                                <Link
                                    href={`/admin/foto-match/profiles/${p.profile.id}`}
                                    className="block text-sm font-semibold text-white hover:text-amber-300 truncate"
                                >
                                    {p.profile.display_name}
                                </Link>
                                <p className="text-xs text-zinc-500 truncate">{p.profile.user.email}</p>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => action(p.id, 'approve')}
                                        disabled={busyId === p.id}
                                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-900 text-xs font-semibold disabled:opacity-40"
                                    >
                                        <CheckCircle2 className="w-3 h-3" /> OK
                                    </button>
                                    <button
                                        onClick={() => action(p.id, 'reject')}
                                        disabled={busyId === p.id}
                                        className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold hover:bg-rose-500/30 disabled:opacity-40"
                                    >
                                        <X className="w-3 h-3" /> Odrzuć
                                    </button>
                                    <button
                                        onClick={() => action(p.id, 'reject', true)}
                                        disabled={busyId === p.id}
                                        title="Twarde usunięcie z S3"
                                        className="px-2 py-1.5 rounded-md bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-rose-400 hover:border-rose-500/40 disabled:opacity-40"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function PhotosPage() {
    return (
        <Suspense fallback={<div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>}>
            <PhotosInner />
        </Suspense>
    );
}
