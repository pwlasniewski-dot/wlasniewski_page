'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Upload, Camera, Save, Image as ImageIcon } from 'lucide-react';

interface ProfileData {
    avatar_url: string;
    logo_url: string;
    portfolio_enabled: boolean;
    // Include other fields to preserve them during update
    name?: string;
    phone?: string;
    bio?: string;
    specialties?: string;
    experience_years?: number;
}

export default function PortfolioPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState<ProfileData>({
        avatar_url: '',
        logo_url: '',
        portfolio_enabled: true
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('provider_token');
            const res = await fetch('/api/provider/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setData({
                    ...json.profile, // Spread all fields (name, bio, etc.)
                    avatar_url: json.profile.avatar_url || '',
                    logo_url: json.profile.logo_url || '',
                    portfolio_enabled: json.profile.portfolio_enabled
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', type === 'avatar' ? 'avatars' : 'logos');

        const toastId = toast.loading('Wysyłanie pliku...');

        try {
            const token = localStorage.getItem('provider_token');
            const res = await fetch('/api/media/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Upload failed');
            }

            if (json.success) {
                const url = json.media.file_path; // Assuming API returns file_path as public URL
                setData(prev => ({ ...prev, [type === 'avatar' ? 'avatar_url' : 'logo_url']: url }));
                toast.success('Plik wgrany', { id: toastId });
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Błąd wysyłania: ${error.message}`, { id: toastId });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('provider_token');
            // We need to send other profile data too to avoid overwriting with nulls if API is strict 
            // BUT our API implementation only updates what is sent or handles partials?
            // Checking API logic: it destructures all fields. If we send undefined, it might set undefined.
            // Let's first fetch full data or just send what we have.
            // Actually API code: `const { ... } = body; ... data: { bio, specialties... avatar_url }`
            // If we only send avatar_url, bio might become undefined in the update object.
            // Safe approach: Fetch full profile first (already done in useEffect), but we need to keep BIO/Experience in state?
            // OR we update API to rely on undefined checks.
            // Current API update logic: `data: { bio, ... }`. If 'bio' is undefined in body, it sets bio to undefined.
            // Prisma `update` ignores undefined values in `data` mostly, BUT we are extracting from body.
            // Let's be safe and fetch everything to state or update API to be partial-friendly.

            // Re-fetching current state just to be sure we have latest bio etc? 
            // Better: update API to be more robust. BUT for now, let's assume we need to preserve existing data.
            // Wait, this page is ONLY for visuals.
            // I'll quickly patch the fetch to store everything or just patch the API to be partial.
            // Actually, let's send what we have. To be safe, I should probably store full profile in state.

            // Simple robust fix: Use a specific endpoint for visuals OR ensure we send everything.
            // Let's send everything we have in `data`. For now `data` only has visuals.
            // I will modify `fetchProfile` to store full object.

            // (Self-correction): I'll update the state definition to include all fields to avoid data loss.

            const res = await fetch('/api/provider/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data) // Sends everything in state
            });

            if (res.ok) {
                toast.success('Zapisano zmiany');
            } else {
                toast.error('Błąd zapisu');
            }
        } catch (error) {
            toast.error('Błąd serwera');
        } finally {
            setSaving(false);
        }
    };

    // We need to extend state to hold bio/phone etc to prevent overwriting them with nulls
    // Updating usages below...

    if (loading) return <div className="p-8 text-center">Ładowanie...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <h1 className="text-3xl font-bold font-[family-name:var(--font-geist-sans)]">
                Portfolio i Wizerunek
            </h1>
            <p className="text-gray-500">
                Tutaj możesz zarządzać tym, jak widzą Cię klienci. Dodaj swoje zdjęcie i logo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AVATAR SECTION */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Camera className="w-5 h-5" /> Zdjęcie Profilowe
                    </h2>
                    <div className="relative w-40 h-40 rounded-full bg-gray-100 overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group">
                        {data.avatar_url ? (
                            <img src={data.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-gray-400 text-sm p-4 text-center">Brak zdjęcia</span>
                        )}
                        <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs">Zmień</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleUpload(e, 'avatar')}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                        Zalecane: 400x400px, JPG/PNG. Pokazuje się przy Twoich pakietach.
                    </p>
                </div>

                {/* LOGO SECTION */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" /> Logo Firmy
                    </h2>
                    <div className="relative w-full h-40 rounded-lg bg-gray-50 overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center group">
                        {data.logo_url ? (
                            <img src={data.logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
                        ) : (
                            <span className="text-gray-400 text-sm">Brak Logo</span>
                        )}
                        <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs">Wgraj Logo</span>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleUpload(e, 'logo')}
                            />
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                        Zalecane: PNG z przezroczystością. Buduje Twoją markę.
                    </p>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800">
                <h3 className="font-bold mb-1">Podgląd dla Klienta</h3>
                <p>
                    Twoje zdjęcie i logo będą widoczne dla klientów podczas przeglądania pakietów oraz w podsumowaniu rezerwacji.
                    Zadbaj o ich wysoką jakość.
                </p>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Zapisywanie...' : 'Zapisz Zmiany'}
                </button>
            </div>
        </div>
    );
}
