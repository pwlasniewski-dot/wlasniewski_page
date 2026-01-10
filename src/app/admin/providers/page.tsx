'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Search, Shield, UserX, UserCheck, ExternalLink, Package, Star, Filter, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Provider {
    id: number;
    name: string;
    email: string;
    is_active: boolean;
    packages_count: number;
    bookings_count: number;
    commission_rate: number;
    joined_at: string;
    rating: number;      // NEW
    categories: string[]; // NEW
}

export default function AdminProvidersPage() {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Filters
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    useEffect(() => {
        fetchProviders();
    }, []);

    const fetchProviders = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/providers', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setProviders(data.providers);
            }
        } catch (error) {
            toast.error('Błąd pobierania dostawców');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (id: number, currentStatus: boolean) => {
        if (!confirm(`Czy na pewno chcesz ${currentStatus ? 'zablokować' : 'aktywować'} tego dostawcę?`)) return;

        toast.loading('Aktualizacja...');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/providers/${id}/manage`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: 'TOGGLE_STATUS', value: !currentStatus })
            });
            const data = await res.json();

            if (data.success) {
                toast.dismiss();
                toast.success(data.is_active ? 'Dostawca aktywowany' : 'Dostawca zablokowany');
                setProviders(prev => prev.map(p => p.id === id ? { ...p, is_active: data.is_active } : p));
            } else {
                toast.dismiss();
                toast.error(data.error || 'Błąd aktualizacji');
            }
        } catch (error) {
            toast.dismiss();
            toast.error('Błąd połączenia');
        }
    };

    // Bulk Actions
    const handleSelectAll = () => {
        if (selectedIds.length === filteredProviders.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredProviders.map(p => p.id));
        }
    };

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(mid => mid !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    const handleBulkAction = async (action: 'BLOCK' | 'UNBLOCK' | 'SET_COMMISSION') => {
        let value: any = undefined;
        let message = `Czy na pewno chcesz zmienić status ${selectedIds.length} dostawców?`;

        if (action === 'SET_COMMISSION') {
            const rawValue = prompt('Podaj nową wartość prowizji (0-100%):');
            if (rawValue === null) return; // Cancelled
            const num = parseInt(rawValue);
            if (isNaN(num) || num < 0 || num > 100) {
                toast.error('Nieprawidłowa wartość');
                return;
            }
            value = num;
            message = `Czy ustawić prowizję ${num}% dla ${selectedIds.length} dostawców?`;
        }

        if (!confirm(message)) return;

        toast.loading('Przetwarzanie masowe...');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/providers/bulk-manage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ids: selectedIds, action, value })
            });
            const data = await res.json();

            if (data.success) {
                toast.dismiss();
                toast.success('Pomyślnie zaktualizowano dostawców');
                fetchProviders(); // Refresh list
                setSelectedIds([]);
            } else {
                toast.dismiss();
                toast.error('Błąd operacji masowej');
            }
        } catch (e) {
            toast.dismiss();
            toast.error('Błąd połączenia');
        }
    };

    // Derived Data
    const availableCategories = Array.from(new Set(providers.flatMap(p => p.categories))).sort();

    const filteredProviders = providers.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = selectedCategory === 'all' || p.categories.includes(selectedCategory);

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-gold-500" /> Dostawcy (SaaS)
                    </h1>
                    <p className="text-zinc-400">Zarządzaj partnerami i ich prowizjami</p>
                </div>
                <div className="flex gap-3">
                    {/* Actions removed */}
                </div>
            </div>

            {/* Filters & Bulk Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">

                {/* Search & Filter */}
                <div className="flex flex-1 gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-md">
                        <Search className="absolute left-3 top-3 text-zinc-500" size={20} />
                        <input
                            type="text"
                            placeholder="Szukaj dostawcy..."
                            className="w-full pl-11 pr-4 py-2.5 bg-black/50 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="relative min-w-[200px]">
                        <Filter className="absolute left-3 top-3 text-zinc-500" size={16} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-zinc-700 rounded-lg text-white appearance-none cursor-pointer hover:border-zinc-500 transition-colors"
                        >
                            <option value="all">Wszystkie Kategorie</option>
                            {availableCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                        <span className="text-sm text-zinc-400 mr-2">Zaznaczono: {selectedIds.length}</span>

                        <button
                            onClick={() => handleBulkAction('SET_COMMISSION')}
                            className="px-3 py-2 bg-zinc-800 text-gold-500 border border-gold-500/20 rounded-lg hover:bg-gold-500/10 text-sm font-medium transition-colors mr-2"
                        >
                            Ustaw Prowizję
                        </button>

                        <button
                            onClick={() => handleBulkAction('UNBLOCK')}
                            className="px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 text-sm font-medium transition-colors"
                        >
                            Aktywuj
                        </button>
                        <button
                            onClick={() => handleBulkAction('BLOCK')}
                            className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 text-sm font-medium transition-colors"
                        >
                            Zablokuj
                        </button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                <table className="w-full text-left">
                    <thead className="bg-zinc-950/80 border-b border-zinc-800 text-xs uppercase text-zinc-500 font-medium backdrop-blur-sm">
                        <tr>
                            <th className="px-6 py-4 w-12">
                                <button
                                    onClick={handleSelectAll}
                                    className="text-zinc-500 hover:text-white transition-colors"
                                >
                                    {selectedIds.length > 0 && selectedIds.length === filteredProviders.length ? <CheckSquare size={18} /> : <Square size={18} />}
                                </button>
                            </th>
                            <th className="px-6 py-4">Dostawca / Kategoria</th>
                            <th className="px-6 py-4">Status & Ocena</th>
                            <th className="px-6 py-4">Pakiety / Zlecenia</th>
                            <th className="px-6 py-4">Prowizja</th>
                            <th className="px-6 py-4 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {loading ? (
                            <tr><td colSpan={6} className="p-12 text-center text-zinc-500">Ładowanie danych...</td></tr>
                        ) : filteredProviders.length === 0 ? (
                            <tr><td colSpan={6} className="p-12 text-center text-zinc-500">Brak dostawców spełniających kryteria.</td></tr>
                        ) : (
                            filteredProviders.map(provider => (
                                <tr key={provider.id} className={`hover:bg-zinc-800/50 transition-colors group ${selectedIds.includes(provider.id) ? 'bg-amber-900/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleSelectOne(provider.id)}
                                            className={`transition-colors ${selectedIds.includes(provider.id) ? 'text-amber-500' : 'text-zinc-600 hover:text-zinc-400'}`}
                                        >
                                            {selectedIds.includes(provider.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-medium text-white text-lg">{provider.name || 'Brak nazwy'}</div>
                                            <div className="text-sm text-zinc-500 mb-1">{provider.email}</div>
                                            <div className="flex flex-wrap gap-1">
                                                {provider.categories.map(cat => (
                                                    <span key={cat} className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-2 items-start">
                                            {provider.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                    <Shield size={10} /> Aktywny
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <UserX size={10} /> Zablokowany
                                                </span>
                                            )}

                                            {/* Rating Display */}
                                            <div className="flex items-center gap-1 text-amber-500" title={`Ocena: ${provider.rating}`}>
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Star
                                                        key={star}
                                                        size={12}
                                                        className={star <= Math.round(provider.rating) ? 'fill-amber-500' : 'text-zinc-700 fill-zinc-700'}
                                                    />
                                                ))}
                                                <span className="text-xs text-zinc-500 ml-1">({provider.rating.toFixed(1)})</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1.5 text-zinc-300" title="Liczba pakietów">
                                                <Package size={14} className="text-gold-500" /> {provider.packages_count}
                                            </div>
                                            <div className="h-4 w-px bg-zinc-700" />
                                            <div className="text-zinc-500" title="Liczba rezerwacji">
                                                {provider.bookings_count} zleceń
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-zinc-300">{provider.commission_rate}%</span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-100 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/admin/providers/${provider.id}`}
                                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                                            title="Szczegóły"
                                        >
                                            <ExternalLink size={18} />
                                        </Link>
                                        <button
                                            onClick={() => toggleStatus(provider.id, provider.is_active)}
                                            className={`p-2 rounded transition-colors ${provider.is_active ? 'text-zinc-400 hover:text-red-400 hover:bg-red-400/10' : 'text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10'}`}
                                            title={provider.is_active ? 'Zablokuj' : 'Aktywuj'}
                                        >
                                            {provider.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
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
