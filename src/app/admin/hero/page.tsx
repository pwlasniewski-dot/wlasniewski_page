'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Plus, Trash2, Save, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

interface HeroSlide {
    id: number;
    title: string;
    subtitle: string;
    button_text: string;
    button_link: string;
    image_id: number;
    image?: { file_path: string };
    display_order: number;
    display_mode: string;
    is_active: boolean;
}

export default function HeroManagerPage() {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [editingSlide, setEditingSlide] = useState<Partial<HeroSlide> | null>(null);

    useEffect(() => {
        fetchSlides();
    }, []);

    const fetchSlides = async () => {
        try {
            const res = await fetch(getApiUrl('hero'));
            const data = await res.json();
            if (data.success) {
                setSlides(data.slides);
            }
        } catch (error) {
            toast.error('Błąd pobierania slidera');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingSlide?.image_id) {
            toast.error('Wybierz zdjęcie');
            return;
        }

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('hero'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editingSlide),
            });

            if (res.ok) {
                toast.success('Zapisano slajd');
                setEditingSlide(null);
                fetchSlides();
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten slajd?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`${getApiUrl('hero')}?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Usunięto slajd');
                fetchSlides();
            }
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    const openNewSlide = () => {
        setEditingSlide({
            title: '',
            subtitle: '',
            button_text: 'Zobacz więcej',
            button_link: '/portfolio',
            is_active: true,
            display_mode: 'BOTH',
            display_order: slides.length
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Slider na głównej</h1>
                <button
                    onClick={openNewSlide}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Dodaj slajd
                </button>
            </div>

            {/* Editor Modal / Form */}
            {editingSlide && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                    <div className="bg-zinc-900 rounded-lg p-6 max-w-2xl w-full border border-zinc-800 space-y-4">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            {editingSlide.id ? 'Edytuj slajd' : 'Nowy slajd'}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Tytuł</label>
                                <input
                                    type="text"
                                    value={editingSlide.title || ''}
                                    onChange={e => setEditingSlide({ ...editingSlide, title: e.target.value })}
                                    className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                                <input
                                    type="text"
                                    value={editingSlide.subtitle || ''}
                                    onChange={e => setEditingSlide({ ...editingSlide, subtitle: e.target.value })}
                                    className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Tekst przycisku</label>
                                <input
                                    type="text"
                                    value={editingSlide.button_text || ''}
                                    onChange={e => setEditingSlide({ ...editingSlide, button_text: e.target.value })}
                                    className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Link przycisku</label>
                                <input
                                    type="text"
                                    value={editingSlide.button_link || ''}
                                    onChange={e => setEditingSlide({ ...editingSlide, button_link: e.target.value })}
                                    className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-400 mb-1">Wyświetlanie</label>
                            <select
                                value={editingSlide.display_mode || 'BOTH'}
                                onChange={e => setEditingSlide({ ...editingSlide, display_mode: e.target.value })}
                                className="w-full bg-zinc-800 border-zinc-700 rounded-md text-white"
                            >
                                <option value="BOTH">Komputer i Telefon</option>
                                <option value="DESKTOP">Tylko Komputer</option>
                                <option value="MOBILE">Tylko Telefon</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Zdjęcie w tle</label>
                        <div className="flex items-center gap-4">
                            {editingSlide.image?.file_path ? (
                                <img src={editingSlide.image.file_path} className="h-20 w-32 object-cover rounded border border-zinc-700" />
                            ) : (
                                <div className="h-20 w-32 bg-zinc-800 rounded border border-zinc-700 flex items-center justify-center text-zinc-500">Brak</div>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowMediaPicker(true)}
                                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 hover:text-white"
                            >
                                <ImageIcon className="inline-block w-4 h-4 mr-2" />
                                Wybierz zdjęcie
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={() => setEditingSlide(null)}
                            className="px-4 py-2 text-zinc-400 hover:text-white"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-gold-500 text-black rounded hover:bg-gold-400"
                        >
                            Zapisz
                        </button>
                    </div>
                </div>
            )}

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                multiple={false}
                onSelect={(url: string | string[], id: number | number[]) => {
                    const singleUrl = Array.isArray(url) ? url[0] : url;
                    const singleId = Array.isArray(id) ? id[0] : id;
                    setEditingSlide(prev => prev ? ({ ...prev, image_id: singleId, image: { file_path: singleUrl } }) : null);
                }}
            />

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <p className="text-zinc-400">Ładowanie...</p>
                ) : slides.length === 0 ? (
                    <p className="text-zinc-400">Brak slajdów.</p>
                ) : (
                    slides.map((slide) => (
                        <div key={slide.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4">
                            <div className="h-16 w-24 flex-shrink-0 bg-zinc-800 rounded overflow-hidden">
                                {slide.image && <img src={slide.image.file_path} className="h-full w-full object-cover" />}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-white font-medium">{slide.title || '(Bez tytułu)'}</h3>
                                <p className="text-sm text-zinc-500">{slide.subtitle}</p>
                                <span className="text-xs text-zinc-600 border border-zinc-700 px-2 py-1 rounded mt-1 inline-block">
                                    {slide.display_mode === 'MOBILE' ? 'Tylko Telefon' : slide.display_mode === 'DESKTOP' ? 'Tylko Komputer' : 'Komputer i Telefon'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditingSlide(slide)} className="p-2 text-zinc-400 hover:text-gold-400">
                                    Edytuj
                                </button>
                                <button onClick={() => handleDelete(slide.id)} className="p-2 text-zinc-400 hover:text-red-400">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
