'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';
import {
    Plus, Search, Edit3, Trash2, Star, Eye, EyeOff,
    Image as ImageIcon, Film, Sparkles, ExternalLink, Heart,
    Filter, Grid, List as ListIcon, Loader2, ShoppingBag
} from 'lucide-react';

interface Album {
    id: number;
    title: string;
    slug: string;
    subtitle?: string;
    description?: string;
    category: string;
    occasion: string[];
    price: number;
    price_from?: number;
    currency: string;
    cover_image_url?: string;
    preview_images: any;
    sample_pages: any;
    video_url?: string;
    nphoto_shop_url?: string;
    is_active: boolean;
    is_featured: boolean;
    sort_order: number;
    created_at: string;
}

const CATEGORIES = [
    { value: 'all', label: 'Wszystkie' },
    { value: 'album', label: 'Albumy' },
    { value: 'photobook', label: 'Fotoksiążki' },
    { value: 'canvas', label: 'Płótna' },
    { value: 'frame', label: 'Ramy' },
    { value: 'box', label: 'Pudełka prezentowe' },
];

const OCCASIONS = [
    { value: 'wedding', label: '💍 Ślub', emoji: '💍' },
    { value: 'communion', label: '🕊️ Komunia', emoji: '🕊️' },
    { value: 'birthday', label: '🎂 Urodziny', emoji: '🎂' },
    { value: 'family', label: '👨‍👩‍👧 Rodzinna', emoji: '👨‍👩‍👧' },
    { value: 'newborn', label: '👶 Noworodki', emoji: '👶' },
    { value: 'engagement', label: '💕 Zaręczyny', emoji: '💕' },
    { value: 'graduation', label: '🎓 Studniówka', emoji: '🎓' },
];

export default function NphotoAlbumsPage() {
    const router = useRouter();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterOccasion, setFilterOccasion] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => { fetchAlbums(); }, []);

    async function fetchAlbums() {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/nphoto-albums?all=true', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setAlbums(data.albums);
        } catch (error) {
            toast.error('Błąd ładowania albumów');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(id: number, title: string) {
        if (!confirm(`Usunąć album "${title}"? Ta akcja jest nieodwracalna.`)) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/nphoto-albums/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Album usunięty');
                fetchAlbums();
            } else {
                toast.error('Nie udało się usunąć');
            }
        } catch {
            toast.error('Błąd');
        }
    }

    async function toggleField(id: number, field: 'is_active' | 'is_featured', value: boolean) {
        try {
            const token = localStorage.getItem('admin_token');
            await fetch(`/api/admin/nphoto-albums/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ [field]: value })
            });
            fetchAlbums();
        } catch { toast.error('Błąd'); }
    }

    const filtered = albums.filter(a => {
        if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.slug.includes(search)) return false;
        if (filterCategory !== 'all' && a.category !== filterCategory) return false;
        if (filterOccasion && !a.occasion.includes(filterOccasion)) return false;
        if (filterStatus === 'active' && !a.is_active) return false;
        if (filterStatus === 'inactive' && a.is_active) return false;
        if (filterStatus === 'featured' && !a.is_featured) return false;
        return true;
    });

    const stats = {
        total: albums.length,
        active: albums.filter(a => a.is_active).length,
        featured: albums.filter(a => a.is_featured).length,
        withVideo: albums.filter(a => a.video_url).length,
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <Sparkles className="text-gold-500" /> Katalog Albumów nPhoto
                    </h1>
                    <p className="text-zinc-400 mt-2 max-w-2xl">
                        Zarządzaj profesjonalnymi albumami i produktami fotograficznymi.
                        Albumy pojawiają się w kreatorze ofert, na stronach (PageBuilder) oraz w panelu klienta jako rekomendacje.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-zinc-950 font-bold px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-gold-500/20 transition-all hover:scale-105"
                >
                    <Plus className="w-5 h-5" /> Nowy album
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={ShoppingBag} label="Łącznie" value={stats.total} color="text-zinc-300" />
                <StatCard icon={Eye} label="Aktywne" value={stats.active} color="text-emerald-400" />
                <StatCard icon={Star} label="Wyróżnione" value={stats.featured} color="text-gold-500" />
                <StatCard icon={Film} label="Z wideo" value={stats.withVideo} color="text-purple-400" />
            </div>

            {/* Filters */}
            <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-4 mb-6">
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex-1 min-w-[240px] relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Szukaj albumu..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:border-gold-500 focus:outline-none"
                        />
                    </div>
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none">
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select value={filterOccasion} onChange={e => setFilterOccasion(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none">
                        <option value="">Wszystkie okazje</option>
                        {OCCASIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}
                        className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none">
                        <option value="all">Wszystkie statusy</option>
                        <option value="active">Aktywne</option>
                        <option value="inactive">Nieaktywne</option>
                        <option value="featured">Wyróżnione</option>
                    </select>
                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                        <button onClick={() => setView('grid')}
                            className={`px-3 py-2 ${view === 'grid' ? 'bg-gold-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
                            <Grid className="w-4 h-4" />
                        </button>
                        <button onClick={() => setView('list')}
                            className={`px-3 py-2 ${view === 'list' ? 'bg-gold-500 text-zinc-950' : 'text-zinc-400 hover:text-white'}`}>
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState onCreate={() => setShowForm(true)} hasAlbums={albums.length > 0} />
            ) : view === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map(a => (
                        <AlbumCard key={a.id} album={a}
                            onEdit={() => router.push(`/admin/nphoto-albums/${a.id}`)}
                            onDelete={() => handleDelete(a.id, a.title)}
                            onToggleActive={() => toggleField(a.id, 'is_active', !a.is_active)}
                            onToggleFeatured={() => toggleField(a.id, 'is_featured', !a.is_featured)}
                        />
                    ))}
                </div>
            ) : (
                <AlbumList albums={filtered}
                    onEdit={(id: number) => router.push(`/admin/nphoto-albums/${id}`)}
                    onDelete={handleDelete}
                    onToggleActive={(id: number, val: boolean) => toggleField(id, 'is_active', val)}
                    onToggleFeatured={(id: number, val: boolean) => toggleField(id, 'is_featured', val)}
                />
            )}

            {/* Form modal */}
            {showForm && (
                <AlbumFormModal onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); fetchAlbums(); }} />
            )}
        </div>
    );
}

