'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Save, Plus, Trash, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

interface Tile {
    id: string;
    title: string;
    description: string;
    category: string;
    price: string;
    imageUrl: string;
    linkUrl: string;
    linkText: string;
    // Styling options
    styleVariant: 'classic' | 'modern' | 'gradient' | 'outline';
    bgColor: string;
    accentColor: string;
    gradientFrom?: string;
    gradientTo?: string;
    icon?: string; // Lucide icon name
}

export default function TilesPage() {
    const [tiles, setTiles] = useState<Tile[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [currentTileId, setCurrentTileId] = useState<string | null>(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('settings'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success && data.settings?.reservation_tiles) {
                try {
                    setTiles(JSON.parse(data.settings.reservation_tiles));
                } catch (e) {
                    setTiles([]);
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            // We save tiles into a single JSON setting key 'reservation_tiles'
            // This reuses the existing generic settings system.
            const payload = {
                reservation_tiles: JSON.stringify(tiles)
            };

            const res = await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                toast.success('Kafelki zapisane!');
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const addTile = () => {
        setTiles([...tiles, {
            id: Date.now().toString(),
            title: 'Nowy Pakiet',
            description: 'Opis pakietu fotograficznego...',
            category: 'Sesja',
            price: '999',
            imageUrl: '',
            linkUrl: '/rezerwacja',
            linkText: 'Zarezerwuj',
            styleVariant: 'classic',
            bgColor: '#18181b',
            accentColor: '#d4af37',
            gradientFrom: '#000000',
            gradientTo: '#1a1a1a',
            icon: 'Camera'
        }]);
    };

    const updateTile = (id: string, field: keyof Tile, value: string) => {
        setTiles(tiles.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const removeTile = (id: string) => {
        if (confirm('Czy na pewno chcesz usunąć ten kafelek?')) {
            setTiles(tiles.filter(t => t.id !== id));
        }
    };

    const handleImageSelect = (url: string | string[]) => {
        const singleUrl = Array.isArray(url) ? url[0] : url;
        if (currentTileId) {
            updateTile(currentTileId, 'imageUrl', singleUrl);
        }
        setShowMediaPicker(false);
        setCurrentTileId(null);
    };

    if (loading) return <div className="text-white">Ładowanie...</div>;

    return (
        <div className="max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-display font-semibold text-white">Edycja Kafelków (Rezerwacja/Oferta)</h1>
                    <p className="text-zinc-400 text-sm mt-1">Stwórz kafelki z ofertą widoczne dla klientów.</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiles.map((tile) => (
                    <div key={tile.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
                        {/* Image Preview */}
                        <div className="relative h-40 bg-zinc-950 flex items-center justify-center group">
                            {tile.imageUrl ? (
                                <img src={tile.imageUrl} alt={tile.title} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-zinc-600 text-sm">Brak zdjęcia</span>
                            )}
                            <button
                                onClick={() => { setCurrentTileId(tile.id); setShowMediaPicker(true); }}
                                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                            >
                                <ImageIcon className="w-6 h-6 mr-2" /> Zmień
                            </button>
                        </div>

                        {/* Fields */}
                        <div className="p-4 space-y-3 flex-1">
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Tytuł</label>
                                <input
                                    type="text"
                                    value={tile.title}
                                    onChange={e => updateTile(tile.id, 'title', e.target.value)}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-sm px-2 py-1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Kategoria</label>
                                    <input
                                        type="text"
                                        value={tile.category}
                                        onChange={e => updateTile(tile.id, 'category', e.target.value)}
                                        placeholder="np. Ślub, Rodzina"
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-sm px-2 py-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Cena (PLN)</label>
                                    <input
                                        type="text"
                                        value={tile.price}
                                        onChange={e => updateTile(tile.id, 'price', e.target.value)}
                                        placeholder="999"
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-sm px-2 py-1"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-zinc-500 mb-1">Opis</label>
                                <textarea
                                    value={tile.description}
                                    onChange={e => updateTile(tile.id, 'description', e.target.value)}
                                    rows={3}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-sm px-2 py-1"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Link URL</label>
                                    <input
                                        type="text"
                                        value={tile.linkUrl}
                                        onChange={e => updateTile(tile.id, 'linkUrl', e.target.value)}
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-xs px-2 py-1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-1">Tekst Linku</label>
                                    <input
                                        type="text"
                                        value={tile.linkText}
                                        onChange={e => updateTile(tile.id, 'linkText', e.target.value)}
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-xs px-2 py-1"
                                    />
                                </div>
                            </div>

                            {/* STYLING OPTIONS */}
                            <div className="border-t border-zinc-800 pt-3 mt-3">
                                <h4 className="text-xs font-semibold text-gold-400 mb-2 uppercase tracking-wide">🎨 Stylizacja</h4>

                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Styl</label>
                                        <select
                                            value={tile.styleVariant || 'classic'}
                                            onChange={e => updateTile(tile.id, 'styleVariant', e.target.value as any)}
                                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-xs px-2 py-1"
                                        >
                                            <option value="classic">Klasyczny</option>
                                            <option value="modern">Nowoczesny</option>
                                            <option value="gradient">Gradient</option>
                                            <option value="outline">Kontury</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Ikona</label>
                                        <input
                                            type="text"
                                            value={tile.icon || ''}
                                            onChange={e => updateTile(tile.id, 'icon', e.target.value)}
                                            placeholder="Camera, Heart, Star"
                                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 text-xs px-2 py-1"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Tło</label>
                                        <input
                                            type="color"
                                            value={tile.bgColor || '#18181b'}
                                            onChange={e => updateTile(tile.id, 'bgColor', e.target.value)}
                                            className="block w-full h-8 rounded border-zinc-700 bg-zinc-800 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Akcent</label>
                                        <input
                                            type="color"
                                            value={tile.accentColor || '#d4af37'}
                                            onChange={e => updateTile(tile.id, 'accentColor', e.target.value)}
                                            className="block w-full h-8 rounded border-zinc-700 bg-zinc-800 cursor-pointer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-zinc-500 mb-1">Gradient</label>
                                        <input
                                            type="color"
                                            value={tile.gradientTo || '#1a1a1a'}
                                            onChange={e => updateTile(tile.id, 'gradientTo', e.target.value)}
                                            className="block w-full h-8 rounded border-zinc-700 bg-zinc-800 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-3 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
                            <button
                                onClick={() => removeTile(tile.id)}
                                className="text-red-400 hover:text-red-300 text-xs flex items-center uppercase tracking-wide font-medium"
                            >
                                <Trash className="w-3 h-3 mr-1" /> Usuń
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add New Card */}
                <button
                    onClick={addTile}
                    className="border-2 border-dashed border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-zinc-500 hover:border-gold-500 hover:text-gold-500 transition-colors min-h-[300px]"
                >
                    <Plus className="w-8 h-8 mb-2" />
                    <span className="font-medium">Dodaj Nowy Kafelek</span>
                </button>
            </div>

            {showMediaPicker && (
                <MediaPicker
                    isOpen={true}
                    onSelect={handleImageSelect}
                    onClose={() => setShowMediaPicker(false)}
                />
            )}
        </div>
    );
}
