'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SocioPage() {
    const [settings, setSettings] = useState({
        urgency_enabled: 'false',
        urgency_slots_remaining: '5',
        urgency_month: 'Styczeń',
        social_proof_total_clients: '100',
        promo_code_discount_enabled: 'false',
        promo_code_discount_amount: '10',
        promo_code_discount_type: 'percentage',
        promo_code: '',
        promo_code_expiry: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch(getApiUrl('settings'));
            const data = await res.json();
            if (data.success) {
                setSettings(prev => ({ ...prev, ...data.settings }));
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
            const res = await fetch(getApiUrl('settings'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                toast.success('Zapisano ustawienia');
            } else {
                throw new Error('Save failed');
            }
        } catch (error) {
            toast.error('Błąd zapisu');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">Ładowanie...</div>;

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Socjotechniki</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50"
                >
                    <Save className="-ml-1 mr-2 h-5 w-5" />
                    {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
                </button>
            </div>

            <div className="grid gap-8">
                {/* Urgency Section */}
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
                                    value={settings.urgency_slots_remaining}
                                    onChange={e => setSettings(s => ({ ...s, urgency_slots_remaining: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Miesiąc (np. Styczeń)</label>
                                <input
                                    type="text"
                                    value={settings.urgency_month}
                                    onChange={e => setSettings(s => ({ ...s, urgency_month: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Proof Section */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Dowód Społeczny</h2>
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Całkowita liczba klientów (licznik)</label>
                        <input
                            type="number"
                            value={settings.social_proof_total_clients}
                            onChange={e => setSettings(s => ({ ...s, social_proof_total_clients: e.target.value }))}
                            className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                        />
                    </div>
                </div>

                {/* Promo Code Discount Section */}
                <div className="bg-zinc-900 shadow rounded-lg border border-zinc-800 p-6">
                    <h2 className="text-lg font-medium text-white mb-4">Rabat z kodem promocyjnym</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-zinc-300">Włącz zniżkę po wpisaniu kodu</label>
                            <button
                                onClick={() => setSettings(s => ({ ...s, promo_code_discount_enabled: s.promo_code_discount_enabled === 'true' ? 'false' : 'true' }))}
                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.promo_code_discount_enabled === 'true' ? 'bg-gold-500' : 'bg-zinc-700'
                                    }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.promo_code_discount_enabled === 'true' ? 'translate-x-5' : 'translate-x-0'
                                        }`}
                                />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Wartość zniżki</label>
                                <input
                                    type="number"
                                    value={settings.promo_code_discount_amount}
                                    onChange={e => setSettings(s => ({ ...s, promo_code_discount_amount: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Rodzaj zniżki</label>
                                <select
                                    value={settings.promo_code_discount_type}
                                    onChange={e => setSettings(s => ({ ...s, promo_code_discount_type: e.target.value }))}
                                    className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                >
                                    <option value="percentage">Procent (%)</option>
                                    <option value="fixed">Kwota (PLN)</option>
                                </select>
                            </div>
                        </div>

                        <p className="text-xs text-zinc-500 mt-2">
                            Po włączeniu, użytkownik zobaczy obniżoną cenę po wpisaniu poprawnego kodu promocyjnego.
                        </p>

                        {/* Promo Code & Expiry */}
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                            <h3 className="text-sm font-medium text-gold-400 mb-3">Kod promocyjny na pasku</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Kod promocyjny (wyświetlany na pasku)</label>
                                    <input
                                        type="text"
                                        value={settings.promo_code || ''}
                                        onChange={e => setSettings(s => ({ ...s, promo_code: e.target.value.toUpperCase() }))}
                                        placeholder="np. ZIMA2024"
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Data wygaśnięcia</label>
                                    <input
                                        type="date"
                                        value={settings.promo_code_expiry || ''}
                                        onChange={e => setSettings(s => ({ ...s, promo_code_expiry: e.target.value }))}
                                        className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white shadow-sm focus:border-gold-500 focus:ring-gold-500 sm:text-sm px-3 py-2"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">
                                Kod zostanie wyświetlony na górnym pasku strony. Po dacie wygaśnięcia promocja zostanie automatycznie wyłączona.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
