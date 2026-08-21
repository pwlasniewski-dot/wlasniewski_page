'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Save, Globe, BarChart3, Tag, ExternalLink, AlertTriangle, WandSparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { AERO_SITE } from '@/lib/aeroanaliza/content';

interface AeroanalizaSettings {
    b2b_google_analytics_id: string;
    b2b_google_tag_manager_id: string;
    b2b_facebook_pixel_id: string;
}

export default function AeroanalizaSettingsPage() {
    const [settings, setSettings] = useState<AeroanalizaSettings>({
        b2b_google_analytics_id: '',
        b2b_google_tag_manager_id: '',
        b2b_facebook_pixel_id: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);

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
                setSettings({
                    b2b_google_analytics_id: s.b2b_google_analytics_id || '',
                    b2b_google_tag_manager_id: s.b2b_google_tag_manager_id || '',
                    b2b_facebook_pixel_id: s.b2b_facebook_pixel_id || '',
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

            const payload: Record<string, any> = {
                b2b_google_analytics_id: settings.b2b_google_analytics_id || null,
                b2b_google_tag_manager_id: settings.b2b_google_tag_manager_id || null,
                b2b_facebook_pixel_id: settings.b2b_facebook_pixel_id || null,
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

    const publishProfessionalPages = async () => {
        setPublishing(true);
        try {
            const token = localStorage.getItem('admin_token');
            const previewResponse = await fetch('/api/admin/aeroanaliza/publish-v2', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store',
            });
            const preview = await previewResponse.json();
            if (!previewResponse.ok || !preview.success) throw new Error(preview.error || 'Nie udało się sprawdzić stron');
            const toCreate = preview.pages.filter((page: { action: string }) => page.action === 'create').length;
            const toConvert = preview.pages.filter((page: { action: string }) => page.action === 'convert_with_backup').length;
            const confirmed = window.confirm(`Plan: utworzenie ${toCreate} brakujących stron i konwersja ${toConvert} starszych stron. Przed każdą konwersją zostanie zapisany pełny snapshot. Kontynuować?`);
            if (!confirmed) return;

            const response = await fetch('/api/admin/aeroanaliza/publish-v2', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: 'convert', confirm: 'REPLACE_LEGACY_AERO_CONTENT' }),
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || 'Nie udało się przygotować stron');
            const created = data.pages.filter((page: { action: string }) => page.action === 'created').length;
            const converted = data.pages.filter((page: { action: string }) => page.action === 'converted_with_backup').length;
            const skipped = data.pages.filter((page: { action: string }) => page.action === 'skipped').length;
            toast.success(`Utworzono: ${created}, przekonwertowano z backupem: ${converted}, bez zmian: ${skipped}.`);
        } catch (error: any) {
            toast.error(error?.message || 'Błąd przygotowania stron');
        } finally {
            setPublishing(false);
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
                <div className="flex flex-wrap justify-end gap-3">
                    <button onClick={publishProfessionalPages} disabled={publishing} className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-5 py-2.5 font-medium text-emerald-300 transition-colors hover:bg-emerald-400/20 disabled:opacity-50" title="Najpierw pokazuje plan. Starsze treści konwertuje dopiero po potwierdzeniu i zapisaniu pełnego snapshotu.">
                        <WandSparkles className="h-4 w-4" />
                        {publishing ? 'Przygotowywanie…' : 'Sprawdź i wdroż strony v2'}
                    </button>
                    <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50">
                        <Save className="h-4 w-4" />
                        {saving ? 'Zapisywanie...' : 'Zapisz'}
                    </button>
                </div>
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

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                    <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4"><span className="block text-zinc-500">Marka</span><strong className="text-white">{AERO_SITE.name}</strong></p>
                    <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4"><span className="block text-zinc-500">Nazwa prawna</span><strong className="text-white">{AERO_SITE.legalName}</strong></p>
                    <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4"><span className="block text-zinc-500">Jedyny adres e-mail</span><strong className="text-white">{AERO_SITE.email}</strong></p>
                    <p className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4"><span className="block text-zinc-500">Telefon</span><strong className="text-white">{AERO_SITE.phone}</strong></p>
                </div>
                <p className="text-xs leading-relaxed text-zinc-500">Dane tożsamości są celowo zarządzane w jednym, wersjonowanym źródle kodu i używane przez nagłówek, stopkę, formularz, e-mail oraz schema.org. Treści ofert i media pozostają edytowalne w CMS.</p>
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
