'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, EyeOff, Star, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getSeasonLabel } from '@/lib/styleGuideSeason';

interface OutfitItem {
    image_url: string;
    name: string;
    color_hex: string;
    category?: string;
    person?: string;
}

interface OutfitSet {
    id: number;
    title: string;
    slug: string;
    description: string | null;
    category: string | null;
    season: string | null;
    location_type: string | null;
    group_size: number | null;
    outfit_details: OutfitItem[] | any;
    is_featured: boolean;
    is_active: boolean;
    display_order: number;
    palette?: { id: number; name: string } | null;
}

export default function AdminStyleGuideOutfitsPage() {
    const router = useRouter();
    const [outfits, setOutfits] = useState<OutfitSet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOutfits();
    }, []);

    const fetchOutfits = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/style-guide/outfits', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setOutfits(data.data);
        } catch (e) {
            toast.error('Błąd ładowania zestawów');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Usunąć ten zestaw?')) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/style-guide/outfits/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Usunięto');
                fetchOutfits();
            } else {
                toast.error(data.error || 'Błąd usuwania');
            }
        } catch (e) {
            toast.error('Błąd');
        }
    };

    const toggleField = async (id: number, field: 'is_active' | 'is_featured', value: boolean) => {
        try {
            const token = localStorage.getItem('admin_token');
            await fetch(`/api/admin/style-guide/outfits/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ [field]: value })
            });
            fetchOutfits();
        } catch (e) {
            toast.error('Błąd');
        }
    };

    const createNew = async () => {
        const title = prompt('Nazwa zestawu (np. "Rodzina jesienią w lesie"):');
        if (!title) return;
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/style-guide/outfits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ title, outfit_details: [] })
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/admin/style-guide/outfits/${data.data.id}`);
            } else {
                toast.error(data.error || 'Błąd');
            }
        } catch (e) {
            toast.error('Błąd');
        }
    };

    if (loading) {
        return <div className="p-8 text-zinc-400">Ładowanie...</div>;
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-gold-400" />
                        Stylizacje (Outfit Sets)
                    </h1>
                    <p className="text-zinc-400">
                        Buduj kompletne zestawy odzieżowe składając pojedyncze elementy w jeden kafelek.
                    </p>
                </div>
                <button
                    onClick={createNew}
                    className="px-5 py-3 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nowy zestaw
                </button>
            </div>

            {outfits.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
                    <Sparkles className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-400 mb-4">Brak zestawów. Dodaj pierwszy!</p>
                    <button
                        onClick={createNew}
                        className="px-5 py-3 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg"
                    >
                        Utwórz zestaw
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {outfits.map(o => {
                        const items: OutfitItem[] = Array.isArray(o.outfit_details) ? o.outfit_details : [];
                        const seasonLabel = getSeasonLabel(o.season);
                        return (
                            <div key={o.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                                {/* Mini collage preview */}
                                <div className="aspect-square bg-zinc-950 grid grid-cols-2 gap-1 p-1">
                                    {items.slice(0, 4).map((item, idx) => (
                                        <div key={idx} className="relative bg-white overflow-hidden">
                                            {item.image_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div
                                                    className="w-full h-full"
                                                    style={{ backgroundColor: item.color_hex || '#444' }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <div className="col-span-2 row-span-2 flex items-center justify-center text-zinc-600 text-sm">
                                            Brak elementów
                                        </div>
                                    )}
                                </div>

                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-semibold text-white">{o.title}</h3>
                                        <div className="flex gap-1 flex-shrink-0">
                                            {o.is_featured && <Star className="w-4 h-4 text-gold-400 fill-gold-400" />}
                                            {o.is_active ? (
                                                <Eye className="w-4 h-4 text-emerald-400" />
                                            ) : (
                                                <EyeOff className="w-4 h-4 text-zinc-600" />
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1 mb-3 text-xs">
                                        {seasonLabel && <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{seasonLabel}</span>}
                                        {o.category && <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{o.category}</span>}
                                        {o.location_type && <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-400">{o.location_type}</span>}
                                    </div>

                                    <p className="text-xs text-zinc-500 mb-3">
                                        {items.length} {items.length === 1 ? 'element' : 'elementów'}
                                    </p>

                                    <div className="flex gap-2">
                                        <Link
                                            href={`/admin/style-guide/outfits/${o.id}`}
                                            className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm flex items-center justify-center gap-1"
                                        >
                                            <Edit className="w-4 h-4" /> Edytuj
                                        </Link>
                                        <button
                                            onClick={() => toggleField(o.id, 'is_featured', !o.is_featured)}
                                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm"
                                            title={o.is_featured ? 'Usuń z polecanych' : 'Dodaj do polecanych'}
                                        >
                                            <Star className={`w-4 h-4 ${o.is_featured ? 'fill-gold-400 text-gold-400' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => toggleField(o.id, 'is_active', !o.is_active)}
                                            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm"
                                            title={o.is_active ? 'Ukryj' : 'Pokaż'}
                                        >
                                            {o.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(o.id)}
                                            className="px-3 py-2 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded text-sm"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
