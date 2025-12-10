'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Sparkles, Plus, Edit, Trash2, Eye, EyeOff, Save, X, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

interface PageEffect {
    id: number;
    page_slug: string;
    section_name: string;
    effect_type: string;
    is_enabled: boolean;
    config: string | null;
    photos_source: string; // 'portfolio', 'gallery', 'manual'
    manual_photos: string | null; // JSON string of photo URLs
}

const PAGE_OPTIONS = [
    { value: 'home', label: 'Strona Główna' },
    { value: 'foto-wyzwanie', label: 'Foto Wyzwanie (Landing)' },
    { value: 'foto-wyzwanie-galeria', label: 'Foto Wyzwanie (Galeria)' },
    { value: 'jak-sie-ubrac', label: 'Jak się ubrać' },
    { value: 'portfolio', label: 'Portfolio' },
];

const SECTION_OPTIONS = [
    { value: 'hero', label: 'Hero Section' },
    { value: 'header', label: 'Nagłówek' },
    { value: 'main', label: 'Główna sekcja' },
    { value: 'gallery', label: 'Galeria' },
    { value: 'examples', label: 'Przykłady' },
    { value: 'testimonials', label: 'Opinie' },
];

const EFFECT_TYPES = [
    { value: 'none', label: 'Brak efektu', icon: '○' },
    { value: 'carousel', label: 'Karuzela', icon: '⟲' },
    { value: 'orbiting3d', label: '3D Orbiting', icon: '🌐' },
    { value: 'masonry', label: 'Puzle (Masonry)', icon: '▦' },
    { value: 'parallax', label: 'Parallax', icon: '⟿' },
];

const PHOTO_SOURCES = [
    { value: 'portfolio', label: 'Losowe z Portfolio' },
    { value: 'manual', label: 'Wybierz ręcznie' },
];

