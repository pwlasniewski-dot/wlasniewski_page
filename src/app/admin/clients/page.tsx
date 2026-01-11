'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, User, ShoppingBag, Calendar, Image as ImageIcon,
    MoreVertical, Shield, Trash2, ExternalLink, RefreshCw, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
    stats: {
        ordersCount: number;
        bookingsCount: number;
        galleriesCount: number;
        totalSpent: number;
        lastActive: string | null;
    };
}

interface ClientDetails extends Client {
    orders: any[];
    assigned_bookings: any[];
    assigned_galleries: any[];
    baskets: any[];
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setClients(data.clients);
            }
        } catch (error) {
            toast.error('Błąd pobierania klientów');
        } finally {
            setLoading(false);
        }
    };

    const fetchClientDetails = async (id: number) => {
        try {
            setDetailsLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setSelectedClient(data.client); // Assuming API returns full client object merged
            }
        } catch (error) {
            toast.error('Błąd pobierania szczegółów');
        } finally {
            setDetailsLoading(false);
        }
    };

    const handleOpenProfile = (client: Client) => {
        setShowModal(true);
        // Optimistically set what we know while loading details
        // Note: The API response structure for list vs detail might differ slightly, 
        // so ideally we wait, but for UX we show modal immediately.
        fetchClientDetails(client.id);
    };

    const handleAnonymize = async (id: number) => {
        if (!confirm('UWAGA: To działanie jest nieodwracalne!\n\nDane osobowe (Imię, Email, Telefon) zostaną ZAMAZANE.\nHistoria zamówień pozostanie dla celów księgowych.\n\nCzy na pewno chcesz wykonać anonimizację RODO?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Klient zanonimizowany pomyślnie');
                setShowModal(false);
                fetchClients();
            } else {
                toast.error('Błąd anonimizacji');
            }
        } catch (error) {
            toast.error('Błąd serwera');
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-2">Panel Klienta (CRM)</h1>
                        <p className="text-zinc-400">Zarządzaj relacjami, historią i danymi klientów w jednym miejscu.</p>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Szukaj klienta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-80 pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-gold-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Clients Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Klient</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Wydane (LTV)</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Aktywność</th>
                                    <th className="px-6 py-4 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Akcje</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {loading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Ładowanie bazy klientów...</td></tr>
                                ) : filteredClients.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Brak klientów spełniających kryteria.</td></tr>
                                ) : (
                                    filteredClients.map((client) => (
                                        <tr key={client.id} className="hover:bg-zinc-800/30 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-gold-400 font-bold">
                                                        {client.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="font-medium text-white">{client.name}</div>
                                                        <div className="text-zinc-500 text-sm">{client.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex gap-2">
                                                    {client.stats.bookingsCount > 0 && (
                                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                                                            {client.stats.bookingsCount} Sesje
                                                        </span>
                                                    )}
                                                    {client.stats.ordersCount > 0 && (
                                                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                                                            {client.stats.ordersCount} Zamówienia
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-gold-400 font-bold">
                                                    {client.stats.totalSpent.toLocaleString()} PLN
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                                                {client.stats.lastActive ? new Date(client.stats.lastActive).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => handleOpenProfile(client)}
                                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition-all border border-zinc-700 hover:border-zinc-600"
                                                >
                                                    Zobacz Profil
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Client Profile Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-zinc-800 bg-zinc-900 flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-1">
                                        {selectedClient?.name || 'Ładowanie...'}
                                    </h2>
                                    <div className="flex items-center gap-4 text-zinc-400 text-sm">
                                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> {selectedClient?.email}</span>
                                        {selectedClient?.phone && <span>• {selectedClient.phone}</span>}
                                        <span>• ID: {selectedClient?.id}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    <X className="w-6 h-6 text-zinc-400" />
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
                                {detailsLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-4">
                                        <RefreshCw className="w-8 h-8 animate-spin" />
                                        <p>Pobieranie pełnej historii klienta...</p>
                                    </div>
                                ) : selectedClient ? (
                                    <div className="space-y-8">

                                        {/* 1. Stats Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                                                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">LTV (Suma wydana)</p>
                                                <p className="text-2xl font-bold text-gold-400">
                                                    {selectedClient.orders?.reduce((sum, o) => sum + o.amount_paid, 0).toLocaleString()} PLN
                                                </p>
                                            </div>
                                            <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                                                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Zamówienia</p>
                                                <p className="text-2xl font-bold text-white">{selectedClient.orders?.length || 0}</p>
                                            </div>
                                            <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                                                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Sesje</p>
                                                <p className="text-2xl font-bold text-white">{selectedClient.assigned_bookings?.length || 0}</p>
                                            </div>
                                            <div className="bg-zinc-950/50 p-4 rounded-lg border border-zinc-800/50">
                                                <p className="text-zinc-500 text-xs uppercase font-bold mb-1">Galerie</p>
                                                <p className="text-2xl font-bold text-white">{selectedClient.assigned_galleries?.length || 0}</p>
                                            </div>
                                        </div>

                                        {/* 2. Recent Bookings */}
                                        <div>
                                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-gold-400" /> Historia Sesji
                                            </h3>
                                            {selectedClient.assigned_bookings?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedClient.assigned_bookings.map((booking: any) => (
                                                        <div key={booking.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
                                                            <div>
                                                                <p className="font-bold text-white">{booking.package}</p>
                                                                <p className="text-sm text-zinc-400">{new Date(booking.date).toLocaleDateString()} • {booking.venue_city || 'Sesja plenerowa'}</p>
                                                            </div>
                                                            <span className={`px-2 py-1 text-xs rounded-full font-bold ${booking.status === 'confirmed' ? 'bg-green-500/20 text-green-300' :
                                                                    booking.status === 'completed' ? 'bg-blue-500/20 text-blue-300' :
                                                                        'bg-zinc-700 text-zinc-300'
                                                                }`}>
                                                                {booking.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-zinc-500 italic">Brak historii rezerwacji.</p>
                                            )}
                                        </div>

                                        {/* 3. Recent Orders */}
                                        <div>
                                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                                <ShoppingBag className="w-5 h-5 text-gold-400" /> Karty Podarunkowe i Zamówienia
                                            </h3>
                                            {selectedClient.orders?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {selectedClient.orders.map((order: any) => (
                                                        <div key={order.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between items-center">
                                                            <div>
                                                                <p className="font-bold text-white">
                                                                    {order.gift_card ? `Karta Podarunkowa (Kod: ${order.gift_card.code})` : `Zamówienie #${order.id}`}
                                                                </p>
                                                                <p className="text-sm text-zinc-400">{new Date(order.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-white font-bold">{order.amount_paid} PLN</p>
                                                                <span className={`text-xs ${order.payment_status === 'paid' ? 'text-green-400' : 'text-amber-400'}`}>
                                                                    {order.payment_status === 'paid' ? 'Opłacone' : 'Oczekujące'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-zinc-500 italic">Brak historii zamówień.</p>
                                            )}
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Modal Footer - Actions */}
                            <div className="p-6 border-t border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                                <p className="text-xs text-zinc-600 max-w-md">
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    Strefa niebezpieczna: Działania RODO są nieodwracalne i powinny być wykonywane tylko na wyraźne żądanie klienta.
                                </p>
                                {selectedClient && (
                                    <button
                                        onClick={() => handleAnonymize(selectedClient.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 transition-all font-bold text-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        ANONIMIZUJ DANE (RODO)
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
