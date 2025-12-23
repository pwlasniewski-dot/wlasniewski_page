'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface GiftCard {
    id: number;
    code: string;
    value: number;
    theme: string;
    card_title: string;
    card_description: string;
    status: 'active' | 'inactive';
}

interface FormData {
    code: string;
    value: string;
    theme: string;
    card_title: string;
    card_description: string;
    status: 'active' | 'inactive';
}

const THEMES = [
    { value: 'christmas', label: '🎄 Boże Narodzenie' },
    { value: 'wosp', label: '❤️ WOŚP' },
    { value: 'valentines', label: '💝 Walentynki' },
    { value: 'easter', label: '🐰 Wielkanoc' },
    { value: 'halloween', label: '👻 Halloween' },
    { value: 'mothers-day', label: '💐 Dzień Matki' },
    { value: 'childrens-day', label: '🎈 Dzień Dziecka' },
    { value: 'wedding', label: '💒 Ślub' },
    { value: 'birthday', label: '🎂 Urodziny' },
];

export default function GiftCardShopPage() {
    const router = useRouter();
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<FormData>({
        code: '',
        value: '',
        theme: 'christmas',
        card_title: '',
        card_description: '',
        status: 'active',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Helper to get auth headers
    const getAuthHeaders = () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        fetchCards();
    }, [router]);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/gift-cards', {
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    router.push('/admin/login');
                    return;
                }
                throw new Error('Błąd przy pobieraniu kart');
            }
            const data = await res.json();
            setCards(data.cards || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const url = editingId 
                ? `/api/admin/gift-cards/${editingId}`
                : '/api/admin/gift-cards';
            
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    ...formData,
                    value: parseInt(formData.value),
                }),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    router.push('/admin/login');
                    return;
                }
                const errorData = await res.json();
                throw new Error(errorData.error || 'Błąd przy zapisywaniu karty');
            }

            setSuccess(editingId ? '✅ Karta zaktualizowana!' : '✅ Karta dodana!');
            resetForm();
            fetchCards();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Czy na pewno chcesz usunąć tę kartę?')) return;

        try {
            const res = await fetch(`/api/admin/gift-cards/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (!res.ok) {
                if (res.status === 401) {
                    localStorage.removeItem('admin_token');
                    router.push('/admin/login');
                    return;
                }
                throw new Error('Błąd przy usuwaniu karty');
            }

            setSuccess('✅ Karta usunięta!');
            fetchCards();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Błąd');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            value: '',
            theme: 'christmas',
            card_title: '',
            card_description: '',
            status: 'active',
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (card: GiftCard) => {
        setFormData({
            code: card.code,
            value: card.value.toString(),
            theme: card.theme,
            card_title: card.card_title,
            card_description: card.card_description,
            status: card.status,
        });
        setEditingId(card.id);
        setShowForm(true);
    };

    const generateCode = () => {
        const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        setFormData(prev => ({ ...prev, code: randomCode }));
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-white p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-4xl font-display font-bold mb-2">
                        🛍️ Karty w Sklepie
                    </h1>
                    <p className="text-zinc-400">
                        Zarządzaj kartami dostępnymi do kupienia w sklepie
                    </p>
                </motion.div>

                {/* Notifications */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200"
                    >
                        ❌ {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-200"
                    >
                        {success}
                    </motion.div>
                )}

                {/* Form Section */}
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 bg-zinc-900 border border-zinc-800 rounded-xl p-6"
                    >
                        <h2 className="text-2xl font-bold mb-6">
                            {editingId ? '✏️ Edytuj Kartę' : '➕ Dodaj Nową Kartę'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Kod */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Kod Karty *
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) =>
                                                setFormData({ ...formData, code: e.target.value })
                                            }
                                            placeholder="np. XMAS2024001"
                                            className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={generateCode}
                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                                            title="Generuj kod"
                                        >
                                            🎲
                                        </button>
                                    </div>
                                </div>

                                {/* Wartość */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Wartość (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) =>
                                            setFormData({ ...formData, value: e.target.value })
                                        }
                                        placeholder="np. 500"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 outline-none"
                                        required
                                    />
                                </div>

                                {/* Temat */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Temat *
                                    </label>
                                    <select
                                        value={formData.theme}
                                        onChange={(e) =>
                                            setFormData({ ...formData, theme: e.target.value })
                                        }
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 outline-none"
                                    >
                                        {THEMES.map((t) => (
                                            <option key={t.value} value={t.value}>
                                                {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as 'active' | 'inactive',
                                            })
                                        }
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 outline-none"
                                    >
                                        <option value="active">✅ Aktywna</option>
                                        <option value="inactive">❌ Nieaktywna</option>
                                    </select>
                                </div>

                                {/* Tytuł */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">
                                        Tytuł Karty *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.card_title}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                card_title: e.target.value,
                                            })
                                        }
                                        placeholder="np. KARTA PODARUNKOWA"
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 outline-none"
                                        required
                                    />
                                </div>

                                {/* Opis */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">
                                        Opis Karty *
                                    </label>
                                    <textarea
                                        value={formData.card_description}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                card_description: e.target.value,
                                            })
                                        }
                                        placeholder="np. Specjalny upominek na święta"
                                        rows={3}
                                        className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:border-gold-500 outline-none"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-4 justify-end pt-4 border-t border-zinc-800">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all"
                                >
                                    {editingId ? 'Zaktualizuj' : 'Dodaj Kartę'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Add Button */}
                {!showForm && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowForm(true)}
                        className="mb-8 flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Dodaj Nową Kartę
                    </motion.button>
                )}

                {/* Cards List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                >
                    {loading ? (
                        <div className="text-center py-12 text-zinc-400">
                            ⏳ Ładowanie kart...
                        </div>
                    ) : cards.length === 0 ? (
                        <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-lg">
                            <p className="text-zinc-400 mb-4">Brak kart w sklepie</p>
                            <p className="text-sm text-zinc-500">
                                Dodaj pierwszą kartę aby zacząć sprzedaż!
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {cards.map((card) => (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-zinc-700 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                                                <h3 className="font-bold text-lg">
                                                    {THEMES.find((t) => t.value === card.theme)?.label ||
                                                        card.theme}
                                                </h3>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        card.status === 'active'
                                                            ? 'bg-green-500/20 text-green-300'
                                                            : 'bg-red-500/20 text-red-300'
                                                    }`}
                                                >
                                                    {card.status === 'active' ? '✅ Aktywna' : '❌ Nieaktywna'}
                                                </span>
                                            </div>

                                            <p className="text-gold-400 font-mono text-sm mb-2">
                                                Kod: <strong>{card.code}</strong>
                                            </p>

                                            <p className="text-white font-semibold mb-1">
                                                {card.card_title}
                                            </p>

                                            <p className="text-zinc-300 text-sm mb-3">
                                                {card.card_description}
                                            </p>

                                            <p className="text-sm font-bold">
                                                Wartość: <span className="text-gold-400">{card.value} PLN</span>
                                            </p>
                                        </div>

                                        <div className="flex gap-2 flex-shrink-0">
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleEdit(card)}
                                                className="p-3 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition-all"
                                                title="Edytuj kartę"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleDelete(card.id)}
                                                className="p-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-lg transition-all"
                                                title="Usuń kartę"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Stats */}
                {cards.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-8 grid md:grid-cols-3 gap-4"
                    >
                        <motion.div
                            whileHover={{ translateY: -4 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center"
                        >
                            <p className="text-zinc-400 mb-2">Razem Kart</p>
                            <p className="text-3xl font-bold text-gold-400">{cards.length}</p>
                        </motion.div>
                        <motion.div
                            whileHover={{ translateY: -4 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center"
                        >
                            <p className="text-zinc-400 mb-2">Aktywne</p>
                            <p className="text-3xl font-bold text-green-400">
                                {cards.filter((c) => c.status === 'active').length}
                            </p>
                        </motion.div>
                        <motion.div
                            whileHover={{ translateY: -4 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center"
                        >
                            <p className="text-zinc-400 mb-2">Łączna Wartość</p>
                            <p className="text-3xl font-bold text-blue-400">
                                {cards.reduce((sum, c) => sum + c.value, 0).toLocaleString()} PLN
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
