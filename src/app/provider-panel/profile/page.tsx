'use client';

import { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import Image from 'next/image';
import { getApiUrl } from '@/lib/api-config';
import MediaPicker from '@/components/admin/MediaPicker';
import { Camera, Upload, X, Save, User, Phone, FileText, Star } from 'lucide-react';

export default function ProviderProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userBase, setUserBase] = useState<any>(null);

    // Form State
    const [bio, setBio] = useState('');
    const [phone, setPhone] = useState('');
    const [specialties, setSpecialties] = useState(''); // Comma separated string for UI
    const [avatarUrl, setAvatarUrl] = useState('');
    const [highlightPhotos, setHighlightPhotos] = useState<string[]>([]);

    // Media Picker State
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerMode, setPickerMode] = useState<'avatar' | 'portfolio'>('avatar');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('provider_token');
            if (!token) return;

            const res = await fetch('/api/provider/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const profile = data.profile || {};
                setUserBase(data.user_base);

                setBio(profile.bio || '');
                setPhone(data.user_base?.phone || '');
                setAvatarUrl(profile.avatar_url || '');

                // Parse Highlights
                try {
                    const photos = typeof profile.highlight_photos === 'string'
                        ? JSON.parse(profile.highlight_photos)
                        : profile.highlight_photos;
                    setHighlightPhotos(Array.isArray(photos) ? photos : []);
                } catch (e) {
                    setHighlightPhotos([]);
                }

                // Parse Specialties
                try {
                    const specs = typeof profile.specialties === 'string'
                        ? JSON.parse(profile.specialties)
                        : profile.specialties;
                    setSpecialties(Array.isArray(specs) ? specs.join(', ') : '');
                } catch (e) {
                    setSpecialties('');
                }
            }
        } catch (error) {
            console.error('Failed to load profile', error);
            toast.error('Błąd ładowania profilu');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('provider_token');
            const specialtiesArray = specialties.split(',').map(s => s.trim()).filter(Boolean);

            const res = await fetch('/api/provider/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    bio,
                    phone,
                    avatar_url: avatarUrl,
                    highlight_photos: highlightPhotos,
                    specialties: specialtiesArray
                })
            });

            if (res.ok) {
                toast.success('Profil zaktualizowany');
            } else {
                toast.error('Błąd zapisu');
            }
        } catch (error) {
            console.error('Save error', error);
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const handleMediaSelect = (urls: string | string[]) => {
        if (pickerMode === 'avatar') {
            const url = Array.isArray(urls) ? urls[0] : urls;
            if (url) setAvatarUrl(url);
        } else {
            // Portfolio: Add new photos (up to 5 total)
            const newUrls = Array.isArray(urls) ? urls : [urls];
            setHighlightPhotos(prev => {
                const combined = [...prev, ...newUrls];
                // Unique filter
                const unique = Array.from(new Set(combined));
                if (unique.length > 5) {
                    toast.warning('Maksymalnie 5 zdjęć. Dodano tylko pierwsze pasujące.');
                    return unique.slice(0, 5);
                }
                return unique;
            });
        }
        setPickerOpen(false);
    };

    const removePhoto = (urlToRemove: string) => {
        setHighlightPhotos(prev => prev.filter(url => url !== urlToRemove));
    };

    if (loading) return <div className="p-8 text-white">Ładowanie...</div>;

    return (
        <div className="p-8 max-w-5xl mx-auto text-white">
            <Toaster position="top-right" theme="dark" />

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Twoja Wizytówka</h1>
                    <p className="text-zinc-400">Tak widzą Cię klienci podczas rezerwacji.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gold-500 hover:bg-gold-400 text-black px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info & Avatar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
                        <div className="relative inline-block mb-4 group">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-800 bg-zinc-950 relative">
                                {avatarUrl ? (
                                    <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <User size={48} />
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => { setPickerMode('avatar'); setPickerOpen(true); }}
                                className="absolute bottom-0 right-0 bg-gold-500 text-black p-2 rounded-full hover:bg-gold-400 transition shadow-lg"
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                        <h2 className="text-xl font-bold">{userBase?.name}</h2>
                        <p className="text-zinc-500 text-sm">{userBase?.email}</p>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <h3 className="font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
                            <Phone size={16} className="text-gold-500" /> Kontakt
                        </h3>
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Telefon</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-gold-500 outline-none"
                                placeholder="+48 000 000 000"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Bio & Portfolio */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bio Section */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
                        <h3 className="font-bold border-b border-zinc-800 pb-2 flex items-center gap-2">
                            <FileText size={16} className="text-gold-500" /> O Mnie
                        </h3>
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Specjalizacje (oddziel przecinkami)</label>
                            <input
                                type="text"
                                value={specialties}
                                onChange={(e) => setSpecialties(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-gold-500 outline-none mb-4"
                                placeholder="Śluby, Portret Biznesowy, Eventy"
                            />
                        </div>
                        <div>
                            <label className="block text-xs uppercase text-zinc-500 font-bold mb-1">Bio / Opis</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                rows={6}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-gold-500 outline-none resize-none"
                                placeholder="Opisz swoje doświadczenie i styl pracy..."
                            />
                        </div>
                    </div>

                    {/* Mini Portfolio */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4 border-b border-zinc-800 pb-2">
                            <h3 className="font-bold flex items-center gap-2">
                                <Star size={16} className="text-gold-500" /> Mini-Portfolio
                            </h3>
                            <span className="text-xs text-zinc-500">{highlightPhotos.length}/5 zdjęć</span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                            {highlightPhotos.map((url, idx) => (
                                <div key={idx} className="aspect-square relative group rounded-lg overflow-hidden border border-zinc-800">
                                    <Image src={url} alt={`Portfolio ${idx}`} fill className="object-cover" />
                                    <button
                                        onClick={() => removePhoto(url)}
                                        className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}

                            {highlightPhotos.length < 5 && (
                                <button
                                    onClick={() => { setPickerMode('portfolio'); setPickerOpen(true); }}
                                    className="aspect-square border-2 border-dashed border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-600 hover:border-gold-500 hover:text-gold-500 transition gap-2"
                                >
                                    <Upload size={24} />
                                    <span className="text-xs font-bold">Dodaj</span>
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">
                            Te zdjęcia będą wyświetlane przy Twoim profilu, gdy klient będzie wybierał wykonawcę. Wybierz swoje najlepsze prace!
                        </p>
                    </div>
                </div>
            </div>

            <MediaPicker
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleMediaSelect}
                multiple={pickerMode === 'portfolio'}
            />
        </div>
    );
}
