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
        social_proof_enabled: 'false',
        social_proof_total_clients: '0',
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
        payu_md5_key: '',
        payu_notify_url: '',
        payu_test_mode: true,
        // Global print prices for group galleries (amount in grosz)
        group_print_price_10x15: '150',
        group_print_price_15x21: '250',
        // Portfolio
        portfolio_categories: [] as string[] | string, // Can be array or JSON string
        portfolio_layout: 'slider', // 'slider' | 'column'
        // Gift Card Promo
        gift_card_promo_enabled: 'false',
        gift_card_promo_title: 'Karty Podarunkowe',
        gift_card_promo_description: '',
        gift_card_promo_rotation_interval: '5',
        gift_card_hero_image: '', // Store background image
        gift_card_hero_opacity: 0.6,
        // Google Drive Integration
        google_drive_client_id: '',
        google_drive_client_secret: '',
        google_drive_refresh_token: '',
        // Home Page
        hero_slider_interval: '6000',
        // B2B Basic Info (linked to b2b_footer_config)
        b2b_brand_name: '',
        b2b_tagline: '',
        b2b_phone: '',
        b2b_email: '',
        b2b_footer_config: '',
        // Split payment 50/50
        split_payment_enabled: false,
        split_payment_deposit_percent: 50,
        split_payment_remaining_due_days: 7,
        // Bank account (do przypomnień i umowy)
        bank_account_number: '',
        bank_account_holder: '',
        bank_name: '',
        bank_swift: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [currentImageField, setCurrentImageField] = useState<string>('');
    const [testingEmail, setTestingEmail] = useState(false);


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
            const res = await fetch(getApiUrl('settings'), { headers, cache: 'no-store' });

            if (res.status === 401) {
                console.error('Unauthorized (401) during fetch - redirecting to login');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return;
            }

            if (!res.ok) {
                console.error(`Failed to fetch settings: ${res.status} ${res.statusText}`);
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const data = await res.json();
            if (data.success) {
                setSettings(prev => {
                    const {
                        promo_code_discount_enabled: _legacyPromoEnabled,
                        promo_code_discount_amount: _legacyPromoAmount,
                        promo_code_discount_type: _legacyPromoType,
                        promo_code: _legacyPromoCode,
                        promo_code_expiry: _legacyPromoExpiry,
                        ...safeSettings
                    } = data.settings;
                    const newSettings = { ...prev, ...safeSettings };

                    // Helper to safely convert to string for frontend state
                    const normalizeBoolean = (val: any) => String(val) === 'true' || val === true ? 'true' : 'false';

                    // Normalize specific boolean fields that differ in DB type vs Frontend state
                    if (newSettings.urgency_enabled !== undefined) newSettings.urgency_enabled = normalizeBoolean(newSettings.urgency_enabled);
                    if (newSettings.gift_card_promo_enabled !== undefined) newSettings.gift_card_promo_enabled = normalizeBoolean(newSettings.gift_card_promo_enabled);
                    if (newSettings.navbar_sticky !== undefined) newSettings.navbar_sticky = normalizeBoolean(newSettings.navbar_sticky);
                    if (newSettings.navbar_transparent !== undefined) newSettings.navbar_transparent = normalizeBoolean(newSettings.navbar_transparent);
                    if (newSettings.social_proof_enabled !== undefined) newSettings.social_proof_enabled = normalizeBoolean(newSettings.social_proof_enabled);

                    // Parse portfolio_categories if it's a string
                    if (typeof newSettings.portfolio_categories === 'string') {
                        try {
                            const parsed = JSON.parse(newSettings.portfolio_categories);
                            if (Array.isArray(parsed)) {
                                newSettings.portfolio_categories = parsed;
                            }
                        } catch (e) {
                            // If parse fails, leave as string (might be comma separated legacy)
                            console.warn('Failed to parse portfolio_categories JSON', e);
                        }
                    }
                    // Parse B2B footer config for contact fields
                    if (newSettings.b2b_footer_config) {
                        try {
                            const b2bConfig = JSON.parse(newSettings.b2b_footer_config);
                            newSettings.b2b_brand_name = b2bConfig.brand_name || '';
                            newSettings.b2b_tagline = b2bConfig.tagline || '';
                            newSettings.b2b_phone = b2bConfig.phone || '';
                            newSettings.b2b_email = b2bConfig.email || '';
                        } catch (e) {
                            console.error('Failed to parse b2b_footer_config', e);
                        }
                    }

                    return newSettings;
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

            // Process portfolio categories if it's a string (from input)
            const settingsToSave = { ...settings } as Record<string, any>;

            // Convert boolean fields to actual booleans
            const booleanFields = ['urgency_enabled', 'gift_card_promo_enabled',
                'navbar_sticky', 'navbar_transparent', 'p24_test_mode', 'social_proof_enabled',
                'p24_method_blik', 'p24_method_card', 'p24_method_transfer', 'booking_require_payment',
                'split_payment_enabled'];

            for (const field of booleanFields) {
                if (field in settingsToSave) {
                    settingsToSave[field] = settingsToSave[field] === 'true' || settingsToSave[field] === true;
                }
            }

            // Convert numeric fields to numbers
            const numericFields = ['navbar_font_size', 'logo_size', 'smtp_port', 'urgency_slots_remaining',
                'social_proof_total_clients', 'booking_min_days_ahead', 'gift_card_promo_rotation_interval', 'gift_card_hero_opacity',
                'hero_slider_interval', 'split_payment_deposit_percent', 'split_payment_remaining_due_days'];

            for (const field of numericFields) {
                if (field in settingsToSave && settingsToSave[field] !== '' && settingsToSave[field] !== null) {
                    settingsToSave[field] = Number(settingsToSave[field]);
                }
            }

            // Fix: ensure we don't double-stringify or corrupt data
            if (typeof settings.portfolio_categories === 'string') {
                const rawVal = settings.portfolio_categories.trim();

                // If it looks like a JSON array, try parsing it first
                if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
                    try {
                        // It's likely already a JSON string (user didn't touch it, or fetchSettings failed to parse)
                        // Verify if it parses to array
                        const parsed = JSON.parse(rawVal);
                        if (Array.isArray(parsed)) {
                            settingsToSave.portfolio_categories = rawVal; // It's already good
                        } else {
                            // Not an array? Treat as string list
                            throw new Error('Not an array');
                        }
                    } catch (e) {
                        // Parse failed, treat as comma-separated list
                        const cats = rawVal.split(',').map(s => s.trim()).filter(s => s.length > 0);
                        settingsToSave.portfolio_categories = JSON.stringify(cats);
                    }
                } else {
                    // Standard comma-separated string (from user input)
                    const cats = rawVal.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    settingsToSave.portfolio_categories = JSON.stringify(cats);
                }
            } else if (Array.isArray(settings.portfolio_categories)) {
                // If it's already an array, perfect
                settingsToSave.portfolio_categories = JSON.stringify(settings.portfolio_categories);
            }

            // Ensure PayU test mode logic in backend isn't overwritten by stale payu_environment
            // The backend calculates 'payu_environment' based on 'payu_test_mode'
            // If we send 'payu_environment', it overrides the calculation because it's a direct column match
            delete (settingsToSave as any).payu_environment;

            // Prepare B2B footer config update
            if (settings.b2b_brand_name || settings.b2b_phone || settings.b2b_email) {
                let existingB2bConfig = { brand_name: '', tagline: '', phone: '', email: '', sections: {} };
                if (settings.b2b_footer_config) {
                    try {
                        existingB2bConfig = JSON.parse(settings.b2b_footer_config);
                    } catch (e) { }
                }

                const updatedB2bConfig = {
                    ...existingB2bConfig,
                    brand_name: settings.b2b_brand_name,
                    tagline: settings.b2b_tagline,
                    phone: settings.b2b_phone,
                    email: settings.b2b_email,
                };
                settingsToSave.b2b_footer_config = JSON.stringify(updatedB2bConfig);
            }

            // Remove temporary frontend-only fields
            delete settingsToSave.b2b_brand_name;
            delete settingsToSave.b2b_tagline;
            delete settingsToSave.b2b_phone;
            delete settingsToSave.b2b_email;

            // Save main settings
            const res = await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settingsToSave),
            });

            const resData = await res.json();

            if (res.status === 401) {
                toast.error('Sesja wygasła. Zaloguj się ponownie.');
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return;
            }

            if (!res.ok || !resData.success) {
                throw new Error(resData.error || 'Nie udało się zapisać ustawień');
            }


            toast.success('Zapisano wszystkie ustawienia');
        } catch (error: any) {
            toast.error(error?.message || 'Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_password || !settings.smtp_from) {
            toast.error('Wypełnij wszystkie pola SMTP przed testem');
            return;
        }

        setTestingEmail(true);
        const toastId = toast.loading('Wysyłanie wiadomości testowej...');

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/test-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    host: settings.smtp_host,
                    port: settings.smtp_port,
                    user: settings.smtp_user,
                    pass: settings.smtp_password,
                    from: settings.smtp_from,
                    testTo: settings.smtp_user // Send test to self
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(data.message || 'E-mail testowy wysłany!', { id: toastId });
            } else {
                toast.error(data.error || 'Błąd testu SMTP', { id: toastId });
            }
        } catch (error: any) {
            toast.error(`Błąd połączenia: ${error.message}`, { id: toastId });
        } finally {
            setTestingEmail(false);
        }
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
                {/* Home Page Settings */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Ustawienia Strony Głównej</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Czas przewijania Hero Slidera (ms)</label>
                            <input
                                type="number"
                                min="1000"
                                step="500"
                                value={settings.hero_slider_interval || '6000'}
                                onChange={e => setSettings(s => ({ ...s, hero_slider_interval: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                            <p className="mt-1 text-xs text-zinc-500">Domyślnie 6000ms (6 sekund). Ustaw czas wyświetlania jednego slajdu.</p>
                        </div>
                    </div>
                </div>

                {/* Promo Code source */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Kody Rabatowe (Globalne)</h2>
                    <p className="text-sm text-zinc-400 mb-4">
                        Kod, rabat, ważność i miejsca publikacji są zarządzane w jednym źródle.
                    </p>
                    <a
                        href="/admin/promo-codes"
                        className="inline-flex rounded-lg bg-gold-500 px-4 py-2 text-sm font-semibold text-black hover:bg-gold-400"
                    >
                        Przejdź do kodów promocyjnych
                    </a>
                </div>

                {/* Urgency Banner Settings */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Licznik Terminów (Pilność)</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-zinc-300">Włącz licznik na stronie głównej</label>
                            <button
                                onClick={() => setSettings(s => ({ ...s, urgency_enabled: s.urgency_enabled === 'true' ? 'false' : 'true' }))}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.urgency_enabled === 'true' ? 'bg-gold-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.urgency_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Liczba wolnych miejsc</label>
                                <input
                                    type="number"
                                    value={settings.urgency_slots_remaining || ''}
                                    onChange={e => setSettings(s => ({ ...s, urgency_slots_remaining: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Miesiąc (np. Styczeń)</label>
                                <input
                                    type="text"
                                    value={settings.urgency_month || ''}
                                    onChange={e => setSettings(s => ({ ...s, urgency_month: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Proof Banner Settings */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Pasek Społeczny (Social Proof)</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-zinc-300">Włącz pasek na stronie głównej (na dole)</label>
                            <button
                                onClick={() => setSettings(s => ({ ...s, social_proof_enabled: s.social_proof_enabled === 'true' ? 'false' : 'true' }))}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.social_proof_enabled === 'true' ? 'bg-gold-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.social_proof_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Całkowita liczba sesji (dla statystyk)</label>
                            <input
                                type="number"
                                value={settings.social_proof_total_clients || ''}
                                onChange={e => setSettings(s => ({ ...s, social_proof_total_clients: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                            <p className="mt-1 text-xs text-zinc-500">Liczba sfinalizowanych sesji fotograficznych (używana do obliczenia statystyk w pasku)</p>
                        </div>
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

                    {/* B2B Branding & Contact */}
                    <div className="md:col-span-2 bg-zinc-900 shadow rounded-lg border border-gold-500/30 p-6 mt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-gold-500" />
                            <h2 className="text-lg font-medium text-white">Informacje B2B (aeroanaliza.pl)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Logo B2B / Alternatywne</label>
                                <div className="flex flex-col gap-4">
                                    <div className="relative w-full h-32 bg-zinc-800 rounded-lg border border-zinc-600 flex items-center justify-center overflow-hidden">
                                        {settings.logo_dark_url ? (
                                            <img src={settings.logo_dark_url} alt="Logo B2B" className="max-h-full max-w-full object-contain p-2" />
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
                                            Wybierz Logo B2B
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
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Nazwa Marki B2B</label>
                                <input
                                    type="text"
                                    value={settings.b2b_brand_name || ''}
                                    onChange={e => setSettings(s => ({ ...s, b2b_brand_name: e.target.value }))}
                                    placeholder="np. FOTO-DRON Solutions"
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">E-mail B2B</label>
                                <input
                                    type="email"
                                    value={settings.b2b_email || ''}
                                    onChange={e => setSettings(s => ({ ...s, b2b_email: e.target.value }))}
                                    placeholder="biuro@..."
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Telefon B2B</label>
                                <input
                                    type="text"
                                    value={settings.b2b_phone || ''}
                                    onChange={e => setSettings(s => ({ ...s, b2b_phone: e.target.value }))}
                                    placeholder="+48 ..."
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Tagline B2B</label>
                                <input
                                    type="text"
                                    value={settings.b2b_tagline || ''}
                                    onChange={e => setSettings(s => ({ ...s, b2b_tagline: e.target.value }))}
                                    placeholder="Krótki opis pod nazwą"
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                        </div>
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
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${settings.smtp_host && settings.smtp_user && settings.smtp_password && settings.smtp_from
                        ? 'bg-green-900/30 text-green-400 border border-green-900/50'
                        : 'bg-red-900/30 text-red-400 border border-red-900/50'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${settings.smtp_host && settings.smtp_user && settings.smtp_password && settings.smtp_from
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
                            placeholder="nadawca@twoja-domena.pl"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Adres email który będzie widoczny jako nadawca wiadomości</p>
                    </div>

                    <div className="pt-4 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={handleTestEmail}
                            disabled={testingEmail}
                            className={`w-full flex justify-center items-center px-4 py-2 border border-zinc-700 rounded-md shadow-sm text-sm font-medium text-white bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 transition-colors`}
                        >
                            {testingEmail ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Testowanie...
                                </>
                            ) : (
                                '📤 Przetestuj konfigurację (Wyślij testowy e-mail)'
                            )}
                        </button>
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
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Id punktu płatności (pos_id)</label>
                            <input
                                type="text"
                                value={settings.payu_pos_id || ''}
                                onChange={e => setSettings(s => ({ ...s, payu_pos_id: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Drugi klucz (MD5)</label>
                            <input
                                type="password"
                                value={settings.payu_md5_key || ''}
                                onChange={e => setSettings(s => ({ ...s, payu_md5_key: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                            <p className="mt-1 text-xs text-zinc-500">W panelu PayU: Klucze Konfiguracji &rarr; Drugi klucz (MD5)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Protokół OAuth - client_id</label>
                            <input
                                type="text"
                                value={settings.payu_client_id || ''}
                                onChange={e => setSettings(s => ({ ...s, payu_client_id: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Protokół OAuth - client_secret</label>
                            <input
                                type="password"
                                value={settings.payu_client_secret || ''}
                                onChange={e => setSettings(s => ({ ...s, payu_client_secret: e.target.value }))}
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

                    <div className="border-t border-zinc-800 pt-4">
                        <label className="block text-sm font-medium text-zinc-400 mb-1">URL Powiadomień (Notify URL)</label>
                        <input
                            type="text"
                            value={settings.payu_notify_url || ''}
                            onChange={e => setSettings(s => ({ ...s, payu_notify_url: e.target.value }))}
                            placeholder="https://wlasniewski.pl/api/payu/notify"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Adres, na który PayU wyśle potwierdzenie wpłaty. Musi być publicznie dostępny.</p>
                    </div>
                </div>
            </div>

            {/* Płatności 50/50 (split payment) */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-1">Globalne ceny odbitek galerii grupowej</h2>
                <p className="text-xs text-zinc-500 mb-4">Te ceny obowiązują globalnie dla dokupowanych odbitek w galerii grupowej.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Odbitka 10x15 (PLN)</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={(Number(settings.group_print_price_10x15 || 0) / 100).toString()}
                            onChange={e => {
                                const parsed = Number(e.target.value);
                                setSettings(s => ({
                                    ...s,
                                    group_print_price_10x15: Number.isFinite(parsed) ? String(Math.max(0, Math.round(parsed * 100))) : '0'
                                }));
                            }}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Odbitka 15x21 (PLN)</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={(Number(settings.group_print_price_15x21 || 0) / 100).toString()}
                            onChange={e => {
                                const parsed = Number(e.target.value);
                                setSettings(s => ({
                                    ...s,
                                    group_print_price_15x21: Number.isFinite(parsed) ? String(Math.max(0, Math.round(parsed * 100))) : '0'
                                }));
                            }}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                </div>
                <p className="mt-3 text-xs text-zinc-500">W bazie zapisujemy kwoty w groszach, panel pokazuje je w PLN.</p>
            </div>

            {/* Płatności 50/50 (split payment) */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Płatności 50/50 (zaliczka + dopłata)</h2>
                <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={!!settings.split_payment_enabled}
                            onChange={e => setSettings(s => ({ ...s, split_payment_enabled: e.target.checked }))}
                            className="mt-1 w-5 h-5 rounded accent-amber-500"
                        />
                        <div>
                            <div className="text-white text-sm font-medium">Włącz opcję płatności podzielonej</div>
                            <div className="text-xs text-zinc-400 mt-0.5">
                                Klient w koszyku zobaczy wybór: pełna kwota albo zaliczka teraz + dopłata przed sesją.
                            </div>
                        </div>
                    </label>

                    {settings.split_payment_enabled && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Procent zaliczki (%)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={99}
                                    value={settings.split_payment_deposit_percent ?? 50}
                                    onChange={e => setSettings(s => ({ ...s, split_payment_deposit_percent: Number(e.target.value) }))}
                                    className="block w-32 rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                                <p className="mt-1 text-xs text-zinc-500">Domyślnie 50%. Reszta zostaje do dopłaty przed sesją.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-1">Dopłata wymagana N dni przed sesją</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={settings.split_payment_remaining_due_days ?? 7}
                                    onChange={e => setSettings(s => ({ ...s, split_payment_remaining_due_days: Number(e.target.value) }))}
                                    className="block w-32 rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                                <p className="mt-1 text-xs text-zinc-500">Klient dostanie maila przypominającego o dopłacie.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Konto bankowe (do umowy + przypomnień) */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-1">Konto bankowe</h2>
                <p className="text-xs text-zinc-500 mb-4">Używane w przypomnieniach o zaliczce i w umowach. Klient widzi numer konta w mailu.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Numer konta (IBAN)</label>
                        <input
                            type="text"
                            placeholder="PL00 0000 0000 0000 0000 0000 0000"
                            value={(settings as any).bank_account_number ?? ''}
                            onChange={e => setSettings(s => ({ ...s, bank_account_number: e.target.value }))}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2 font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Właściciel rachunku</label>
                        <input
                            type="text"
                            placeholder="Przemysław Właśniewski"
                            value={(settings as any).bank_account_holder ?? ''}
                            onChange={e => setSettings(s => ({ ...s, bank_account_holder: e.target.value }))}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">Nazwa banku</label>
                        <input
                            type="text"
                            placeholder="np. mBank, ING, PKO"
                            value={(settings as any).bank_name ?? ''}
                            onChange={e => setSettings(s => ({ ...s, bank_name: e.target.value }))}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1">SWIFT/BIC (opcjonalnie)</label>
                        <input
                            type="text"
                            placeholder="BREXPLPWMBK"
                            value={(settings as any).bank_swift ?? ''}
                            onChange={e => setSettings(s => ({ ...s, bank_swift: e.target.value }))}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2 font-mono"
                        />
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
                            value={(() => {
                                const val = settings.portfolio_categories;
                                if (Array.isArray(val)) return val.join(', ');
                                if (typeof val === 'string') {
                                    const trimmed = val.trim();
                                    // Try strict JSON parse first
                                    if (trimmed.startsWith('[')) {
                                        try {
                                            const parsed = JSON.parse(trimmed);
                                            if (Array.isArray(parsed)) return parsed.join(', ');
                                        } catch (e) {
                                            // Fallback: try replacing single quotes with double quotes
                                            try {
                                                const fixed = trimmed.replace(/'/g, '"');
                                                const parsed = JSON.parse(fixed);
                                                if (Array.isArray(parsed)) return parsed.join(', ');
                                            } catch (e2) {
                                                // If all parsing fails, return raw string to allow editing
                                                return val;
                                            }
                                        }
                                    }
                                    // If not array-like, just return the string (it might be the comma list already)
                                    return val;
                                }
                                return '';
                            })()}
                            onChange={e => {
                                const val = e.target.value;
                                setSettings(s => ({ ...s, portfolio_categories: val }));
                            }}
                            placeholder="np. Ślub, Rodzina, Portret, Komunia"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                    <p className="text-xs text-zinc-500">Wpisz kategorie oddzielone przecinkami (np. Ślub, Rodzina, Biznes). Te kategorie pojawią się przy dodawaniu nowej sesji.</p>
                </div>
            </div>

            {/* Portfolio Layout Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Układ Portfolio (Kategorie)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button
                        onClick={() => setSettings(s => ({ ...s, portfolio_layout: 'slider' }))}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${settings.portfolio_layout === 'slider'
                            ? 'border-gold-500 bg-gold-500/10'
                            : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold ${settings.portfolio_layout === 'slider' ? 'text-gold-400' : 'text-zinc-300'}`}>
                                Pełny Ekran (Slider)
                            </span>
                            {settings.portfolio_layout === 'slider' && <div className="w-3 h-3 rounded-full bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        <p className="text-xs text-zinc-400">
                            Zdjęcia wypełniają cały ekran. Użytkownik przesuwa slajdy w bok. Najlepsze dla efektu "wow".
                        </p>
                    </button>

                    <button
                        onClick={() => setSettings(s => ({ ...s, portfolio_layout: 'column' }))}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left group ${settings.portfolio_layout === 'column'
                            ? 'border-gold-500 bg-gold-500/10'
                            : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold ${settings.portfolio_layout === 'column' ? 'text-gold-400' : 'text-zinc-300'}`}>
                                Kolumna (Scroll)
                            </span>
                            {settings.portfolio_layout === 'column' && <div className="w-3 h-3 rounded-full bg-gold-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />}
                        </div>
                        <p className="text-xs text-zinc-400">
                            Zdjęcia ułożone jedno pod drugim. Użytkownik przewija w dół. Klasyczny, czytelny układ.
                        </p>
                    </button>
                </div>
            </div>

            {/* Google Drive Integration Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Google Drive - Integracja</h2>
                <p className="text-sm text-zinc-400 mb-6">Skonfiguruj dostęp do Google Drive, aby automatycznie przesyłać wygenerowane oferty i umowy.</p>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Client ID (OAuth 2.0)</label>
                        <input
                            type="text"
                            value={settings.google_drive_client_id || ''}
                            onChange={e => setSettings(s => ({ ...s, google_drive_client_id: e.target.value }))}
                            placeholder="XXX.apps.googleusercontent.com"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Znajdź w Google Cloud Console → Credentials → OAuth 2.0 Client ID (Desktop app)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Client Secret (OAuth 2.0)</label>
                        <input
                            type="password"
                            value={settings.google_drive_client_secret || ''}
                            onChange={e => setSettings(s => ({ ...s, google_drive_client_secret: e.target.value }))}
                            placeholder="••••••••••••••••••"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Klucz dostępu. Przechowywany bezpiecznie w bazie danych.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Refresh Token (Opcjonalnie)</label>
                        <input
                            type="password"
                            value={settings.google_drive_refresh_token || ''}
                            onChange={e => setSettings(s => ({ ...s, google_drive_refresh_token: e.target.value }))}
                            placeholder="••••••••••••••••••"
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-zinc-500">Token odświeżający. Zazwyczaj generowany automatycznie po autoryzacji.</p>
                    </div>

                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/50">
                        <div className="text-xs text-blue-300">
                            <strong>ℹ️ Konfiguracja:</strong> Aby włączyć integrację z Google Drive:
                            <ol className="mt-2 list-decimal list-inside space-y-1 ml-2">
                                <li>Przejdź do <a href="https://console.cloud.google.com" target="_blank" className="underline hover:text-blue-200">Google Cloud Console</a></li>
                                <li>Utwórz nowy projekt lub wybierz istniejący</li>
                                <li>Aktywuj API Google Drive</li>
                                <li>Utwórz OAuth 2.0 Credentials (Type: Desktop app)</li>
                                <li>Skopiuj Client ID i Client Secret poniżej</li>
                                <li>Zapisz ustawienia</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gift Card Shop Settings */}
            <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-white mb-4">Sklep Kart Podarunkowych - Hero</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2">Zdjęcie w tle (Hero Image)</label>
                        <div className="flex flex-col gap-4">
                            <div className="relative w-full h-48 bg-zinc-950 rounded-lg border border-zinc-700 flex items-center justify-center overflow-hidden">
                                {settings.gift_card_hero_image ? (
                                    <img src={settings.gift_card_hero_image} alt="Hero" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-zinc-600 text-sm">Brak zdjęcia - wyświetlany będzie gradient</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => openImagePicker('gift_card_hero_image')}
                                    className="flex-1 bg-zinc-800 text-white px-3 py-2 rounded-md hover:bg-zinc-700 transition-colors text-sm flex items-center justify-center gap-2 border border-zinc-600"
                                >
                                    <ImageIcon className="w-4 h-4" />
                                    Wybierz Zdjęcie
                                </button>
                                {settings.gift_card_hero_image && (
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, gift_card_hero_image: '' }))}
                                        className="bg-red-900/30 text-red-400 px-3 py-2 rounded-md hover:bg-red-900/50 transition-colors text-sm border border-red-900/50"
                                    >
                                        Usuń
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-medium text-zinc-300">Przezroczystość nakładki (Overlay)</label>
                            <span className="text-gold-400 font-bold">{Math.round((settings.gift_card_hero_opacity || 0.6) * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={settings.gift_card_hero_opacity || 0.6}
                            onChange={(e) => setSettings(s => ({ ...s, gift_card_hero_opacity: Number(e.target.value) }))}
                            className="w-full h-2 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-gold-500 hover:accent-gold-400"
                        />
                        <p className="mt-2 text-xs text-zinc-500">Im wyższa wartość, tym ciemniejsze będzie zdjęcie (więcej czarnego koloru nałożonego na obraz).</p>
                    </div>
                </div>
            </div>


            {/* Media Picker Modal */}
            {
                showMediaPicker && (
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
                )
            }
        </div >

    );
}
