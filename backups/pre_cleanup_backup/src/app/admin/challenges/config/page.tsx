'use client';

import { useState, useEffect } from 'react';
import { Save, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

interface ChallengeSettings {
    module_enabled: boolean;
    landing_headline: string;
    landing_subtitle: string;
    cta_button_text: string;
    social_proof_enabled: boolean;
    enable_circular_grids: boolean;
}

interface PageEffect {
    id?: number;
    effect_type: string;
    is_enabled: boolean;
    config: string;
    manual_photos: string; // JSON array of strings
}

export default function ChallengeConfigPage() {
    const [settings, setSettings] = useState<ChallengeSettings>({
        module_enabled: true,
        landing_headline: '',
        landing_subtitle: '',
        cta_button_text: 'Zacznij wyzwanie',
        social_proof_enabled: true,
        enable_circular_grids: true
    });

    // Carousel State
    const [carouselPhotos, setCarouselPhotos] = useState<string[]>([]);
    const [showMediaPicker, setShowMediaPicker] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // Fetch general settings
            const settingsRes = await fetch('/api/photo-challenge/settings', { headers });
            const settingsData = await settingsRes.json();
            if (settingsData.success) {
                setSettings(prev => ({ ...prev, ...settingsData.settings }));
            }

            // Fetch carousel photos (PageEffect for 'foto-wyzwanie' section 'main')
            const effectsRes = await fetch('/api/effects?page=foto-wyzwanie&section=main');
            const effectsData = await effectsRes.json();

            if (effectsData.success && effectsData.effects.length > 0) {
                const effect = effectsData.effects[0];
                try {
                    const photos = JSON.parse(effect.manual_photos || '[]');
                    setCarouselPhotos(photos);
                } catch (e) {
                    setCarouselPhotos([]);
                }
            }
        } catch (error) {
            toast.error('Błąd pobierania konfiguracji');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };

            // 1. Save Settings
            const settingsPromise = fetch('/api/photo-challenge/settings', {
                method: 'POST',
                headers,
                body: JSON.stringify(settings)
            });

            // 2. Save Carousel Photos (PageEffect)
            const effectBody = {
                page_slug: 'foto-wyzwanie',
                section_name: 'main',
                effect_type: 'carousel', // Force carousel
                is_enabled: true,
                manual_photos: JSON.stringify(carouselPhotos),
                config: JSON.stringify({ autoplay: true, interval: 3000 }) // Default config
            };

            const effectPromise = fetch('/api/photo-challenge/config', { // Need to ensure this route exists or use /api/effects/manage
                method: 'POST',
                headers,
                body: JSON.stringify(effectBody)
            });

            const [settingsRes, effectRes] = await Promise.all([settingsPromise, effectPromise]);

            if (settingsRes.ok && effectRes.ok) {
                toast.success('Zapisano konfigurację');
            } else {
                toast.error('Błąd zapisu niektórych ustawień');
            }
        } catch (error) {
            toast.error('Wystąpił błąd');
        }
    };

    const handleAddPhotos = (urls: string | string[]) => {
        const newPhotos = Array.isArray(urls) ? urls : [urls];
        setCarouselPhotos(prev => [...prev, ...newPhotos]);
        setShowMediaPicker(false);
    };

    const removePhoto = (index: number) => {
        setCarouselPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const movePhoto = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === carouselPhotos.length - 1) return;

        const newPhotos = [...carouselPhotos];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newPhotos[index], newPhotos[targetIndex]] = [newPhotos[targetIndex], newPhotos[index]];
        setCarouselPhotos(newPhotos);
    };

    if (loading) return <div>Ładowanie...</div>;

    return (
        <div className="text-white max-w-4xl">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-display text-gold-400">Konfiguracja Wyzwań</h1>
                <button
                    onClick={handleSave}
                    className="bg-gold-500 hover:bg-gold-600 text-black px-6 py-2 rounded-lg flex items-center gap-2 font-medium"
                >
                    <Save size={20} /> Zapisz Zmiany
                </button>
            </div>

            {/* General Settings */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <span className="w-1 h-6 bg-gold-500 rounded-full"></span>
                    Ustawienia Ogólne
                </h2>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                        <input
                            type="checkbox"
                            id="moduleEnabled"
                            checked={settings.module_enabled}
                            onChange={e => setSettings({ ...settings, module_enabled: e.target.checked })}
                            className="w-5 h-5 rounded bg-zinc-800 border-zinc-600 text-gold-500 focus:ring-gold-500"
                        />
                        <label htmlFor="moduleEnabled" className="font-medium cursor-pointer">Włącz Moduł Foto-Wyzwań</label>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Nagłówek Strony (H1)</label>
                        <input
                            type="text"
                            value={settings.landing_headline}
                            onChange={e => setSettings({ ...settings, landing_headline: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                            placeholder="Przyjmij foto-wyzwanie"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Podtytuł</label>
                        <input
                            type="text"
                            value={settings.landing_subtitle}
                            onChange={e => setSettings({ ...settings, landing_subtitle: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                            placeholder="Zaproś kogoś na sesję..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Tekst przycisku CTA</label>
                        <input
                            type="text"
                            value={settings.cta_button_text}
                            onChange={e => setSettings({ ...settings, cta_button_text: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-white"
                            placeholder="Zacznij wyzwanie"
                        />
                    </div>
                </div>
            </div>

            {/* Carousel Images */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <span className="w-1 h-6 bg-gold-500 rounded-full"></span>
                        Zdjęcia Karuzeli (Strona Główna Wyzwań)
                    </h2>
                    <button
                        onClick={() => setShowMediaPicker(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2"
                    >
                        <Plus size={16} /> Dodaj Zdjęcia
                    </button>
                </div>

                {carouselPhotos.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-xl text-zinc-500">
                        <ImageIcon className="mx-auto w-12 h-12 mb-2 opacity-50" />
                        <p>Brak zdjęć w karuzeli. Dodaj zdjęcia, aby ożywić stronę!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {carouselPhotos.map((url, index) => (
                            <div key={index} className="group relative aspect-[2/3] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800">
                                <img src={url} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />

                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => movePhoto(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 bg-white/20 hover:bg-white/40 rounded text-white disabled:opacity-30"
                                    >
                                        ←
                                    </button>
                                    <button
                                        onClick={() => movePhoto(index, 'down')}
                                        disabled={index === carouselPhotos.length - 1}
                                        className="p-1 bg-white/20 hover:bg-white/40 rounded text-white disabled:opacity-30"
                                    >
                                        →
                                    </button>
                                    <button
                                        onClick={() => removePhoto(index)}
                                        className="p-1 bg-red-500/80 hover:bg-red-600 rounded text-white"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <MediaPicker
                isOpen={showMediaPicker}
                onClose={() => setShowMediaPicker(false)}
                onSelect={handleAddPhotos}
                multiple={true}
            />
        </div>
    );
}
