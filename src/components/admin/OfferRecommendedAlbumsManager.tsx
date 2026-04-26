'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Plus, X, Star, Loader2, ExternalLink, Search } from 'lucide-react';

interface Album {
    id: number;
    title: string;
    slug: string;
    subtitle?: string;
    cover_image_url?: string;
    price: number;
    currency: string;
    occasion: string[];
    is_featured: boolean;
}

interface Recommendation {
    id: number;
    position: number;
    custom_note?: string;
    is_highlighted: boolean;
    album: Album;
}

export default function AdminOfferRecommendedAlbumsManager({ offerId }: { offerId: number }) {
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [allAlbums, setAllAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [picking, setPicking] = useState(false);
    const [search, setSearch] = useState('');
    const [editingNote, setEditingNote] = useState<{ id: number; note: string } | null>(null);

    useEffect(() => { fetchAll(); }, [offerId]);

    async function fetchAll() {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const [recRes, albRes] = await Promise.all([
                fetch(`/api/admin/offers/${offerId}/recommended-albums`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/admin/nphoto-albums', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const recData = await recRes.json();
            const albData = await albRes.json();
            if (recData.success) setRecommendations(recData.recommendations || []);
            if (albData.success) setAllAlbums(albData.albums || []);
        } catch {
            toast.error('Błąd ładowania albumów');
        }
        setLoading(false);
    }

    async function addRecommendation(albumId: number) {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers/${offerId}/recommended-albums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ album_id: albumId, position: recommendations.length })
            });
            if (res.ok) {
                toast.success('Album dodany do rekomendacji');
                fetchAll();
            } else {
                toast.error('Błąd dodawania');
            }
        } catch { toast.error('Błąd'); }
    }

    async function removeRecommendation(albumId: number) {
        if (!confirm('Usunąć album z rekomendacji tej oferty?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            await fetch(`/api/admin/offers/${offerId}/recommended-albums?album_id=${albumId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast.success('Usunięto');
            fetchAll();
        } catch { toast.error('Błąd'); }
    }

    async function updateRecommendation(albumId: number, patch: { custom_note?: string; is_highlighted?: boolean }) {
        try {
            const token = localStorage.getItem('admin_token');
            await fetch(`/api/admin/offers/${offerId}/recommended-albums`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ album_id: albumId, ...patch })
            });
            fetchAll();
        } catch { toast.error('Błąd'); }
    }

    const recommendedIds = new Set(recommendations.map(r => r.album.id));
    const availableAlbums = allAlbums.filter(a =>
        !recommendedIds.has(a.id) &&
        (search ? a.title.toLowerCase().includes(search.toLowerCase()) : true)
    );

    return (
        <div className="bg-zinc-900/50 backdrop-blur border border-gold-500/20 rounded-2xl p-6 my-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-gold-400" /> Rekomendowane albumy nPhoto
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">
                        Wybierz albumy, które klient zobaczy w swoim panelu obok tej oferty. Zachęć go do zamówienia premium produktu.
                    </p>
                </div>
                <button onClick={() => setPicking(!picking)}
                    className="bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold px-4 py-2 rounded-lg flex items-center gap-2">
                    <Plus className="w-4 h-4" /> {picking ? 'Zamknij' : 'Dodaj album'}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
                </div>
            ) : recommendations.length === 0 && !picking ? (
                <div className="bg-zinc-950/50 border border-dashed border-zinc-700 rounded-xl p-8 text-center">
                    <Sparkles className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                    <p className="text-zinc-400">Nie wybrano jeszcze żadnych albumów dla tej oferty.</p>
                    <p className="text-zinc-500 text-xs mt-1">Klient zobaczy automatycznie dopasowane albumy na podstawie kategorii oferty.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recommendations.map(rec => (
                        <div key={rec.id} className={`relative bg-zinc-950/70 border rounded-xl overflow-hidden ${rec.is_highlighted ? 'border-gold-500' : 'border-zinc-800'}`}>
                            {rec.album.cover_image_url && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={rec.album.cover_image_url} alt={rec.album.title} className="w-full aspect-[4/3] object-cover" />
                            )}
                            <div className="p-3">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div>
                                        <div className="text-white text-sm font-bold line-clamp-1">{rec.album.title}</div>
                                        {rec.album.price > 0 && <div className="text-gold-400 text-xs">{rec.album.price} {rec.album.currency}</div>}
                                    </div>
                                    <button onClick={() => removeRecommendation(rec.album.id)} className="text-red-400 hover:bg-red-500/20 p-1 rounded">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <label className="flex items-center gap-2 text-xs text-zinc-300 mb-2">
                                    <input type="checkbox" checked={rec.is_highlighted}
                                        onChange={e => updateRecommendation(rec.album.id, { is_highlighted: e.target.checked })}
                                        className="w-3.5 h-3.5 accent-gold-500" />
                                    <Star className="w-3 h-3 text-gold-400" /> Wyróżnij u klienta
                                </label>

                                {editingNote?.id === rec.album.id ? (
                                    <div className="flex gap-1">
                                        <input value={editingNote.note} onChange={e => setEditingNote({ ...editingNote, note: e.target.value })}
                                            placeholder="Notatka dla klienta..."
                                            className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white" />
                                        <button onClick={() => { updateRecommendation(rec.album.id, { custom_note: editingNote.note }); setEditingNote(null); }}
                                            className="bg-gold-500 text-zinc-950 px-2 rounded text-xs font-bold">OK</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setEditingNote({ id: rec.album.id, note: rec.custom_note || '' })}
                                        className="text-xs text-zinc-400 hover:text-gold-400 italic w-full text-left">
                                        💬 {rec.custom_note || 'Dodaj notatkę dla klienta...'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {picking && (
                <div className="mt-4 bg-zinc-950/70 border border-zinc-800 rounded-xl p-4">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Szukaj albumu..."
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-10 pr-3 py-2 text-white text-sm" />
                    </div>
                    {availableAlbums.length === 0 ? (
                        <div className="text-center text-zinc-500 py-6 text-sm">
                            {allAlbums.length === 0 ? (
                                <>Brak albumów w katalogu. <a href="/admin/nphoto-albums" target="_blank" className="text-gold-400 underline">Dodaj pierwszy</a>.</>
                            ) : 'Wszystkie albumy są już rekomendowane.'}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                            {availableAlbums.map(a => (
                                <button key={a.id} onClick={() => addRecommendation(a.id)}
                                    className="group bg-zinc-900 hover:bg-gold-500/10 border border-zinc-800 hover:border-gold-500 rounded-lg overflow-hidden text-left transition">
                                    {a.cover_image_url && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={a.cover_image_url} alt={a.title} className="w-full aspect-square object-cover" />
                                    )}
                                    <div className="p-2">
                                        <div className="text-xs text-white font-medium line-clamp-1 group-hover:text-gold-400">{a.title}</div>
                                        {a.price > 0 && <div className="text-xs text-gold-400">{a.price} zł</div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
