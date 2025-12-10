'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/lib/api-config';
import Link from 'next/link';
import { Eye, Image, Calendar, DollarSign, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface Gallery {
    id: number;
    client_name: string;
    client_email: string;
    booking_id: number;
    access_code: string;
    standard_count: number;
    price_per_premium: number;
    is_active: boolean;
    created_at: string;
    expires_at: string | null;
    total_photos: number;
    standard_photos_count: number;
    premium_photos_count: number;
    total_revenue: number;
}

export default function GalleriesAdminPage() {
    const [galleries, setGalleries] = useState<Gallery[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [newGallery, setNewGallery] = useState({
        client_name: '',
        client_email: '',
        standard_count: 10,
        price_per_premium: 2000, // 20 zł
        expires_days: 30,
    });

    useEffect(() => {
        fetchGalleries();
    }, []);

    const fetchGalleries = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('admin/galleries'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                setGalleries(data.galleries || []);
            }
        } catch (error) {
            console.error('Failed to fetch galleries');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGallery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGallery.client_name || !newGallery.client_email) {
            toast.error('Wypełnij wszystkie wymagane pola');
            return;
        }

        setCreating(true);
        try {
            const token = localStorage.getItem('admin_token');
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + newGallery.expires_days);

            const res = await fetch(getApiUrl('admin/galleries/create'), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_name: newGallery.client_name,
                    client_email: newGallery.client_email,
                    standard_count: newGallery.standard_count,
                    price_per_premium: newGallery.price_per_premium,
                    expires_at: expiresAt.toISOString(),
                })
            });

            const data = await res.json();
            if (data.success) {
                toast.success('Galeria utworzona!');
                setShowCreateModal(false);
                setNewGallery({
                    client_name: '',
                    client_email: '',
                    standard_count: 10,
                    price_per_premium: 2000,
                    expires_days: 30,
                });
                fetchGalleries();
            } else {
                toast.error(data.error || 'Nie udało się utworzyć galerii');
            }
        } catch (error) {
            toast.error('Błąd tworzenia galerii');
        } finally {
            setCreating(false);
        }
    };

    const filteredGalleries = filter === 'all'
        ? galleries
        : filter === 'active'
            ? galleries.filter(g => g.is_active)
            : galleries.filter(g => !g.is_active);

    if (loading) return <div className="text-zinc-400">Ładowanie...</div>;

    return (
        <div>
            <div className="mb-8 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2">
                        📸 Galerie Klientów
                    </h1>
                    <p className="text-zinc-400">
                        Zarządzaj galeriami zdjęć dla klientów
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Nowa galeria
                </button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                {[
                    { value: 'all', label: 'Wszystkie' },
                    { value: 'active', label: 'Aktywne' },
                    { value: 'inactive', label: 'Nieaktywne' },
                ].map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => setFilter(value)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === value
                            ? 'bg-gold-500 text-black'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Galleries Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGalleries.map((gallery) => (
                    <Link
                        key={gallery.id}
                        href={`/admin/galleries/${gallery.id}`}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-gold-400/50 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white group-hover:text-gold-400 transition-colors">
                                    {gallery.client_name}
                                </h3>
                                <p className="text-sm text-zinc-500">{gallery.client_email}</p>
                            </div>
                            {!gallery.is_active && (
                                <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                                    Nieaktywna
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-sm text-zinc-400">
                                <Image className="w-4 h-4" />
                                <span>{gallery.total_photos} zdjęć</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-green-400">{gallery.standard_photos_count} standard</span>
                                <span className="text-zinc-600">•</span>
                                <span className="text-gold-400">{gallery.premium_photos_count} premium</span>
                            </div>
                            {gallery.total_revenue > 0 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <span className="text-green-400 font-semibold">
                                        {(gallery.total_revenue / 100).toFixed(2)} zł przychodu
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                            <div className="flex justify-between">
                                <span>Utworzona: {new Date(gallery.created_at).toLocaleDateString('pl-PL')}</span>
                                {gallery.expires_at && (
                                    <span className="text-yellow-400">
                                        Wygasa: {new Date(gallery.expires_at).toLocaleDateString('pl-PL')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}

                {filteredGalleries.length === 0 && (
                    <div className="col-span-full text-center py-12 text-zinc-500">
                        Brak galerii do wyświetlenia
                    </div>
                )}
            </div>

            {/* Create Gallery Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Nowa galeria</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-zinc-400" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateGallery} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Nazwa klienta *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newGallery.client_name}
                                    onChange={(e) => setNewGallery({ ...newGallery, client_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                    placeholder="Jan Kowalski"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Email klienta *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newGallery.client_email}
                                    onChange={(e) => setNewGallery({ ...newGallery, client_email: e.target.value })}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                    placeholder="jan@example.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Zdjęć standard
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={newGallery.standard_count}
                                        onChange={(e) => setNewGallery({ ...newGallery, standard_count: Number(e.target.value) })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                                        Cena premium (zł)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={newGallery.price_per_premium / 100}
                                        onChange={(e) => setNewGallery({ ...newGallery, price_per_premium: Number(e.target.value) * 100 })}
                                        className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Wygasa za (dni)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newGallery.expires_days}
                                    onChange={(e) => setNewGallery({ ...newGallery, expires_days: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg"
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-3 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg disabled:opacity-50"
                                >
                                    {creating ? 'Tworzenie...' : 'Utwórz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
