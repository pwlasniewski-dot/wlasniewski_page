'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Save, Globe, BarChart3, Tag, ExternalLink, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AeroanalizaSettings {
    b2b_google_analytics_id: string;
    b2b_google_tag_manager_id: string;
    b2b_facebook_pixel_id: string;
    b2b_brand_name: string;
    b2b_tagline: string;
    b2b_phone: string;
    b2b_email: string;
    logo_dark_url: string;
    b2b_footer_config: string;
}

export default function AeroanalizaSettingsPage() {
    const [settings, setSettings] = useState<AeroanalizaSettings>({
        b2b_google_analytics_id: '',
        b2b_google_tag_manager_id: '',
        b2b_facebook_pixel_id: '',
        b2b_brand_name: '',
        b2b_tagline: '',
        b2b_phone: '',
        b2b_email: '',
        logo_dark_url: '',
        b2b_footer_config: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('settings'), {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
            });

            if (res.status === 401) {
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return;
            }

            const data = await res.json();
            if (data.success) {
                const s = data.settings;
                let brandName = '', tagline = '', phone = '', email = '';

                if (s.b2b_footer_config) {
                    try {
                        const config = JSON.parse(s.b2b_footer_config);
                        brandName = config.brand_name || '';
                        tagline = config.tagline || '';
                        phone = config.phone || '';
                        email = config.email || '';
                    } catch {}
                }

                setSettings({
                    b2b_google_analytics_id: s.b2b_google_analytics_id || '',
                    b2b_google_tag_manager_id: s.b2b_google_tag_manager_id || '',
                    b2b_facebook_pixel_id: s.b2b_facebook_pixel_id || '',
                    b2b_brand_name: brandName,
                    b2b_tagline: tagline,
                    b2b_phone: phone,
                    b2b_email: email,
                    logo_dark_url: s.logo_dark_url || '',
                    b2b_footer_config: s.b2b_footer_config || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings', error);
            toast.error('Błąd pobierania ustawień');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');

            // Build B2B footer config
            let existingConfig: any = {};
            if (settings.b2b_footer_config) {
                try { existingConfig = JSON.parse(settings.b2b_footer_config); } catch {}
            }
            const updatedConfig = {
                ...existingConfig,
                brand_name: settings.b2b_brand_name,
                tagline: settings.b2b_tagline,
                phone: settings.b2b_phone,
                email: settings.b2b_email,
            };

            const payload: Record<string, any> = {
                b2b_google_analytics_id: settings.b2b_google_analytics_id || null,
                b2b_google_tag_manager_id: settings.b2b_google_tag_manager_id || null,
                b2b_facebook_pixel_id: settings.b2b_facebook_pixel_id || null,
                logo_dark_url: settings.logo_dark_url,
                b2b_footer_config: JSON.stringify(updatedConfig),
            };

            const res = await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (res.status === 401) {
                toast.error('Sesja wygasła. Zaloguj się ponownie.');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return;
            }

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Nie udało się zapisać ustawień');
            }

            toast.success('Ustawienia aeroanaliza.pl zapisane');
        } catch (error: any) {
            toast.error(error?.message || 'Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Globe className="h-7 w-7 text-blue-400" />
                        Ustawienia — aeroanaliza.pl
                    </h1>
                    <p className="text-zinc-400 mt-1">
                        Konfiguracja domeny B2B / dronowej
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Zapisywanie...' : 'Zapisz'}
                </button>
            </div>

            {/* Stream Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="text-blue-400 font-semibold flex items-center gap-2 mb-4">
                    <BarChart3 className="h-5 w-5" />
                    Szczegóły strumienia Google Analytics 4
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-zinc-500">Nazwa strumienia:</span>
                        <span className="text-zinc-200 ml-2">aeroanaliza</span>
                    </div>
                    <div>
                        <span className="text-zinc-500">URL strumienia:</span>
                        <a
                            href="https://aeroanaliza.pl"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 ml-2 inline-flex items-center gap-1"
                        >
                            https://aeroanaliza.pl <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <div>
                        <span className="text-zinc-500">Identyfikator strumienia:</span>
                        <span className="text-zinc-200 ml-2 font-mono">14310616254</span>
                    </div>
                    <div>
                        <span className="text-zinc-500">Identyfikator pomiaru:</span>
                        <span className="text-zinc-200 ml-2 font-mono">G-SMQ3HPZXFB</span>
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-200">
                    <strong>Uwaga:</strong> Zbieranie danych nie jest włączone w Twojej witrynie. Jeśli od instalacji tagów minęło ponad 48 godzin, upewnij się, że zostały poprawnie skonfigurowane. Po zapisaniu ustawień tag GA4 zostanie automatycznie zainstalowany na aeroanaliza.pl.
                </div>
            </div>

            {/* Analytics Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    Analityka i śledzenie (aeroanaliza.pl)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                            Google Analytics 4 — Identyfikator pomiaru
                        </label>
                        <input
                            type="text"
                            value={settings.b2b_google_analytics_id}
                            onChange={(e) => setSettings(s => ({ ...s, b2b_google_analytics_id: e.target.value }))}
                            placeholder="G-SMQ3HPZXFB"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        />
                        <p className="text-xs text-zinc-500 mt-1">
                            Osobny identyfikator GA4 dla domeny aeroanaliza.pl
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                            Google Tag Manager ID
                        </label>
                        <input
                            type="text"
                            value={settings.b2b_google_tag_manager_id}
                            onChange={(e) => setSettings(s => ({ ...s, b2b_google_tag_manager_id: e.target.value }))}
                            placeholder="GTM-XXXXXXX"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                            Facebook Pixel ID
                        </label>
                        <input
                            type="text"
                            value={settings.b2b_facebook_pixel_id}
                            onChange={(e) => setSettings(s => ({ ...s, b2b_facebook_pixel_id: e.target.value }))}
                            placeholder="123456789012345"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                        />
                    </div>
                </div>
            </div>

            {/* B2B Branding Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Tag className="h-5 w-5 text-emerald-400" />
                    Dane firmowe (aeroanaliza.pl)
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Nazwa firmy</label>
                        <input
                            type="text"
                            value={settings.b2b_brand_name}
                            onChange={(e) => setSettings(s => ({ ...s, b2b_brand_name: e.target.value }))}
                            placeholder="Aeroanaliza"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tagline / Slogan</label>
                        <input
                            type="text"
                            value={settings.b2b_tagline}
                            onChange={(e) => setSettings(s => ({ ...s, b2b_tagline: e.target.value }))}
                            placeholder="Profesjonalne usługi dronowe"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Email kontaktowy</label>
                        <input
                            type="email"
                            value={settings.b2b_email}
                            onChange={(e) => setSettings(s => ({ ...s, b2b_email: e.target.value }))}
                            placeholder="kontakt@aeroanaliza.pl"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Telefon</label>
                        <input
                            type="tel"
                            value={settings.b2b_phone}
                            onChange={(e) => setSettings(s => ({ ...s, b2b_phone: e.target.value }))}
                            placeholder="+48 123 456 789"
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Logo B2B (URL)</label>
                        <input
                            type="text"
                            value={settings.logo_dark_url}
                            onChange={(e) => setSettings(s => ({ ...s, logo_dark_url: e.target.value }))}
                            placeholder="https://..."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {settings.logo_dark_url && (
                            <div className="mt-3 p-3 bg-zinc-800 rounded-lg inline-block">
                                <img src={settings.logo_dark_url} alt="Logo B2B" className="h-12 object-contain" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Zapisywanie...' : 'Zapisz ustawienia aeroanaliza.pl'}
                </button>
            </div>
        </div>
    );
}
