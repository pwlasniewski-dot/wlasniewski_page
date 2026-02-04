'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Offer {
    id: number;
    slug: string;
    title: string;
    type: string;
    status: string;
    total_price: number;
    created_at: string;
    valid_until?: string;
    client_email?: string;
    contract?: {
        id: number;
        status: string;
    };
}

export default function OffersList() {
    const router = useRouter();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'b2b' | 'b2c'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [copySuccess, setCopySuccess] = useState<number | null>(null);

    useEffect(() => {
        fetchOffers();
    }, [filter, statusFilter]);

    const fetchOffers = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            setLoading(true);
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('type', filter);
            if (statusFilter !== 'all') params.append('status', statusFilter);

            const response = await fetch(`/api/admin/offers?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOffers(data.offers || []);
            } else if (response.status === 401) {
                router.push('/admin/login');
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteOffer = async (id: number) => {
        if (!confirm('Na pewno usunąć tę ofertę?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            const response = await fetch(`/api/admin/offers/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setOffers(offers.filter(o => o.id !== id));
            } else if (response.status === 401) {
                router.push('/admin/login');
            }
        } catch (error) {
            console.error('Error deleting offer:', error);
        }
    };

    const copyOfferLink = (offer: Offer) => {
        // In a real scenario, this might need a specific client token or public hash
        // For now we assume standard client route
        // TODO: Generate a magic link or use a specific hash based route
        const link = `${window.location.origin}/strefa-klienta/oferty/${offer.id}`;
        navigator.clipboard.writeText(link);
        setCopySuccess(offer.id);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string; label: string; icon: string }> = {
            draft: { bg: 'bg-zinc-100', text: 'text-zinc-700', label: 'Szkic', icon: '📝' },
            sent: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Wysłana', icon: '📨' },
            accepted: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Zaakceptowana', icon: '✅' },
            rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Odrzucona', icon: '❌' },
            expired: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Wygasła', icon: '⏰' },
        };

        const config = statusMap[status] || statusMap.draft;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.bg} ${config.text}`}>
                <span>{config.icon}</span>
                {config.label}
            </span>
        );
    };

    const getTypeBadge = (type: string) => {
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${type === 'b2b'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-rose-100 text-rose-700'
                }`}>
                {type}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto p-8">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-4xl font-extrabold text-white mb-2">Oferty</h1>
                    <p className="text-slate-400">Zarządzaj ofertami dla klientów B2B i B2C</p>
                </div>
                <Link href="/admin/offers/create">
                    <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-900/20 transition-all hover:scale-105 flex items-center gap-2">
                        <span>+</span> Nowa oferta
                    </button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        <option value="all">Wszystkie typy</option>
                        <option value="b2c">B2C (Klient)</option>
                        <option value="b2b">B2B (Biznes)</option>
                    </select>
                </div>

                <div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                        <option value="all">Wszystkie statusy</option>
                        <option value="draft">Szkic</option>
                        <option value="sent">Wysłana</option>
                        <option value="accepted">Zaakceptowana</option>
                        <option value="rejected">Odrzucona</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            {offers?.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                    <p className="text-slate-500 text-xl font-medium mb-4">Brak ofert spełniających kryteria.</p>
                    <Link href="/admin/offers/create">
                        <button className="text-blue-500 hover:text-blue-400 font-medium hover:underline">
                            Utwórz pierwszą ofertę &rarr;
                        </button>
                    </Link>
                </div>
            ) : (
                <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
                    <table className="w-full">
                        <thead className="bg-slate-950/50 border-b border-slate-800">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Klient / Tytuł</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Typ</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Wartość</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Umowa</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {offers.map((offer) => (
                                <tr key={offer.id} className="hover:bg-slate-800/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <Link href={`/admin/offers/${offer.id}`} className="text-white font-semibold hover:text-blue-400 text-lg transition-colors">
                                                {offer.title}
                                            </Link>
                                            <span className="text-slate-500 text-sm">{offer.client_email || 'Brak emaila'}</span>
                                            <span className="text-slate-600 text-xs font-mono mt-1">{offer.slug}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-top pt-5">
                                        {getTypeBadge(offer.type)}
                                    </td>
                                    <td className="px-6 py-4 text-center align-top pt-5">
                                        {getStatusBadge(offer.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-white font-mono text-lg align-top pt-5">
                                        {offer.total_price.toLocaleString('pl-PL')} <span className="text-slate-600 text-sm">PLN</span>
                                    </td>
                                    <td className="px-6 py-4 text-center align-top pt-5">
                                        {offer.contract ? (
                                            <Link href={`/admin/offers/${offer.id}/contract`}>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${offer.contract.status === 'signed'
                                                    ? 'bg-purple-900/50 text-purple-300 border border-purple-700'
                                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                                    }`}>
                                                    {offer.contract.status === 'signed' ? 'Podpisana' : 'Oczekująca'}
                                                </span>
                                            </Link>
                                        ) : (
                                            <Link href={`/admin/offers/${offer.id}/contract`}>
                                                <button className="text-xs text-slate-500 hover:text-purple-400 border border-dashed border-slate-700 px-2 py-1 rounded hover:border-purple-500/50 transition-colors">
                                                    + Dodaj
                                                </button>
                                            </Link>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 align-top pt-4">
                                        <div className="flex justify-end gap-2 items-center opacity-80 group-hover:opacity-100 transition-opacity">

                                            {/* PDF */}
                                            <a
                                                href={`/api/offers/${offer.id}/pdf`}
                                                target="_blank"
                                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                                                title="Pobierz PDF"
                                            >
                                                📄
                                            </a>

                                            {/* Preview/Link */}
                                            <button
                                                onClick={() => copyOfferLink(offer)}
                                                className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-all relative"
                                                title="Kopiuj link dla klienta"
                                            >
                                                {copySuccess === offer.id ? '✅' : '🔗'}
                                            </button>

                                            {/* Edit */}
                                            <Link href={`/admin/offers/${offer.id}`}>
                                                <button className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-blue-600 hover:text-white text-sm font-medium transition-all mx-1">
                                                    Edytuj
                                                </button>
                                            </Link>

                                            {/* Delete */}
                                            <button
                                                onClick={() => deleteOffer(offer.id)}
                                                className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all"
                                                title="Usuń ofertę"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
