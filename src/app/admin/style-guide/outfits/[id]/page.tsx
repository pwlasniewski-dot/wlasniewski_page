'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, MoveUp, MoveDown, Image as ImageIcon, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

interface OutfitItem {
    image_url: string;
    name: string;
    color_hex: string;
    category?: string;
    person?: string;
}

interface ColorPalette {
    id: number;
    name: string;
    colors: any;
    season?: string | null;
}

const CATEGORIES = ['Bluzka', 'Sukienka', 'Spodnie', 'Spódnica', 'Sweter', 'Marynarka', 'Buty', 'Dodatki', 'Inne'];
const PEOPLE = ['Mama', 'Tata', 'Dziecko 1', 'Dziecko 2', 'Dziecko 3', 'Para', 'Inne'];
const SEASONS = ['wiosna', 'lato', 'jesień', 'zima'];
const LOCATIONS = ['plener', 'studio', 'miasto', 'las', 'plaża', 'góry', 'dom'];

export default function OutfitEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [palettes, setPalettes] = useState<ColorPalette[]>([]);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTarget, setPickerTarget] = useState<number | null>(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        category: '',
        season: '',
        location_type: '',
        group_size: '' as string | number,
        age_group: '',
        palette_id: '' as string | number,
        is_featured: false,
        is_active: true,
        display_order: 0,
        outfit_details: [] as OutfitItem[]
    });

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const [outfitRes, palettesRes] = await Promise.all([
                fetch(`/api/admin/style-guide/outfits/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('/api/admin/style-guide/palettes', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            const outfit = await outfitRes.json();
            const palettesData = await palettesRes.json();

            if (outfit.success) {
                const o = outfit.data;
                setForm({
                    title: o.title || '',
                    description: o.description || '',
                    category: o.category || '',
                    season: o.season || '',
                    location_type: o.location_type || '',
                    group_size: o.group_size ?? '',
                    age_group: o.age_group || '',
                    palette_id: o.palette_id ?? '',
                    is_featured: !!o.is_featured,
                    is_active: !!o.is_active,
                    display_order: o.display_order ?? 0,
                    outfit_details: Array.isArray(o.outfit_details) ? o.outfit_details : []
                });
            }
            if (palettesData.success) setPalettes(palettesData.data);
        } catch (e) {
            toast.error('Błąd ładowania');
        } finally {
            setLoading(false);
        }
    };

    const save = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/style-guide/outfits/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...form,
                    group_size: form.group_size === '' ? null : Number(form.group_size),
                    palette_id: form.palette_id === '' ? null : Number(form.palette_id)
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Zapisano');
            } else {
                toast.error(data.error || 'Błąd zapisu');
            }
        } catch (e) {
            toast.error('Błąd');
        } finally {
            setSaving(false);
        }
    };

    const addItem = () => {
        setForm(f => ({
            ...f,
            outfit_details: [
                ...f.outfit_details,
                { image_url: '', name: '', color_hex: '#cccccc', category: '', person: '' }
            ]
        }));
    };

    const updateItem = (idx: number, patch: Partial<OutfitItem>) => {
        setForm(f => ({
            ...f,
            outfit_details: f.outfit_details.map((item, i) => i === idx ? { ...item, ...patch } : item)
        }));
    };

    const removeItem = (idx: number) => {
        setForm(f => ({
            ...f,
            outfit_details: f.outfit_details.filter((_, i) => i !== idx)
        }));
    };

    const moveItem = (idx: number, dir: -1 | 1) => {
        const target = idx + dir;
        if (target < 0 || target >= form.outfit_details.length) return;
        const next = [...form.outfit_details];
        [next[idx], next[target]] = [next[target], next[idx]];
        setForm(f => ({ ...f, outfit_details: next }));
    };

    const openPicker = (idx: number) => {
        setPickerTarget(idx);
        setPickerOpen(true);
    };

    const handlePick = (url: string | string[]) => {
        const u = Array.isArray(url) ? url[0] : url;
        if (pickerTarget !== null) {
            updateItem(pickerTarget, { image_url: u });
        }
        setPickerOpen(false);
        setPickerTarget(null);
    };

    // Sugerowane kolory z wybranej palety
    const selectedPalette = palettes.find(p => p.id === Number(form.palette_id));
    const paletteColors: any[] = Array.isArray(selectedPalette?.colors) ? selectedPalette!.colors : [];

    if (loading) return <div className="p-8 text-zinc-400">Ładowanie...</div>;

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto pb-32">
            <Link href="/admin/style-guide/outfits" className="text-zinc-400 hover:text-white text-sm flex items-center gap-2 mb-4">
                <ArrowLeft className="w-4 h-4" /> Wszystkie zestawy
            </Link>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-8">Edytuj zestaw</h1>

            {/* Podstawowe info */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6 space-y-4">
                <h2 className="text-lg font-semibold text-white mb-2">Podstawowe informacje</h2>
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Tytuł *</label>
                    <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Opis</label>
                    <textarea
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Sezon</label>
                        <select
                            value={form.season}
                            onChange={e => setForm(f => ({ ...f, season: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                        >
                            <option value="">—</option>
                            {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Lokalizacja</label>
                        <select
                            value={form.location_type}
                            onChange={e => setForm(f => ({ ...f, location_type: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                        >
                            <option value="">—</option>
                            {LOCATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Kategoria</label>
                        <input
                            type="text"
                            value={form.category}
                            placeholder="np. Rodzinna"
                            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Liczba osób</label>
                        <input
                            type="number"
                            value={form.group_size}
                            onChange={e => setForm(f => ({ ...f, group_size: e.target.value }))}
                            className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm text-zinc-400 mb-1">Powiązana paleta kolorów</label>
                    <select
                        value={form.palette_id}
                        onChange={e => setForm(f => ({ ...f, palette_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    >
                        <option value="">— Brak —</option>
                        {palettes.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.season ? `(${p.season})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-white text-sm">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                            className="w-4 h-4"
                        />
                        Aktywny
                    </label>
                    <label className="flex items-center gap-2 text-white text-sm">
                        <input
                            type="checkbox"
                            checked={form.is_featured}
                            onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                            className="w-4 h-4"
                        />
                        Polecany (pokaż na stronie głównej Jak się ubrać)
                    </label>
                    <div className="flex items-center gap-2 text-white text-sm">
                        <span>Kolejność:</span>
                        <input
                            type="number"
                            value={form.display_order}
                            onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))}
                            className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-800 rounded"
                        />
                    </div>
                </div>
            </div>

            {/* Elementy odzieżowe */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white mb-1">
                            Elementy zestawu ({form.outfit_details.length})
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Dodaj zdjęcia pojedynczych ubrań (np. koszula, spodnie, buty). Razem stworzą jeden kafelek z całym strojem.
                        </p>
                    </div>
                    <button
                        onClick={addItem}
                        className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Dodaj element
                    </button>
                </div>

                {/* Sugerowane kolory z palety */}
                {paletteColors.length > 0 && (
                    <div className="mb-4 p-3 bg-zinc-950 rounded border border-zinc-800">
                        <p className="text-xs text-zinc-400 mb-2 flex items-center gap-2">
                            <Palette className="w-3 h-3" /> Kolory z powiązanej palety (kliknij aby skopiować):
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {paletteColors.map((c: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => {
                                        navigator.clipboard.writeText(c.hex);
                                        toast.success(`Skopiowano ${c.hex}`);
                                    }}
                                    className="flex items-center gap-2 px-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-700"
                                >
                                    <div className="w-5 h-5 rounded border border-white/20" style={{ backgroundColor: c.hex }} />
                                    <span className="text-xs text-zinc-300">{c.name || c.hex}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {form.outfit_details.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 border border-dashed border-zinc-800 rounded">
                        Brak elementów. Kliknij "Dodaj element" aby zacząć budować zestaw.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {form.outfit_details.map((item, idx) => (
                            <div key={idx} className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 grid grid-cols-12 gap-3 items-start">
                                {/* Image */}
                                <div className="col-span-12 md:col-span-3">
                                    <label className="block text-xs text-zinc-500 mb-1">Zdjęcie ubrania</label>
                                    <button
                                        onClick={() => openPicker(idx)}
                                        className="w-full aspect-square bg-white border-2 border-dashed border-zinc-700 hover:border-gold-500 rounded flex items-center justify-center overflow-hidden"
                                    >
                                        {item.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="text-zinc-400 text-xs text-center px-2">
                                                <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                                                Wybierz zdjęcie
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Pola */}
                                <div className="col-span-12 md:col-span-8 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Nazwa elementu</label>
                                            <input
                                                type="text"
                                                value={item.name}
                                                placeholder="np. Lniana koszula"
                                                onChange={e => updateItem(idx, { name: e.target.value })}
                                                className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Kategoria</label>
                                            <select
                                                value={item.category || ''}
                                                onChange={e => updateItem(idx, { category: e.target.value })}
                                                className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-white"
                                            >
                                                <option value="">—</option>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Osoba</label>
                                            <select
                                                value={item.person || ''}
                                                onChange={e => updateItem(idx, { person: e.target.value })}
                                                className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-white"
                                            >
                                                <option value="">—</option>
                                                {PEOPLE.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-zinc-500 mb-1">Kolor</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={item.color_hex || '#cccccc'}
                                                    onChange={e => updateItem(idx, { color_hex: e.target.value })}
                                                    className="h-8 w-12 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={item.color_hex || ''}
                                                    onChange={e => updateItem(idx, { color_hex: e.target.value })}
                                                    placeholder="#cccccc"
                                                    className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-sm text-white font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Akcje */}
                                <div className="col-span-12 md:col-span-1 flex md:flex-col gap-1 justify-end">
                                    <button
                                        onClick={() => moveItem(idx, -1)}
                                        disabled={idx === 0}
                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded disabled:opacity-30"
                                    >
                                        <MoveUp className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => moveItem(idx, 1)}
                                        disabled={idx === form.outfit_details.length - 1}
                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded disabled:opacity-30"
                                    >
                                        <MoveDown className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={() => removeItem(idx)}
                                        className="p-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 rounded"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Sticky save bar */}
            <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 px-6 py-4 flex justify-end gap-3 z-50">
                <Link
                    href="/admin/style-guide/outfits"
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-medium"
                >
                    Anuluj
                </Link>
                <button
                    onClick={save}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-black rounded font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Zapisywanie...' : 'Zapisz zestaw'}
                </button>
            </div>

            <MediaPicker
                isOpen={pickerOpen}
                onClose={() => {
                    setPickerOpen(false);
                    setPickerTarget(null);
                }}
                onSelect={handlePick}
            />
        </div>
    );
}
