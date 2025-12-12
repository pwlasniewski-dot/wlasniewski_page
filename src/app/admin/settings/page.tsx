'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Save, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import MediaPicker from '@/components/admin/MediaPicker';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        // Existing
        urgency_enabled: 'false',
        urgency_slots_remaining: '5',
        urgency_month: 'Styczeń',
        social_proof_total_clients: '100',
        promo_code_discount_enabled: 'false',
        promo_code_discount_amount: '10',
        promo_code_discount_type: 'percentage',
        // Navbar
        navbar_layout: 'logo_left_menu_right',
        navbar_sticky: 'true',
        navbar_transparent: 'false',
        navbar_font_size: 16,
        navbar_font_family: 'Montserrat',
        // Favicon & Logo
        favicon_url: '',
        logo_url: '',
        logo_dark_url: '',
        logo_size: 140,
        seasonal_effect: 'none',
        // Email
        smtp_host: '',
        smtp_port: '587',
        smtp_user: '',
        smtp_password: '',
        smtp_from: '',
        // SEO & Analytics
        google_analytics_id: '',
        google_tag_manager_id: '',
        facebook_pixel_id: '',
        meta_verification_google: '',
        meta_verification_facebook: '',
        // Payment P24
        p24_merchant_id: '',
        p24_pos_id: '',
        p24_crc_key: '',
        p24_api_key: '',
        p24_test_mode: true,
        p24_method_blik: true,
        p24_method_card: true,
        p24_method_transfer: true,
        // Payment PayU
        payu_client_id: '',
        payu_client_secret: '',
        payu_pos_id: '',
        payu_test_mode: true,
        // Portfolio
        portfolio_categories: [] as string[] | string, // Can be array or JSON string
        // Gift Card Promo
        gift_card_promo_enabled: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [currentImageField, setCurrentImageField] = useState<string>('');

    // Challenge Settings State
    const [challengeSettings, setChallengeSettings] = useState({
        module_enabled: true,
        public_gallery_enabled: true,
        enable_carousels: true,
        enable_parallax: false,
        fomo_countdown_hours: 24,
        monthly_challenge_limit: 10,
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            // Fetch main settings
            const res = await fetch(getApiUrl('settings'), { headers });
            const data = await res.json();
            console.log('[Admin Settings] Fetched settings:', data.settings);
            if (data.success) {
                setSettings(prev => ({ ...prev, ...data.settings }));
                console.log('[Admin Settings] Updated state with seasonal_effect:', data.settings.seasonal_effect);
            }

            // Fetch challenge settings
            const challengeRes = await fetch('/api/photo-challenge/settings', { headers });
            const challengeData = await challengeRes.json();
            if (challengeData.success) {
                setChallengeSettings(prev => ({ ...prev, ...challengeData.settings }));
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

            // Process portfolio categories if it's a string (from input)
            const settingsToSave = { ...settings };
            console.log('[Admin Settings] Saving settings with seasonal_effect:', settingsToSave.seasonal_effect);
            
            if (typeof settings.portfolio_categories === 'string') {
                // Split by comma and trim
                const cats = settings.portfolio_categories.split(',').map((s: string) => s.trim()).filter(Boolean);
                settingsToSave.portfolio_categories = JSON.stringify(cats);
            } else if (Array.isArray(settings.portfolio_categories)) {
                settingsToSave.portfolio_categories = JSON.stringify(settings.portfolio_categories);
            }

            // Save main settings
            const res = await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settingsToSave),
            });

            console.log('[Admin Settings] Save response:', { status: res.status, ok: res.ok });

            // Save challenge settings
            const challengeRes = await fetch('/api/photo-challenge/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(challengeSettings),
            });

            if (res.ok && challengeRes.ok) {
                toast.success('Zapisano wszystkie ustawienia');
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const updateChallengeSetting = (key: string, value: any) => {
        setChallengeSettings(prev => ({ ...prev, [key]: value }));
    };

    const openImagePicker = (field: string) => {
        setCurrentImageField(field);
        setShowMediaPicker(true);
    };

    const handleImageSelect = (url: string | string[], id: number | number[]) => {
        const singleUrl = Array.isArray(url) ? url[0] : url;
        setSettings(s => ({ ...s, [currentImageField]: singleUrl }));
        setShowMediaPicker(false);
        setCurrentImageField('');
    };

    if (loading) return <div className="text-white">Ładowanie...</div>;

    return (
        <div className="max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Ustawienia</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {saving ? 'Zapisywanie...' : 'Zapisz wszystkie zmiany'}
                </button>
            </div>

            <div className="grid gap-8">
                {/* Promo Code Settings */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Kody Rabatowe (Globalne)</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-zinc-400">Włącz rabat dla wszystkich</label>
                            <button
                                onClick={() => setSettings(s => ({ ...s, promo_code_discount_enabled: s.promo_code_discount_enabled === 'true' ? 'false' : 'true' }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${settings.promo_code_discount_enabled === 'true' ? 'bg-gold-500' : 'bg-zinc-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.promo_code_discount_enabled === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>

                        {settings.promo_code_discount_enabled === 'true' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Wartość rabatu</label>
                                    <input
                                        type="number"
                                        value={settings.promo_code_discount_amount}
                                        onChange={e => setSettings(s => ({ ...s, promo_code_discount_amount: e.target.value }))}
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Typ rabatu</label>
                                    <select
                                        value={settings.promo_code_discount_type}
                                        onChange={e => setSettings(s => ({ ...s, promo_code_discount_type: e.target.value }))}
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                    >
                                        <option value="percentage">% (Procentowy)</option>
                                        <option value="fixed">PLN (Kwotowy)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navbar Settings */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Wygląd Nawigacji (Navbar)</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Układ Menu</label>
                                <select
                                    value={settings.navbar_layout || 'logo_left_menu_right'}
                                    onChange={e => setSettings(s => ({ ...s, navbar_layout: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                >
                                    <option value="logo_left_menu_right">Logo po lewej, Menu po prawej</option>
                                    <option value="logo_center_menu_split">Logo na środku, Menu dzielone</option>
                                    <option value="logo_right_menu_left">Logo po prawej, Menu po lewej</option>
                                    <option value="logo_center_menu_bottom">Logo na środku, Menu pod spodem</option>
                                </select>
                                <p className="mt-1 text-xs text-zinc-500">Wybierz jak ma być rozmieszczone logo i linki w pasku nawigacji.</p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-zinc-400">Przyklejone Menu (Sticky)</label>
                                    <p className="text-xs text-zinc-500">Czy pasek ma być zawsze widoczny przy przewijaniu?</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, navbar_sticky: String(s.navbar_sticky) === 'true' ? 'false' : 'true' }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${String(settings.navbar_sticky) === 'true' ? 'bg-gold-500' : 'bg-zinc-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${String(settings.navbar_sticky) === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="text-sm font-medium text-zinc-400">Przezroczysty pasek</label>
                                    <p className="text-xs text-zinc-500">Czy pasek ma być przezroczysty na górze strony?</p>
                                </div>
                                <button
                                    onClick={() => setSettings(s => ({ ...s, navbar_transparent: String(s.navbar_transparent) === 'true' ? 'false' : 'true' }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${String(settings.navbar_transparent) === 'true' ? 'bg-gold-500' : 'bg-zinc-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${String(settings.navbar_transparent) === 'true' ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Czcionka Menu</label>
                                <select
                                    value={settings.navbar_font_family || 'Montserrat'}
                                    onChange={e => setSettings(s => ({ ...s, navbar_font_family: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                >
                                    <option value="Montserrat" style={{ fontFamily: 'Montserrat, sans-serif' }}>Montserrat (Domyślna)</option>
                                    <option value="Playfair Display" style={{ fontFamily: 'Playfair Display, serif' }}>Playfair Display (Szeryfowa)</option>
                                    <option value="Lato" style={{ fontFamily: 'Lato, sans-serif' }}>Lato (Bezszeryfowa)</option>
                                    <option value="Great Vibes" style={{ fontFamily: 'Great Vibes, cursive' }}>Great Vibes (Ozdobna)</option>
                                    <option value="Cinzel" style={{ fontFamily: 'Cinzel, serif' }}>Cinzel (Klasyczna)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Rozmiar czcionki (px)</label>
                                <input
                                    type="number"
                                    value={settings.navbar_font_size || 16}
                                    onChange={e => setSettings(s => ({ ...s, navbar_font_size: Number(e.target.value) }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logo & Branding Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Logo & Branding</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Light/Default Logo */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Logo Główne (Ciemne tło)</label>
                        <div className="flex flex-col gap-4">
                            <div className="relative w-full h-32 bg-zinc-950 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden">
                                {settings.logo_url ? (
                                    <img src={settings.logo_url} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                                ) : (
                                    <span className="text-zinc-600 text-sm">Brak logo</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openImagePicker('logo_url')}
                                    className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-md hover:bg-zinc-700 transition-colors text-sm flex items-center justify-center gap-2 border border-zinc-600"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Wybierz Logo
                                </button>
                                {settings.logo_url && (
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, logo_url: '' }))}
                                        className="bg-red-900/30 text-red-400 px-3 py-2 rounded-md hover:bg-red-900/50 transition-colors text-sm border border-red-900/50"
                                    >
                                        Usuń
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={settings.logo_url || ''}
                                onChange={e => setSettings(s => ({ ...s, logo_url: e.target.value }))}
                                placeholder="https://..."
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-zinc-500 text-xs shadow-sm focus:border-gold-500 focus:ring-gold-500 px-2 py-1"
                            />
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Logo używane na ciemnym tle (np. Strona Główna, Footer).</p>
                    </div>

                    {/* Logo Size Control */}
                    <div className="md:col-span-2 bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-zinc-300">Rozmiar Logo (piksele)</label>
                            <span className="text-gold-400 font-bold">{settings.logo_size || 140}px</span>
                        </div>
                        <input
                            type="range"
                            min="40"
                            max="300"
                            step="5"
                            value={settings.logo_size || 140}
                            onChange={(e) => setSettings(s => ({ ...s, logo_size: Number(e.target.value) }))}
                            className="w-full h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-gold-500 hover:accent-gold-400"
                        />
                        <p className="mt-2 text-xs text-zinc-500">Przesuń suwak, aby dostosować szerokość logo w nawigacji. Wysokość dopasuje się automatycznie.</p>
                    </div>

                    {/* Dark/White-bg Logo */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Logo Alternatywne (Jasne tło)</label>
                        <div className="flex flex-col gap-4">
                            <div className="relative w-full h-32 bg-white rounded-lg border border-zinc-200 flex items-center justify-center overflow-hidden">
                                {settings.logo_dark_url ? (
                                    <img src={settings.logo_dark_url} alt="Logo Dark" className="max-h-full max-w-full object-contain p-2" />
                                ) : (
                                    <span className="text-zinc-400 text-sm">Brak logo</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openImagePicker('logo_dark_url')}
                                    className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-md hover:bg-zinc-700 transition-colors text-sm flex items-center justify-center gap-2 border border-zinc-600"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Wybierz Logo
                                </button>
                                {settings.logo_dark_url && (
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, logo_dark_url: '' }))}
                                        className="bg-red-900/30 text-red-400 px-3 py-2 rounded-md hover:bg-red-900/50 transition-colors text-sm border border-red-900/50"
                                    >
                                        Usuń
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                value={settings.logo_dark_url || ''}
                                onChange={e => setSettings(s => ({ ...s, logo_dark_url: e.target.value }))}
                                placeholder="https://..."
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-zinc-500 text-xs shadow-sm focus:border-gold-500 focus:ring-gold-500 px-2 py-1"
                            />
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Logo używane na jasnym tle (np. Podstrony, Mobilne Menu).</p>
                    </div>
                </div>

                {/* Seasonal Effects */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6 mt-8">
                    <h2 className="text-lg font-medium text-white mb-4">Dekoracje Sezonowe</h2>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Aktywny Efekt</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { id: 'none', label: 'Brak', icon: '⛔' },
                                { id: 'snow', label: 'Zima / Śnieg', icon: '❄️' },
                                { id: 'lights', label: 'Światełka', icon: '💡' },
                                { id: 'hearts', label: 'Walentynki', icon: '❤️' },
                                { id: 'halloween', label: 'Halloween', icon: '👻' },
                                { id: 'easter', label: 'Wielkanoc', icon: '🐰' },
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setSettings(s => ({ ...s, seasonal_effect: opt.id }))}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${settings.seasonal_effect === opt.id
                                        ? 'border-gold-400 bg-gold-400/10 text-white'
                                        : 'border-zinc-700 hover:bg-zinc-800 text-zinc-400'
                                        }`}
                                >
                                    <span className="text-2xl">{opt.icon}</span>
                                    <span className="text-sm font-bold">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-zinc-500">
                            Wybrany efekt będzie widoczny na całej stronie dla wszystkich użytkowników.
                        </p>
                    </div>
                </div>
            </div>

            {/* Favicon Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Favicon</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Wgraj plik favicon</label>
                        <input
                            type="file"
                            accept=".ico,.png,.svg,.jpg,.jpeg"
                            onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                try {
                                    const token = localStorage.getItem('admin_token');
                                    const res = await fetch('/api/favicon/upload', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` },
                                        body: formData
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                        setSettings(s => ({ ...s, favicon_url: data.faviconUrl }));
                                        toast.success('Favicon wgrane!');
                                    } else {
                                        toast.error(data.error || 'Błąd wgrywania');
                                    }
                                } catch (error) {
                                    toast.error('Błąd wgrywania favicon');
                                }
                            }}
                            className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-gold-500 file:text-black hover:file:bg-gold-400" />
                        <p className="mt-1 text-xs text-zinc-500">Obsługiwane formaty: .ico, .png, svg, .jpg</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-sm">lub</span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">URL Favicon</label>
                        <input
                            type="text"
                            value={settings.favicon_url || ''}
                            onChange={e => setSettings(s => ({ ...s, favicon_url: e.target.value }))}
                            placeholder="https://example.com/favicon.ico"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Lub podaj pełny URL do favicon</p>
                    </div>
                    {settings.favicon_url && (
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Podgląd</label>
                            <img src={settings.favicon_url} alt="Favicon" className="w-8 h-8" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                        </div>
                    )}
                </div>
            </div>

            {/* Email Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-white">Konfiguracja Email (SMTP)</h2>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                        settings.smtp_host && settings.smtp_user && settings.smtp_password && settings.smtp_from
                            ? 'bg-green-900/30 text-green-400 border border-green-900/50'
                            : 'bg-red-900/30 text-red-400 border border-red-900/50'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            settings.smtp_host && settings.smtp_user && settings.smtp_password && settings.smtp_from
                                ? 'bg-green-500'
                                : 'bg-red-500'
                        }`}></div>
                        {settings.smtp_host && settings.smtp_user && settings.smtp_password && settings.smtp_from
                            ? '✅ Skonfigurowany'
                            : '⚠️ Niekompletny'}
                    </div>
                </div>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Host SMTP</label>
                            <input
                                type="text"
                                value={settings.smtp_host || ''}
                                onChange={e => setSettings(s => ({ ...s, smtp_host: e.target.value }))}
                                placeholder="smtp.gmail.com"
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Port SMTP</label>
                            <input
                                type="text"
                                value={settings.smtp_port || '587'}
                                onChange={e => setSettings(s => ({ ...s, smtp_port: e.target.value }))}
                                placeholder="587"
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Użytkownik SMTP (Email)</label>
                        <input
                            type="email"
                            value={settings.smtp_user || ''}
                            onChange={e => setSettings(s => ({ ...s, smtp_user: e.target.value }))}
                            placeholder="your-email@gmail.com"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Hasło SMTP</label>
                        <input
                            type="password"
                            value={settings.smtp_password || ''}
                            onChange={e => setSettings(s => ({ ...s, smtp_password: e.target.value }))}
                            placeholder="••••••••"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Email nadawcy (From)</label>
                        <input
                            type="email"
                            value={settings.smtp_from || ''}
                            onChange={e => setSettings(s => ({ ...s, smtp_from: e.target.value }))}
                            placeholder="kontakt@wlasniewski.pl"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Adres email który będzie widoczny jako nadawca wiadomości</p>
                    </div>
                </div>
            </div>

            {/* SEO & Analytics Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">SEO & Analityka</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Google Analytics ID</label>
                        <input
                            type="text"
                            value={settings.google_analytics_id || ''}
                            onChange={e => setSettings(s => ({ ...s, google_analytics_id: e.target.value }))}
                            placeholder="G-XXXXXXXXXX lub UA-XXXXXXXXX-X"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Measurement ID z Google Analytics 4</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Google Tag Manager ID</label>
                        <input
                            type="text"
                            value={settings.google_tag_manager_id || ''}
                            onChange={e => setSettings(s => ({ ...s, google_tag_manager_id: e.target.value }))}
                            placeholder="GTM-XXXXXXX"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Container ID z Google Tag Manager</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Facebook Pixel ID</label>
                        <input
                            type="text"
                            value={settings.facebook_pixel_id || ''}
                            onChange={e => setSettings(s => ({ ...s, facebook_pixel_id: e.target.value }))}
                            placeholder="XXXXXXXXXXXXXXXX"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Pixel ID z Facebook Business</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Meta Tag - Google Weryfikacja</label>
                            <input
                                type="text"
                                value={settings.meta_verification_google || ''}
                                onChange={e => setSettings(s => ({ ...s, meta_verification_google: e.target.value }))}
                                placeholder="content value z Google Search Console"
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Meta Tag - Facebook Weryfikacja</label>
                            <input
                                type="text"
                                value={settings.meta_verification_facebook || ''}
                                onChange={e => setSettings(s => ({ ...s, meta_verification_facebook: e.target.value }))}
                                placeholder="content value z Facebook Business"
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                        <p className="text-xs text-zinc-400">
                            💡 <strong>Wskazówka:</strong> Kod Google Analytics i Facebook Pixel zostanie automatycznie dodany do wszystkich stron. Nie musisz ręcznie wstawiać kodu.
                        </p>
                    </div>
                </div>
            </div>


            {/* Payment Settings (Przelewy24) */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Konfiguracja Płatności (Przelewy24)</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Merchant ID</label>
                            <input
                                type="text"
                                value={settings.p24_merchant_id || ''}
                                onChange={e => setSettings(s => ({ ...s, p24_merchant_id: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">POS ID</label>
                            <input
                                type="text"
                                value={settings.p24_pos_id || ''}
                                onChange={e => setSettings(s => ({ ...s, p24_pos_id: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">CRC Key</label>
                            <input
                                type="password"
                                value={settings.p24_crc_key || ''}
                                onChange={e => setSettings(s => ({ ...s, p24_crc_key: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">API Key</label>
                            <input
                                type="password"
                                value={settings.p24_api_key || ''}
                                onChange={e => setSettings(s => ({ ...s, p24_api_key: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-400">Tryb Testowy (Sandbox)</label>
                            <p className="text-xs text-zinc-500">Użyj sandbox.przelewy24.pl zamiast produkcji</p>
                        </div>
                        <button
                            onClick={() => setSettings(s => ({ ...s, p24_test_mode: !s.p24_test_mode }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.p24_test_mode ? 'bg-gold-500' : 'bg-zinc-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.p24_test_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="border-t border-zinc-800 pt-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-3">Aktywne metody płatności</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer bg-zinc-800 px-3 py-2 rounded-md">
                                <input
                                    type="checkbox"
                                    checked={settings.p24_method_blik !== false}
                                    onChange={e => setSettings(s => ({ ...s, p24_method_blik: e.target.checked }))}
                                    className="rounded border-zinc-600 bg-zinc-700 text-gold-500 focus:ring-gold-500"
                                />
                                <span className="text-sm text-white">BLIK</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-zinc-800 px-3 py-2 rounded-md">
                                <input
                                    type="checkbox"
                                    checked={settings.p24_method_card !== false}
                                    onChange={e => setSettings(s => ({ ...s, p24_method_card: e.target.checked }))}
                                    className="rounded border-zinc-600 bg-zinc-700 text-gold-500 focus:ring-gold-500"
                                />
                                <span className="text-sm text-white">Karty Płatnicze</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer bg-zinc-800 px-3 py-2 rounded-md">
                                <input
                                    type="checkbox"
                                    checked={settings.p24_method_transfer !== false}
                                    onChange={e => setSettings(s => ({ ...s, p24_method_transfer: e.target.checked }))}
                                    className="rounded border-zinc-600 bg-zinc-700 text-gold-500 focus:ring-gold-500"
                                />
                                <span className="text-sm text-white">Szybkie Przelewy</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Settings (PayU) */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Konfiguracja Płatności (PayU)</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Client ID</label>
                            <input
                                type="text"
                                value={settings.payu_client_id || ''}
                                onChange={e => setSettings(s => ({ ...s, payu_client_id: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Client Secret</label>
                            <input
                                type="password"
                                value={settings.payu_client_secret || ''}
                                onChange={e => setSettings(s => ({ ...s, payu_client_secret: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">POS ID</label>
                            <input
                                type="text"
                                value={settings.payu_pos_id || ''}
                                onChange={e => setSettings(s => ({ ...s, payu_pos_id: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-400">Tryb Testowy (Sandbox)</label>
                            <p className="text-xs text-zinc-500">Użyj sandbox.payu.com zamiast produkcji</p>
                        </div>
                        <button
                            onClick={() => setSettings(s => ({ ...s, payu_test_mode: !s.payu_test_mode }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.payu_test_mode ? 'bg-gold-500' : 'bg-zinc-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.payu_test_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Portfolio Categories */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Kategorie Portfolio</h2>
                <div className="space-y-4">
                    <p className="text-sm text-zinc-400 mb-2">Zarządzaj dostępnymi kategoriami w portfolio. Oddziel kategorie przecinkami.</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={Array.isArray(settings.portfolio_categories)
                                ? settings.portfolio_categories.join(', ')
                                : typeof settings.portfolio_categories === 'string' && settings.portfolio_categories.trim().startsWith('[')
                                    ? (() => {
                                        try {
                                            return JSON.parse(settings.portfolio_categories).join(', ');
                                        } catch {
                                            return '';
                                        }
                                    })()
                                    : (typeof settings.portfolio_categories === 'string' ? settings.portfolio_categories : '')}
                            onChange={e => {
                                const val = e.target.value;
                                // We keep it as string in local state, but convert to array on save if needed, or simple string split
                                // Let's simplify: settings state holds whatever API returns. 
                                // On save, we should ideally format it. For now, let's treat it as a special field.
                                // Actually, let's make it an array in state if we can.
                                // For now, simple text input, will process in handleSave or useEffect?
                                // Let's try raw string update:
                                setSettings(s => ({ ...s, portfolio_categories: val }));
                            }}
                            placeholder="np. Ślub, Rodzina, Portret, Komunia"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <p className="text-xs text-zinc-500">Wpisz kategorie oddzielone przecinkami (np. Ślub, Rodzina, Biznes). Te kategorie pojawią się przy dodawaniu nowej sesji.</p>
                </div>
            </div>

            {/* Photo Challenge Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Foto-Wyzwanie (Konfiguracja)</h2>
                <div className="space-y-6">
                    {/* Module Toggle */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-400">Włącz Moduł Wyzwań</label>
                            <p className="text-xs text-zinc-500">Czy cały moduł ma być dostępny publicznie?</p>
                        </div>
                        <button
                            onClick={() => updateChallengeSetting('module_enabled', !challengeSettings.module_enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${challengeSettings.module_enabled ? 'bg-gold-500' : 'bg-zinc-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${challengeSettings.module_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Public Gallery */}
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-400">Publiczna Galeria Par</label>
                            <p className="text-xs text-zinc-500">Pokaż stronę /foto-wyzwanie/galeria</p>
                        </div>
                        <button
                            onClick={() => updateChallengeSetting('public_gallery_enabled', !challengeSettings.public_gallery_enabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${challengeSettings.public_gallery_enabled ? 'bg-gold-500' : 'bg-zinc-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${challengeSettings.public_gallery_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    {/* Visual Effects */}
                    <div>
                        <h3 className="text-sm font-medium text-gold-400 mb-3">Efekty Wizualne</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg">
                                <label className="text-sm text-zinc-300">Karuzela 3D (Orbiting)</label>
                                <button
                                    onClick={() => updateChallengeSetting('enable_carousels', !challengeSettings.enable_carousels)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${challengeSettings.enable_carousels ? 'bg-gold-500' : 'bg-zinc-600'}`}
                                >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${challengeSettings.enable_carousels ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between bg-zinc-800/50 p-3 rounded-lg">
                                <label className="text-sm text-zinc-300">Efekt Paralaksy</label>
                                <button
                                    onClick={() => updateChallengeSetting('enable_parallax', !challengeSettings.enable_parallax)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${challengeSettings.enable_parallax ? 'bg-gold-500' : 'bg-zinc-600'}`}
                                >
                                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${challengeSettings.enable_parallax ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* FOMO Settings */}
                    <div>
                        <h3 className="text-sm font-medium text-gold-400 mb-3">FOMO & Limity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Czas na akceptację (h)</label>
                                <input
                                    type="number"
                                    value={challengeSettings.fomo_countdown_hours}
                                    onChange={e => updateChallengeSetting('fomo_countdown_hours', Number(e.target.value))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Limit miesięczny (sloty)</label>
                                <input
                                    type="number"
                                    value={challengeSettings.monthly_challenge_limit}
                                    onChange={e => updateChallengeSetting('monthly_challenge_limit', Number(e.target.value))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Picker Modal */}
            {showMediaPicker && (
                <MediaPicker
                    isOpen={showMediaPicker}
                    onClose={() => {
                        setShowMediaPicker(false);
                        setCurrentImageField('');
                    }}
                    onSelect={(url: string | string[], id: number | number[]) => {
                        if (typeof url === 'string') {
                            handleImageSelect(url, typeof id === 'number' ? id : 0);
                        }
                    }}
                />
            )}
        </div>
    );
}
