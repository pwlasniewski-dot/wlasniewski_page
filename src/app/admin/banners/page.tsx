'use client';

import { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

export default function BannersManagementPage() {
    const [settings, setSettings] = useState({
        // PromocodeBar
        promo_code_discount_enabled: false,
        promo_code: '',
        promo_code_discount_amount: 10,
        promo_code_discount_type: 'percentage',

        // GiftCardPromoBar
        gift_card_promo_enabled: false,
        gift_card_promo_title: 'Karty Podarunkowe',
        gift_card_promo_rotation_interval: 5,

        // SocialProofBanner
        social_proof_enabled: false,
        social_proof_total_clients: 0,
        urgency_slots_remaining: 5,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    useEffect(() => {
        // Check auth first
        const token = localStorage.getItem('admin_token');
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/settings', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.status === 401) {
                localStorage.removeItem('admin_token');
                window.location.href = '/admin/login';
                return;
            }

            const data = await res.json();
            if (data.success && data.settings) {
                setSettings(prev => ({
                    ...prev,
                    ...data.settings
                }));
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus('idle');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
                setSaveStatus('error');
            }
        } catch (error) {
            console.error('Save failed:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const clearLocalStorage = (key: string) => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(key);
            alert(`✅ Cleared: ${key}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="text-white">Ładowanie...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">🎯 Zarządzanie Banerkami</h1>
                    <p className="text-zinc-400">Wszystkie banery promocyjne w jednym miejscu</p>
                </div>

                {/* Save Button */}
                <div className="mb-6 flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? 'Zapisywanie...' : 'Zapisz wszystkie zmiany'}
                    </button>

                    {saveStatus === 'success' && (
                        <div className="flex items-center gap-2 text-green-400">
                            <Check className="w-5 h-5" />
                            <span>Zapisano pomyślnie!</span>
                        </div>
                    )}

                    {saveStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-5 h-5" />
                            <span>Błąd zapisu</span>
                        </div>
                    )}
                </div>

                {/* Banner Cards */}
                <div className="space-y-6">
                    {/* 1. PromocodeBar */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold mb-1">1️⃣ Kod Rabatowy (PromocodeBar)</h2>
                                <p className="text-sm text-zinc-400">Złoty box w prawym górnym rogu</p>
                            </div>
                            <button
                                onClick={() => setSettings(s => ({
                                    ...s,
                                    promo_code_discount_enabled: !s.promo_code_discount_enabled
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.promo_code_discount_enabled ? 'bg-gold-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.promo_code_discount_enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {settings.promo_code_discount_enabled && (
                            <div className="space-y-4 mt-4 pt-4 border-t border-zinc-800">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-2">Kod promocyjny</label>
                                    <input
                                        type="text"
                                        value={settings.promo_code}
                                        onChange={(e) => setSettings(s => ({ ...s, promo_code: e.target.value }))}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 focus:outline-none"
                                        placeholder="np. WYZWANIE20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-zinc-300 mb-2">Wartość rabatu</label>
                                        <input
                                            type="number"
                                            value={settings.promo_code_discount_amount}
                                            onChange={(e) => setSettings(s => ({ ...s, promo_code_discount_amount: parseInt(e.target.value) || 0 }))}
                                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-zinc-300 mb-2">Typ rabatu</label>
                                        <select
                                            value={settings.promo_code_discount_type}
                                            onChange={(e) => setSettings(s => ({ ...s, promo_code_discount_type: e.target.value }))}
                                            className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 focus:outline-none"
                                        >
                                            <option value="percentage">% (Procentowy)</option>
                                            <option value="fixed">PLN (Kwota)</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={() => clearLocalStorage('promo-' + settings.promo_code + '-dismissed')}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    🗑️ Wyczyść localStorage (pokaż ponownie)
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 2. GiftCardPromoBar */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold mb-1">2️⃣ Karty Podarunkowe (Sidebar)</h2>
                                <p className="text-sm text-zinc-400">Czarny panel z lewej strony</p>
                            </div>
                            <button
                                onClick={() => setSettings(s => ({
                                    ...s,
                                    gift_card_promo_enabled: !s.gift_card_promo_enabled
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.gift_card_promo_enabled ? 'bg-gold-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.gift_card_promo_enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {settings.gift_card_promo_enabled && (
                            <div className="space-y-4 mt-4 pt-4 border-t border-zinc-800">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-2">Tytuł</label>
                                    <input
                                        type="text"
                                        value={settings.gift_card_promo_title}
                                        onChange={(e) => setSettings(s => ({ ...s, gift_card_promo_title: e.target.value }))}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-zinc-300 mb-2">
                                        Interwał rotacji (sekundy): {settings.gift_card_promo_rotation_interval}s
                                    </label>
                                    <input
                                        type="range"
                                        min="3"
                                        max="10"
                                        value={settings.gift_card_promo_rotation_interval}
                                        onChange={(e) => setSettings(s => ({ ...s, gift_card_promo_rotation_interval: parseInt(e.target.value) }))}
                                        className="w-full"
                                    />
                                </div>

                                <button
                                    onClick={() => clearLocalStorage('giftCardPromoClosed')}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    🗑️ Wyczyść localStorage (pokaż ponownie)
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 3. SocialProofBanner */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-bold mb-1">3️⃣ Pasek Społeczny (Dół)</h2>
                                <p className="text-sm text-zinc-400">Fixed pasek na dole z statystykami</p>
                            </div>
                            <button
                                onClick={() => setSettings(s => ({
                                    ...s,
                                    social_proof_enabled: !s.social_proof_enabled
                                }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.social_proof_enabled ? 'bg-gold-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.social_proof_enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>

                        {settings.social_proof_enabled && (
                            <div className="space-y-4 mt-4 pt-4 border-t border-zinc-800">
                                <div>
                                    <label className="block text-sm text-zinc-300 mb-2">
                                        Całkowita liczba sesji: {settings.social_proof_total_clients}
                                    </label>
                                    <input
                                        type="range"
                                        min="50"
                                        max="500"
                                        step="10"
                                        value={settings.social_proof_total_clients}
                                        onChange={(e) => setSettings(s => ({ ...s, social_proof_total_clients: parseInt(e.target.value) }))}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm text-zinc-300 mb-2">
                                        Wolne miejsca w miesiącu: {settings.urgency_slots_remaining}
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={settings.urgency_slots_remaining}
                                        onChange={(e) => setSettings(s => ({ ...s, urgency_slots_remaining: parseInt(e.target.value) }))}
                                        className="w-full"
                                    />
                                </div>

                                <button
                                    onClick={() => clearLocalStorage('social-proof-banner-dismissed')}
                                    className="text-sm text-red-400 hover:text-red-300"
                                >
                                    🗑️ Wyczyść localStorage (pokaż ponownie)
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Info */}
                <div className="mt-8 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-300">
                        💡 <strong>Tip:</strong> Po zapisaniu odświeucz stronę główną (Ctrl+R) żeby zobaczyć zmiany.
                        Użytkownicy którzy zamknęli banery (kliknęli X) nie zobaczą ich ponownie do momentu wyczyszczenia localStorage.
                    </p>
                </div>
            </div>
        </div>
    );
}
