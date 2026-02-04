'use client';

import { useState, useEffect } from 'react';
import { FileText, Briefcase, FileEdit, Plus, UserPlus, Users, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ClientStats {
    ordersCount: number;
    bookingsCount: number;
    galleriesCount: number;
    totalSpent: number;
    lastActive: string | null;
    acceptedOffersCount: number;
}

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
    stats: ClientStats;
}

interface Offer {
    id: number;
    offerNumber: string;
    title: string;
    type: string;
    category: string;
    status: string;
    created_at: string;
}

export default function GeneratorOfertUmowPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'b2c' | 'b2b' | 'contracts'>('b2c');
    const [offersB2C, setOffersB2C] = useState<Offer[]>([]);
    const [offersB2B, setOffersB2B] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);

    // Client Selection States
    const [showClientModal, setShowClientModal] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', password: '' });
    const [clientError, setClientError] = useState('');

    useEffect(() => {
        fetchOffers();
    }, [activeTab]);

    useEffect(() => {
        if (showClientModal) {
            fetchClients();
        }
    }, [showClientModal]);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers?type=${activeTab === 'b2c' ? 'B2C' : 'B2B'}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                if (activeTab === 'b2c') {
                    setOffersB2C(data.offers || []);
                } else {
                    setOffersB2B(data.offers || []);
                }
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        setClientError('');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/clients', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newClient)
            });

            const data = await res.json();
            if (res.ok) {
                setSelectedClient(data.client);
                setIsCreatingClient(false);
                fetchClients(); // Refresh list
            } else {
                setClientError(data.error || 'Błąd podczas tworzenia klienta');
            }
        } catch (error) {
            setClientError('Błąd połączenia z serwerem');
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const currentOffers = activeTab === 'b2c' ? offersB2C : offersB2B;

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Generator Ofert i Umów</h1>
                <p className="text-gray-400">Zarządzaj ofertami B2B/B2C i generuj umowy</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-zinc-700">
                <button
                    onClick={() => setActiveTab('b2c')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${activeTab === 'b2c'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    <FileText size={20} />
                    Oferty B2C
                </button>
                <button
                    onClick={() => setActiveTab('b2b')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${activeTab === 'b2b'
                        ? 'border-purple-500 text-purple-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    <Briefcase size={20} />
                    Oferty B2B
                </button>
                <button
                    onClick={() => setActiveTab('contracts')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium transition border-b-2 ${activeTab === 'contracts'
                        ? 'border-green-500 text-green-400'
                        : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                >
                    <FileEdit size={20} />
                    Umowy
                </button>
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Szukaj..."
                        className="bg-zinc-800 text-white pl-10 pr-4 py-2 rounded-lg border border-zinc-700 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    onClick={() => setShowClientModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg"
                >
                    <Plus size={20} />
                    Nowa Akcja (Oferta/Umowa)
                </button>
            </div>

            {/* Offers Table */}
            {loading ? (
                <div className="text-center py-12 text-zinc-400">Ładowanie...</div>
            ) : (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden shadow-2xl">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-zinc-800/50 border-b border-zinc-800">
                                <th className="p-4 text-zinc-400 font-semibold text-sm uppercase tracking-wider">Numer</th>
                                <th className="p-4 text-zinc-400 font-semibold text-sm uppercase tracking-wider">Tytuł</th>
                                <th className="p-4 text-zinc-400 font-semibold text-sm uppercase tracking-wider">Kategoria</th>
                                <th className="p-4 text-zinc-400 font-semibold text-sm uppercase tracking-wider">Status</th>
                                <th className="p-4 text-zinc-400 font-semibold text-sm uppercase tracking-wider">Data</th>
                                <th className="p-4 text-zinc-400 font-semibold text-sm uppercase tracking-wider text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {currentOffers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-20 text-zinc-500 italic">
                                        Brak rekordów do wyświetlenia
                                    </td>
                                </tr>
                            ) : (
                                currentOffers.map((offer) => (
                                    <tr key={offer.id} className="hover:bg-zinc-800/30 transition-colors group">
                                        <td className="p-4 text-blue-400 font-mono font-bold">{offer.offerNumber || `#${offer.id}`}</td>
                                        <td className="p-4 text-white font-medium">{offer.title}</td>
                                        <td className="p-4 text-zinc-400">
                                            <span className="bg-zinc-800 px-2 py-1 rounded text-xs border border-zinc-700">
                                                {offer.category || 'Ogólna'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${offer.status === 'accepted' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                offer.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                                }`}>
                                                {offer.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-500 text-sm">
                                            {new Date(offer.created_at).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link
                                                href={`/admin/offers/${offer.id}`}
                                                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700"
                                            >
                                                <FileEdit size={14} />
                                                Edytuj
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Client Selection Modal */}
            {showClientModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowClientModal(false)}></div>
                    <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

                        {/* Header */}
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Users className="text-blue-500" />
                                    {selectedClient ? 'Interfejs Klienta' : 'Wybierz lub dodaj klienta'}
                                </h2>
                                <p className="text-zinc-500 text-sm">Zdefiniuj klienta przed dodaniem oferty lub umowy</p>
                            </div>
                            <button onClick={() => setShowClientModal(false)} className="text-zinc-500 hover:text-white transition p-2 hover:bg-zinc-800 rounded-lg">
                                <X size={24} />
                            </button>
                        </div>

                        {!selectedClient ? (
                            <div className="flex-1 overflow-y-auto p-6 flex gap-6">
                                {/* Left: Search & Select */}
                                <div className="flex-1 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-white">Istniejący Klienci</h3>
                                        <div className="relative w-48">
                                            <Search className="absolute left-2.5 top-2 text-zinc-500" size={14} />
                                            <input
                                                type="text"
                                                placeholder="Wyszukaj..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="bg-zinc-800 text-white text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-700 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                                        {filteredClients.map(client => (
                                            <button
                                                key={client.id}
                                                onClick={() => setSelectedClient(client)}
                                                className="flex items-center justify-between p-4 bg-zinc-800/30 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition group text-left"
                                            >
                                                <div>
                                                    <div className="text-white font-bold group-hover:text-blue-400 transition">{client.name}</div>
                                                    <div className="text-zinc-500 text-xs">{client.email}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Status</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${client.stats.acceptedOffersCount > 0 ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                                                        {client.stats.acceptedOffersCount > 0 ? 'Aktywny' : 'Brak Ofert'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                        {filteredClients.length === 0 && (
                                            <div className="text-center py-12 text-zinc-600 italic border border-dashed border-zinc-800 rounded-xl">
                                                Nie znaleziono klientów
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="w-px bg-zinc-800 h-full"></div>

                                {/* Right: Add New */}
                                <div className="w-80 flex flex-col gap-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <UserPlus size={20} className="text-green-500" />
                                        Nowy Klient
                                    </h3>

                                    <form onSubmit={handleCreateClient} className="space-y-3">
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Imię i Nazwisko</label>
                                            <input
                                                required
                                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                value={newClient.name}
                                                onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Adres Email</label>
                                            <input
                                                required
                                                type="email"
                                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                value={newClient.email}
                                                onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Hasło do Portalu</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Zdefiniuj hasło dla klienta"
                                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 text-sm focus:ring-2 focus:ring-green-500 outline-none placeholder:text-zinc-600"
                                                value={newClient.password}
                                                onChange={e => setNewClient({ ...newClient, password: e.target.value })}
                                            />
                                            <p className="text-[10px] text-zinc-600 mt-1 italic">Tym hasłem klient zaloguje się na /logowanie</p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-zinc-500 uppercase font-bold mb-1 block">Telefon (Opcjonalnie)</label>
                                            <input
                                                className="w-full bg-zinc-800 text-white px-3 py-2 rounded-lg border border-zinc-700 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                value={newClient.phone}
                                                onChange={e => setNewClient({ ...newClient, phone: e.target.value })}
                                            />
                                        </div>

                                        {clientError && (
                                            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                                <AlertCircle size={14} />
                                                {clientError}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg transition shadow-lg shadow-green-900/20 mt-2"
                                        >
                                            Zdefiniuj Klienta
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ) : (
                            /* Step 2: Client Actions Interface */
                            <div className="p-8 flex-1 overflow-y-auto">
                                <div className="bg-zinc-800/50 border border-zinc-800 rounded-2xl p-6 mb-8 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-blue-900/40">
                                            {selectedClient.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{selectedClient.name}</h3>
                                            <p className="text-zinc-400">{selectedClient.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedClient(null)}
                                        className="text-zinc-500 hover:text-white transition text-xs font-bold uppercase tracking-widest border border-zinc-700 px-3 py-1.5 rounded-lg hover:bg-zinc-800"
                                    >
                                        Zmień klienta
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-6 mb-8">
                                    {/* Action 1: Add Offer */}
                                    <div className="bg-zinc-800/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center gap-4 group hover:border-blue-500/50 transition-all duration-300">
                                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center group-hover:scale-110 transition duration-300">
                                            <FileText size={40} className="text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-1">Nowa Oferta</h4>
                                            <p className="text-zinc-500 text-sm">Stwórz profesjonalną ofertę cenową z podglądem live PDF</p>
                                        </div>
                                        <Link
                                            href={`/admin/offers/create?client_id=${selectedClient.id}&type=${activeTab.toUpperCase()}`}
                                            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition group-hover:shadow-2xl group-hover:shadow-blue-900/50 flex items-center justify-center gap-2"
                                        >
                                            <Plus size={20} />
                                            Dodaj Ofertę {activeTab.toUpperCase()}
                                        </Link>
                                    </div>

                                    {/* Action 2: Utwórz Umowę (Info) */}
                                    <div className={`bg-zinc-800/30 border border-zinc-800 p-8 rounded-3xl flex flex-col items-center text-center gap-4 transition-all duration-300 ${selectedClient.stats.acceptedOffersCount > 0 ? 'bg-green-500/5' : 'opacity-40 grayscale'}`}>
                                        <div className={`w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center transition duration-300`}>
                                            <FileEdit size={40} className="text-green-500" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-1">Kreator Umów</h4>
                                            <p className="text-zinc-500 text-sm">
                                                {selectedClient.stats.acceptedOffersCount > 0
                                                    ? `Wybierz jedną z ${selectedClient.stats.acceptedOffersCount} zaakceptowanych ofert poniżej, aby wygenerować umowę.`
                                                    : 'Dostępne po zaakceptowaniu oferty przez klienta w portalu'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* List of Accepted Offers for Contract Creation */}
                                {selectedClient.stats.acceptedOffersCount > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black text-zinc-500 uppercase tracking-widest px-2">Wybierz ofertę do umowy:</h4>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="bg-zinc-800/50 border border-zinc-800 px-6 py-4 rounded-2xl flex items-center justify-between group hover:border-green-500/30 transition">
                                                <div>
                                                    <div className="text-white font-bold">Oferta Ślubna - Pakiet Premium</div>
                                                    <div className="text-zinc-500 text-xs font-mono">#B2C-2026-042 | 4500 PLN</div>
                                                </div>
                                                <Link
                                                    href={`/admin/generator-umow/create?client_id=${selectedClient.id}&offer_id=42`}
                                                    className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition"
                                                >
                                                    Utwórz Umowę
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-12 text-center border-t border-zinc-800 pt-6">
                                    <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold mb-4">Portal Klienta</p>
                                    <div className="inline-flex items-center gap-6 bg-zinc-800/30 px-6 py-3 rounded-2xl border border-zinc-800">
                                        <div className="text-left">
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Link do logowania</div>
                                            <div className="text-xs text-blue-400 font-mono">www.wlasniewski.pl/logowanie</div>
                                        </div>
                                        <div className="w-px h-8 bg-zinc-800"></div>
                                        <div className="text-left">
                                            <div className="text-[10px] text-zinc-500 uppercase font-bold">Status dostępu</div>
                                            <div className="text-xs text-green-400 flex items-center gap-1 font-bold">
                                                <CheckCircle2 size={12} /> Aktywny
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-center border-t border-zinc-800 pt-8">
                                    <button
                                        onClick={() => setShowClientModal(false)}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-12 py-3 rounded-xl border border-zinc-700 transition"
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