// ─── Komponenty ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400 text-sm">{label}</span>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
        </div>
    );
}

function AlbumCard({ album, onEdit, onDelete, onToggleActive, onToggleFeatured }: any) {
    const previewImgs = Array.isArray(album.preview_images) ? album.preview_images : [];
    return (
        <div className="bg-zinc-900/60 backdrop-blur border border-zinc-800 rounded-2xl overflow-hidden hover:border-gold-500/50 transition-all group">
            <div className="relative aspect-[4/3] bg-zinc-800 overflow-hidden">
                {album.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover_image_url} alt={album.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <ImageIcon className="w-16 h-16" />
                    </div>
                )}
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {album.is_featured && (
                        <span className="bg-gold-500/95 text-zinc-950 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> WYRÓŻNIONE
                        </span>
                    )}
                    {!album.is_active && (
                        <span className="bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">UKRYTE</span>
                    )}
                </div>
                {album.video_url && (
                    <div className="absolute top-2 right-2 bg-purple-500/90 p-1.5 rounded-full">
                        <Film className="w-3 h-3 text-white" />
                    </div>
                )}
                {previewImgs.length > 0 && (
                    <div className="absolute bottom-2 right-2 bg-zinc-950/80 backdrop-blur text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> +{previewImgs.length}
                    </div>
                )}
            </div>
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white line-clamp-1">{album.title}</h3>
                    {album.price > 0 && (
                        <span className="text-gold-400 font-bold whitespace-nowrap">{album.price} zł</span>
                    )}
                </div>
                {album.subtitle && <p className="text-zinc-400 text-sm line-clamp-2 mb-2">{album.subtitle}</p>}
                {album.occasion?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {album.occasion.slice(0, 3).map((o: string) => {
                            const occ = OCCASIONS.find(x => x.value === o);
                            return occ ? <span key={o} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{occ.emoji}</span> : null;
                        })}
                    </div>
                )}
                <div className="flex items-center gap-1 pt-3 border-t border-zinc-800">
                    <button onClick={onEdit} title="Edytuj"
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg flex items-center justify-center gap-1 text-sm transition">
                        <Edit3 className="w-4 h-4" /> Edytuj
                    </button>
                    <button onClick={onToggleActive} title={album.is_active ? 'Ukryj' : 'Pokaż'}
                        className={`p-2 rounded-lg transition ${album.is_active ? 'bg-zinc-800 hover:bg-emerald-700 text-emerald-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500'}`}>
                        {album.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={onToggleFeatured} title={album.is_featured ? 'Usuń z wyróżnionych' : 'Wyróżnij'}
                        className={`p-2 rounded-lg transition ${album.is_featured ? 'bg-gold-500/20 hover:bg-gold-500/40 text-gold-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-500'}`}>
                        <Star className={`w-4 h-4 ${album.is_featured ? 'fill-current' : ''}`} />
                    </button>
                    {album.nphoto_shop_url && (
                        <a href={album.nphoto_shop_url} target="_blank" rel="noopener" title="Otwórz w nPhoto"
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-blue-700 text-blue-400 transition">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                    <button onClick={onDelete} title="Usuń"
                        className="p-2 rounded-lg bg-zinc-800 hover:bg-red-700 text-red-400 transition">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function AlbumList({ albums, onEdit, onDelete, onToggleActive, onToggleFeatured }: any) {
    return (
        <div className="bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
                <thead className="bg-zinc-950/50">
                    <tr className="text-left text-xs uppercase text-zinc-500">
                        <th className="px-4 py-3">Album</th>
                        <th className="px-4 py-3">Kategoria</th>
                        <th className="px-4 py-3">Cena</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {albums.map((a: Album) => (
                        <tr key={a.id} className="border-t border-zinc-800 hover:bg-zinc-950/30">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded bg-zinc-800 overflow-hidden flex-shrink-0">
                                        {a.cover_image_url && <img src={a.cover_image_url} alt="" className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <div className="text-white font-medium">{a.title}</div>
                                        <div className="text-zinc-500 text-xs">/{a.slug}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-zinc-400">{a.category}</td>
                            <td className="px-4 py-3 text-gold-400 font-semibold">{a.price > 0 ? `${a.price} zł` : '—'}</td>
                            <td className="px-4 py-3">
                                <div className="flex gap-1">
                                    {a.is_active ? <span className="text-emerald-400 text-xs">●</span> : <span className="text-zinc-600 text-xs">●</span>}
                                    {a.is_featured && <Star className="w-3 h-3 text-gold-400 fill-current" />}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => onEdit(a.id)} className="text-zinc-400 hover:text-white p-1.5"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => onToggleActive(a.id, !a.is_active)} className="text-zinc-400 hover:text-emerald-400 p-1.5">
                                    {a.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                </button>
                                <button onClick={() => onToggleFeatured(a.id, !a.is_featured)} className="text-zinc-400 hover:text-gold-400 p-1.5">
                                    <Star className={`w-4 h-4 ${a.is_featured ? 'fill-current text-gold-400' : ''}`} />
                                </button>
                                <button onClick={() => onDelete(a.id, a.title)} className="text-zinc-400 hover:text-red-400 p-1.5"><Trash2 className="w-4 h-4" /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function EmptyState({ onCreate, hasAlbums }: any) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
            <Sparkles className="w-16 h-16 text-gold-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
                {hasAlbums ? 'Brak wyników dla filtrów' : 'Brak albumów w katalogu'}
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                {hasAlbums
                    ? 'Spróbuj zmienić kryteria wyszukiwania lub wyczyść filtry.'
                    : 'Dodaj pierwszy album z nPhoto - pojawi się w ofertach, na stronach i w panelu klienta.'}
            </p>
            {!hasAlbums && (
                <button onClick={onCreate}
                    className="bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold px-6 py-3 rounded-xl inline-flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Dodaj pierwszy album
                </button>
            )}
        </div>
    );
}

// ─── Modal: Quick create form ─────────────────────────────────────────────────
function AlbumFormModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [saving, setSaving] = useState(false);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [form, setForm] = useState({
        title: '', slug: '', subtitle: '', description: '',
        category: 'album', occasion: [] as string[],
        price: '', currency: 'PLN',
        cover_image_url: '', video_url: '', nphoto_shop_url: '', nphoto_embed_code: '',
        is_active: true, is_featured: false,
    });

    function toggleOccasion(value: string) {
        setForm(f => ({
            ...f,
            occasion: f.occasion.includes(value) ? f.occasion.filter(x => x !== value) : [...f.occasion, value]
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title.trim()) { toast.error('Tytuł jest wymagany'); return; }

        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/nphoto-albums', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    ...form,
                    slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    price: Math.round(parseFloat(form.price || '0') * 100),
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Album utworzony!');
                onSaved();
            } else {
                toast.error(data.error || 'Błąd');
            }
        } catch {
            toast.error('Błąd połączenia');
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full my-8">
                <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-900 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="text-gold-500" /> Nowy album nPhoto
                    </h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white text-2xl">×</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-zinc-300 mb-1">Tytuł *</label>
                            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="np. Premium Leather Wedding Album 30x30" required />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">Slug (URL)</label>
                            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="auto z tytułu" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">Kategoria</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none">
                                {CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-zinc-300 mb-1">Podtytuł</label>
                            <input value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="Krótki opis (do 200 znaków)" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-zinc-300 mb-1">Okazje (zaznacz pasujące)</label>
                            <div className="flex flex-wrap gap-2">
                                {OCCASIONS.map(o => (
                                    <button type="button" key={o.value} onClick={() => toggleOccasion(o.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition ${form.occasion.includes(o.value) ? 'bg-gold-500 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}>
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">Cena (PLN)</label>
                            <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="np. 599.00" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">URL okładki</label>
                            <input value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="https://..." />
                            <button type="button" onClick={() => setPickerOpen(true)}
                                className="mt-2 w-full flex items-center justify-center gap-2 border-2 border-dashed border-zinc-700 hover:border-gold-500 hover:bg-zinc-900/40 rounded-lg py-2 text-xs text-zinc-300 transition">
                                <ImageIcon className="w-4 h-4" /> Wybierz z biblioteki / wgraj
                            </button>
                            <MediaPicker
                                isOpen={pickerOpen}
                                onClose={() => setPickerOpen(false)}
                                multiple={false}
                                onSelect={(url) => {
                                    const u = Array.isArray(url) ? url[0] : url;
                                    if (u) setForm(f => ({ ...f, cover_image_url: u }));
                                    setPickerOpen(false);
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">URL wideo (YouTube/Vimeo)</label>
                            <input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="https://youtube.com/watch?v=..." />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-300 mb-1">Link do sklepu nPhoto</label>
                            <input value={form.nphoto_shop_url} onChange={e => setForm({ ...form, nphoto_shop_url: e.target.value })}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="https://nphoto.pl/..." />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-zinc-300 mb-1">Opis</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                rows={3}
                                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                                placeholder="Pełny opis produktu, materiały, jakość..." />
                        </div>
                        <div className="col-span-2 flex gap-4">
                            <label className="flex items-center gap-2 text-zinc-300">
                                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 accent-gold-500" />
                                Aktywny (widoczny publicznie)
                            </label>
                            <label className="flex items-center gap-2 text-zinc-300">
                                <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })}
                                    className="w-4 h-4 accent-gold-500" />
                                Wyróżniony
                            </label>
                        </div>
                    </div>
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 text-sm text-blue-300">
                        💡 Po utworzeniu możesz dodać więcej zdjęć podglądowych, próbki stron i kod embed nPhoto w widoku edycji.
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg">Anuluj</button>
                        <button type="submit" disabled={saving}
                            className="flex-1 bg-gold-500 hover:bg-gold-600 text-zinc-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Utwórz album
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
