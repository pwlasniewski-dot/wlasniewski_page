'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Edit2, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface PromoCode {
    id: number;
    code: string;
    discount_value: number;
    discount_type: 'percentage' | 'fixed';
    valid_from: string;
    valid_until: string | null;
    is_active: boolean;
    max_usage: number | null;
    usage_count: number;
    created_at: string;
}

export default function PromoCodesPage() {
    const [codes, setCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);

    const [newCode, setNewCode] = useState({
        code: '',
        discount_value: 10,
        discount_type: 'percentage' as 'percentage' | 'fixed',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        max_usage: '',
    });

    useEffect(() => {
        fetchCodes();
    }, []);

    const fetchCodes = async () => {
        try {
            const res = await fetch('/api/promo-codes');
            const data = await res.json();
            if (data.success) {
                setCodes(data.codes);
            }
        } catch (error) {
            console.error('Failed to fetch promo codes', error);
            toast.error('Błąd pobierania kodów');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCode.code.trim()) {
            toast.error('Wpisz kod promocyjny');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/promo-codes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...newCode,
                    code: newCode.code.toUpperCase(),
                    max_usage: newCode.max_usage ? parseInt(newCode.max_usage) : null,
                    valid_until: newCode.valid_until || null,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Kod utworzony!');
                setShowNewForm(false);
                setNewCode({
                    code: '',
                    discount_value: 10,
                    discount_type: 'percentage',
                    valid_from: new Date().toISOString().split('T')[0],
                    valid_until: '',
                    max_usage: '',
                });
                fetchCodes();
            } else {
                toast.error(data.message || 'Błąd tworzenia kodu');
            }
        } catch (error) {
            toast.error('Błąd serwera');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (id: number, currentActive: boolean) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/promo-codes/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !currentActive }),
            });

            if (res.ok) {
                toast.success(currentActive ? 'Kod dezaktywowany' : 'Kod aktywowany');
                fetchCodes();
            }
        } catch (error) {
            toast.error('Błąd aktualizacji');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć ten kod?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/promo-codes/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            if (res.ok) {
                toast.success('Kod usunięty');
                fetchCodes();
            }
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    if (loading) return <div className="text-white p-8">Ładowanie...</div>;

    return (
        <div className="max-w-6xl pb-20">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-display font-semibold text-white">Kody rabatowe</h1>
                <button
                    onClick={() => setShowNewForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-gold-500 hover:bg-gold-400"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Nowy kod
                </button>
            </div>

            {/* New Code Form */}
            {showNewForm && (
                <div className="bg-zinc-900 rounded-lg border border-gold-500/50 p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-gold-400">Nowy kod rabatowy</h2>
                        <button onClick={() => setShowNewForm(false)} className="text-zinc-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Kod *</label>
                            <input
                                type="text"
                                value={newCode.code}
                                onChange={e => setNewCode(c => ({ ...c, code: e.target.value.toUpperCase() }))}
                                placeholder="np. ZIMA2025"
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Wartość rabatu *</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    value={newCode.discount_value}
                                    onChange={e => setNewCode(c => ({ ...c, discount_value: parseInt(e.target.value) || 0 }))}
                                    className="block flex-1 rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                                />
                                <select
                                    value={newCode.discount_type}
                                    onChange={e => setNewCode(c => ({ ...c, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                                    className="rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                                >
                                    <option value="percentage">%</option>
                                    <option value="fixed">zł</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Ważny od</label>
                            <input
                                type="date"
                                value={newCode.valid_from}
                                onChange={e => setNewCode(c => ({ ...c, valid_from: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Ważny do (opcjonalnie)</label>
                            <input
                                type="date"
                                value={newCode.valid_until}
                                onChange={e => setNewCode(c => ({ ...c, valid_until: e.target.value }))}
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-1">Max użyć (opcjonalnie)</label>
                            <input
                                type="number"
                                value={newCode.max_usage}
                                onChange={e => setNewCode(c => ({ ...c, max_usage: e.target.value }))}
                                placeholder="bez limitu"
                                className="block w-full rounded-md border-zinc-700 bg-zinc-800 text-white px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            onClick={() => setShowNewForm(false)}
                            className="px-4 py-2 text-zinc-400 hover:text-white"
                        >
                            Anuluj
                        </button>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="inline-flex items-center px-4 py-2 rounded-md text-black bg-gold-500 hover:bg-gold-400 disabled:opacity-50"
                        >
                            <Save className="-ml-1 mr-2 h-4 w-4" />
                            {saving ? 'Zapisywanie...' : 'Utwórz kod'}
                        </button>
                    </div>
                </div>
            )}

            {/* Codes Table */}
            <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-zinc-950">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Kod</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Rabat</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Ważność</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Użycia</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {codes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                                    Brak kodów rabatowych. Kliknij "Nowy kod" aby utworzyć pierwszy.
                                </td>
                            </tr>
                        ) : (
                            codes.map(code => (
                                <tr key={code.id} className="hover:bg-zinc-800/50">
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-gold-400 font-semibold">{code.code}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-white font-medium">
                                            {code.discount_value}{code.discount_type === 'percentage' ? '%' : ' zł'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-zinc-400">
                                        {new Date(code.valid_from).toLocaleDateString('pl-PL')}
                                        {code.valid_until && (
                                            <span> → {new Date(code.valid_until).toLocaleDateString('pl-PL')}</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-zinc-400">
                                        {code.usage_count}
                                        {code.max_usage && <span className="text-zinc-600">/{code.max_usage}</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleToggleActive(code.id, code.is_active)}
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${code.is_active
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'bg-zinc-700 text-zinc-400'
                                                }`}
                                        >
                                            {code.is_active ? (
                                                <><Check className="w-3 h-3 mr-1" /> Aktywny</>
                                            ) : (
                                                <><X className="w-3 h-3 mr-1" /> Nieaktywny</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(code.id)}
                                            className="p-1 text-red-400 hover:text-red-300"
                                            title="Usuń"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