export default function MultimediaAdminPage() {
    const [effects, setEffects] = useState<PageEffect[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEffect, setEditingEffect] = useState<PageEffect | null>(null);
    const [globalTransition, setGlobalTransition] = useState(false);

    // Media Picker State
    const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
    const [currentPickerTarget, setCurrentPickerTarget] = useState<'create' | 'edit' | null>(null);

    const [formData, setFormData] = useState({
        page_slug: 'home',
        section_name: 'hero',
        effect_type: 'carousel',
        is_enabled: true,
        photos_source: 'portfolio',
        manual_photos: '', // JSON string or comma separated for internal logic
        selected_photos: [] as string[] // Helper for UI
    });

    useEffect(() => {
        fetchEffects();
        checkGlobalTransition();
    }, []);

    const fetchEffects = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('admin/effects'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setEffects(data.effects);
            }
        } catch (error) {
            toast.error('Nie udało się pobrać efektów');
        } finally {
            setLoading(false);
        }
    };

    const checkGlobalTransition = async () => {
        // Placeholder for global transition setting
    };

    const toggleEffect = async (effect: PageEffect) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/effects/${effect.id}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...effect,
                    is_enabled: !effect.is_enabled
                })
            });

            if (res.ok) {
                toast.success(effect.is_enabled ? 'Wyłączono efekt' : 'Włączono efekt');
                fetchEffects();
            }
        } catch (error) {
            toast.error('Błąd aktualizacji');
        }
    };

    // --- Media Picker Handlers ---

    const openMediaPicker = (target: 'create' | 'edit') => {
        setCurrentPickerTarget(target);
        setMediaPickerOpen(true);
    };

    const handleMediaSelect = (url: string | string[], id?: number | number[]) => {
        const urls = Array.isArray(url) ? url : [url];

        if (currentPickerTarget === 'create') {
            setFormData(prev => ({
                ...prev,
                selected_photos: [...prev.selected_photos, ...urls]
            }));
        } else if (currentPickerTarget === 'edit' && editingEffect) {
            // Parse existing photos first
            let currentPhotos: string[] = [];
            try {
                if (editingEffect.manual_photos) {
                    currentPhotos = JSON.parse(editingEffect.manual_photos);
                    if (!Array.isArray(currentPhotos)) currentPhotos = [];
                }
            } catch (e) {
                currentPhotos = [];
            }

            const newPhotos = [...currentPhotos, ...urls];
            setEditingEffect({
                ...editingEffect,
                manual_photos: JSON.stringify(newPhotos)
            });
        }

        setMediaPickerOpen(false);
    };

    const removePhoto = (target: 'create' | 'edit', index: number) => {
        if (target === 'create') {
            setFormData(prev => ({
                ...prev,
                selected_photos: prev.selected_photos.filter((_, i) => i !== index)
            }));
        } else if (target === 'edit' && editingEffect) {
            try {
                const photos = JSON.parse(editingEffect.manual_photos || '[]');
                const newPhotos = photos.filter((_: string, i: number) => i !== index);
                setEditingEffect({
                    ...editingEffect,
                    manual_photos: JSON.stringify(newPhotos)
                });
            } catch (e) {
                console.error('Error removing photo', e);
            }
        }
    };

    // --- CRUD Operations ---

    const handleCreate = async () => {
        try {
            const token = localStorage.getItem('admin_token');

            // Process manual photos
            let photosJson = null;
            if (formData.photos_source === 'manual') {
                photosJson = JSON.stringify(formData.selected_photos);
            }

            const payload = {
                ...formData,
                manual_photos: photosJson
            };

            const res = await fetch(getApiUrl('admin/effects'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Efekt utworzony');
                setShowCreateModal(false);
                fetchEffects();
                // Reset form
                setFormData({
                    page_slug: 'home',
                    section_name: 'hero',
                    effect_type: 'carousel',
                    is_enabled: true,
                    photos_source: 'portfolio',
                    manual_photos: '',
                    selected_photos: []
                });
            }
        } catch (error) {
            toast.error('Błąd tworzenia efektu');
        }
    };

    const handleUpdate = async () => {
        if (!editingEffect) return;

        try {
            const token = localStorage.getItem('admin_token');

            // manual_photos is already updated in state as JSON string

            const payload = {
                ...editingEffect
            };

            const res = await fetch(getApiUrl(`admin/effects/${editingEffect.id}`), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Efekt zaktualizowany');
                setShowEditModal(false);
                setEditingEffect(null);
                fetchEffects();
            }
        } catch (error) {
            toast.error('Błąd aktualizacji');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Usunąć ten efekt?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`admin/effects/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Efekt usunięty');
                fetchEffects();
            }
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    const openEditModal = (effect: PageEffect) => {
        // Ensure manual_photos is in correct format (JSON string)
        let formattedPhotos = effect.manual_photos;
        if (formattedPhotos && !formattedPhotos.startsWith('[')) {
            // Try to convert legacy comma-separated string to JSON array
            const urls = formattedPhotos.split(',').map(s => s.trim()).filter(s => s);
            formattedPhotos = JSON.stringify(urls);
        }

        setEditingEffect({
            ...effect,
            manual_photos: formattedPhotos
        });
        setShowEditModal(true);
    };

    const groupedEffects = effects.reduce((acc, effect) => {
        if (!acc[effect.page_slug]) acc[effect.page_slug] = [];
        acc[effect.page_slug].push(effect);
        return acc;
    }, {} as Record<string, PageEffect[]>);

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;

    return (
        <div>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-gold-400" />
                        Efekty Wizualne
                    </h1>
                    <p className="text-zinc-400">
                        Zarządzaj efektami wizualnymi na wszystkich stronach
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nowy efekt
                </button>
            </div>

            {/* Global Settings */}
            <div className="mb-12 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-400" />
                    Ustawienia Globalne
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-white font-medium">Animacje przejścia stron</h3>
                        <p className="text-sm text-zinc-400">Płynne przejścia (fade/slide) podczas nawigacji między podstronami</p>
                    </div>
                    <button
                        onClick={() => {
                            setGlobalTransition(!globalTransition);
                            toast.success(`Animacje przejścia ${!globalTransition ? 'włączone' : 'wyłączone'}`);
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${globalTransition ? 'bg-gold-500' : 'bg-zinc-700'
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${globalTransition ? 'translate-x-6' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Effects by Page */}
            {Object.entries(groupedEffects).map(([pageSlug, pageEffects]) => {
                const pageName = PAGE_OPTIONS.find(p => p.value === pageSlug)?.label || pageSlug;

                return (
                    <div key={pageSlug} className="mb-8">
                        <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-800 pb-2">{pageName}</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pageEffects.map((effect) => (
                                <div key={effect.id} className={`bg-zinc-900 border ${effect.is_enabled ? 'border-gold-500/30' : 'border-zinc-800'} rounded-xl p-5 transition-all hover:border-gold-500/50`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xl">
                                                {EFFECT_TYPES.find(t => t.value === effect.effect_type)?.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">
                                                    {EFFECT_TYPES.find(t => t.value === effect.effect_type)?.label}
                                                </h3>
                                                <p className="text-xs text-zinc-400">
                                                    {SECTION_OPTIONS.find(s => s.value === effect.section_name)?.label || effect.section_name}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${effect.is_enabled ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {effect.is_enabled ? 'Aktywny' : 'Nieaktywny'}
                                        </div>
                                    </div>

                                    <div className="text-sm text-zinc-500 mb-4">
                                        Źródło: {PHOTO_SOURCES.find(s => s.value === effect.photos_source)?.label}
                                    </div>

                                    <div className="flex gap-2 mt-auto">
                                        <button
                                            onClick={() => toggleEffect(effect)}
                                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm flex items-center justify-center gap-2"
                                        >
                                            {effect.is_enabled ? <><EyeOff className="w-4 h-4" /> Wyłącz</> : <><Eye className="w-4 h-4" /> Włącz</>}
                                        </button>
                                        <button
                                            onClick={() => openEditModal(effect)}
                                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-gold-400 rounded"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(effect.id)}
                                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-red-400 rounded"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Dodaj nowy efekt</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Strona</label>
                                <select
                                    value={formData.page_slug}
                                    onChange={e => setFormData({ ...formData, page_slug: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                >
                                    {PAGE_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Sekcja</label>
                                <select
                                    value={formData.section_name}
                                    onChange={e => setFormData({ ...formData, section_name: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                >
                                    {SECTION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Rodzaj efektu</label>
                                <select
                                    value={formData.effect_type}
                                    onChange={e => setFormData({ ...formData, effect_type: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                >
                                    {EFFECT_TYPES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Źródło zdjęć</label>
                                <select
                                    value={formData.photos_source}
                                    onChange={e => setFormData({ ...formData, photos_source: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                >
                                    {PHOTO_SOURCES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.photos_source === 'manual' && (
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Zdjęcia</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {formData.selected_photos.map((photo, index) => (
                                            <div key={index} className="relative group">
                                                <img src={photo} alt="" className="w-16 h-16 object-cover rounded border border-zinc-700" />
                                                <button
                                                    onClick={() => removePhoto('create', index)}
                                                    className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-3 h-3 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => openMediaPicker('create')}
                                            className="w-16 h-16 border border-dashed border-zinc-600 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-400"
                                        >
                                            <Plus className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="create-enabled"
                                    checked={formData.is_enabled}
                                    onChange={e => setFormData({ ...formData, is_enabled: e.target.checked })}
                                    className="rounded border-zinc-700 bg-zinc-800 text-gold-500 focus:ring-gold-500"
                                />
                                <label htmlFor="create-enabled" className="text-white">Efekt aktywny</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 text-zinc-400 hover:text-white"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleCreate}
                                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg"
                            >
                                Utwórz
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingEffect && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Edytuj efekt</h2>
                            <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Rodzaj efektu</label>
                                <select
                                    value={editingEffect.effect_type}
                                    onChange={e => setEditingEffect({ ...editingEffect, effect_type: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                >
                                    {EFFECT_TYPES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Źródło zdjęć</label>
                                <select
                                    value={editingEffect.photos_source}
                                    onChange={e => setEditingEffect({ ...editingEffect, photos_source: e.target.value })}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-white"
                                >
                                    {PHOTO_SOURCES.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {editingEffect.photos_source === 'manual' && (
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">Zdjęcia</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(() => {
                                            try {
                                                const photos = JSON.parse(editingEffect.manual_photos || '[]');
                                                return Array.isArray(photos) ? photos.map((photo: string, index: number) => (
                                                    <div key={index} className="relative group">
                                                        <img src={photo} alt="" className="w-16 h-16 object-cover rounded border border-zinc-700" />
                                                        <button
                                                            onClick={() => removePhoto('edit', index)}
                                                            className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-white" />
                                                        </button>
                                                    </div>
                                                )) : null;
                                            } catch (e) {
                                                return null;
                                            }
                                        })()}
                                        <button
                                            onClick={() => openMediaPicker('edit')}
                                            className="w-16 h-16 border border-dashed border-zinc-600 rounded flex items-center justify-center text-zinc-500 hover:text-white hover:border-zinc-400"
                                        >
                                            <Plus className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="edit-enabled"
                                    checked={editingEffect.is_enabled}
                                    onChange={e => setEditingEffect({ ...editingEffect, is_enabled: e.target.checked })}
                                    className="rounded border-zinc-700 bg-zinc-800 text-gold-500 focus:ring-gold-500"
                                />
                                <label htmlFor="edit-enabled" className="text-white">Efekt aktywny</label>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-4 py-2 text-zinc-400 hover:text-white"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={handleUpdate}
                                className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg"
                            >
                                Zapisz
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <MediaPicker
                isOpen={mediaPickerOpen}
                onClose={() => setMediaPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={true}
            />
        </div>
    );
}
