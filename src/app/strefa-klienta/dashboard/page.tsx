'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Offer {
    id: number;
    slug: string;
    title: string;
    type: string;
    status: string;
    total_price: number;
    created_at: string;
    valid_until?: string;
}

interface Contract {
    id: number;
    status: string;
    offer: Offer;
}

export default function ClientDashboard() {
    const router = useRouter();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('client_token');
        if (!token) {
            router.push('/strefa-klienta/login');
            return;
        }

        fetchData(token);
    }, []);

    const fetchData = async (token: string) => {
        try {
            // Try to get user info from token
            const parts = token.split('.');
            if (parts.length === 3) {
                const decoded = JSON.parse(atob(parts[1]));
                setUser(decoded);
            }

            // Fetch offers
            const offersRes = await fetch('/api/client/portal/offers', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (offersRes.ok) {
                const data = await offersRes.json();
                setOffers(data.offers);
            }

            // Fetch contracts
            const contractsRes = await fetch('/api/client/portal/contracts', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (contractsRes.ok) {
                const data = await contractsRes.json();
                setContracts(data.contracts);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('client_token');
        router.push('/strefa-klienta/login');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'bg-gray-100 text-gray-700',
            sent: 'bg-blue-100 text-blue-700',
            accepted: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700',
            expired: 'bg-gray-100 text-gray-700',
            pending: 'bg-yellow-100 text-yellow-700',
            signed: 'bg-green-100 text-green-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Ładowanie...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Strefa Klienta</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-600">{user?.email}</span>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Wyloguj się
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 text-sm">Aktywne oferty</p>
                        <p className="text-3xl font-bold text-blue-600">
                            {offers.filter(o => o.status === 'sent' || o.status === 'draft').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 text-sm">Zaakceptowane oferty</p>
                        <p className="text-3xl font-bold text-green-600">
                            {offers.filter(o => o.status === 'accepted').length}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <p className="text-gray-600 text-sm">Podpisane umowy</p>
                        <p className="text-3xl font-bold text-purple-600">
                            {contracts.filter(c => c.status === 'signed').length}
                        </p>
                    </div>
                </div>

                {/* Offers Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Moje Oferty</h2>
                    {offers.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <p className="text-gray-500">Nie masz żadnych ofert</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {offers.map((offer) => (
                                <Link key={offer.id} href={`/strefa-klienta/oferty/${offer.id}`}>
                                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900">{offer.title}</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(offer.status)}`}>
                                                {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-4">
                                            Typ: <span className="font-medium">{offer.type.toUpperCase()}</span>
                                        </p>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-gray-500 text-sm">Suma:</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {offer.total_price.toLocaleString('pl-PL')} PLN
                                                </p>
                                            </div>
                                            {offer.valid_until && (
                                                <div className="text-right text-sm text-gray-500">
                                                    Ważna do:<br />
                                                    {new Date(offer.valid_until).toLocaleDateString('pl-PL')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Contracts Section */}
                {contracts.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Moje Umowy</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {contracts.map((contract) => (
                                <Link key={contract.id} href={`/strefa-klienta/umowy/${contract.id}`}>
                                    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {contract.offer.title}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                                                {contract.status === 'signed' ? 'Podpisana' : 'Oczekująca'}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm">
                                            Suma: <span className="font-semibold text-blue-600">
                                                {contract.offer.total_price.toLocaleString('pl-PL')} PLN
                                            </span>
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
