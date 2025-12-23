'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Trash2, Plus, Eye, Download, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface DroneOrder {
    id: string;
    client_name: string;
    company_name?: string;
    email: string;
    phone: string;
    service_type: string;
    details?: string;
    status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
    created_at: string;
    updated_at?: string;
}

export default function DroneOrdersAdmin() {
    const router = useRouter();
    const [orders, setOrders] = useState<DroneOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<DroneOrder | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Statistics
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        inProgress: 0,
        completed: 0
    });

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            toast.error('Musisz być zalogowany');
            router.push('/admin/login');
            return;
        }
        setIsAuthorized(true);
        fetchOrders();
    }, [router]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/drone-orders', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });

            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();
            setOrders(data);

            // Calculate stats
            setStats({
                total: data.length,
                new: data.filter((o: DroneOrder) => o.status === 'NEW').length,
                inProgress: data.filter((o: DroneOrder) => o.status === 'IN_PROGRESS').length,
                completed: data.filter((o: DroneOrder) => o.status === 'COMPLETED').length
            });
        } catch (error) {
            toast.error('Błąd ładowania zleceń');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/drone-orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success('Status zaktualizowany');
            fetchOrders();
        } catch (error) {
            toast.error('Błąd aktualizacji');
        }
    };

    const handleDelete = async (orderId: string) => {
        if (!confirm('Czy na pewno chcesz usunąć to zlecenie?')) return;

        try {
            const res = await fetch(`/api/admin/drone-orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
                }
            });

            if (!res.ok) throw new Error('Failed to delete');

            toast.success('Zlecenie usunięte');
            fetchOrders();
        } catch (error) {
            toast.error('Błąd usuwania');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'IN_PROGRESS': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'COMPLETED': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'REJECTED': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-zinc-500/10 text-zinc-500';
        }
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            'NEW': 'Nowe',
            'IN_PROGRESS': 'W trakcie',
            'COMPLETED': 'Zakończone',
            'REJECTED': 'Odrzucone'
        };
        return labels[status] || status;
    };

    if (!isAuthorized) return null;

    return (
        <div className="min-h-screen bg-black text-white pt-32 px-4 pb-20">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-5xl font-bold flex items-center gap-3 mb-2">
                            <Zap className="text-yellow-500" size={40} />
                            Zlecenia Dronowe
                        </h1>
                        <p className="text-zinc-500">Zarządzaj zapytaniami B2B dotyczącymi usług dronowych</p>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                        <div className="text-zinc-500 text-sm mb-2">Łącznie</div>
                        <div className="text-4xl font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-6">
                        <div className="text-yellow-500 text-sm mb-2">Nowe</div>
                        <div className="text-4xl font-bold text-yellow-500">{stats.new}</div>
                    </div>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-6">
                        <div className="text-blue-500 text-sm mb-2">W trakcie</div>
                        <div className="text-4xl font-bold text-blue-500">{stats.inProgress}</div>
                    </div>
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6">
                        <div className="text-green-500 text-sm mb-2">Zakończone</div>
                        <div className="text-4xl font-bold text-green-500">{stats.completed}</div>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="text-center py-12">Ładowanie...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        Brak zleceń dronowych
                    </div>
                ) : (
                    <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-zinc-800/50">
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Zleceniodawca</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Firma</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Typ usługi</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Data</th>
                                    <th className="px-6 py-4 text-left text-sm font-semibold">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-white/5 hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium">{order.client_name}</div>
                                                <div className="text-sm text-zinc-500">{order.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">{order.company_name || '—'}</td>
                                        <td className="px-6 py-4 text-sm">{order.service_type}</td>
                                        <td className="px-6 py-4">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                                className={`text-xs px-3 py-1 rounded border ${getStatusColor(order.status)} bg-transparent cursor-pointer`}
                                            >
                                                <option value="NEW">Nowe</option>
                                                <option value="IN_PROGRESS">W trakcie</option>
                                                <option value="COMPLETED">Zakończone</option>
                                                <option value="REJECTED">Odrzucone</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-zinc-500">
                                            {new Date(order.created_at).toLocaleDateString('pl-PL')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setSelectedOrder(order);
                                                        setShowDetailModal(true);
                                                    }}
                                                    className="p-2 hover:bg-zinc-800 rounded transition-colors"
                                                    title="Szczegóły"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(order.id)}
                                                    className="p-2 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                                                    title="Usuń"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Detail Modal */}
                {showDetailModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                        <div className="bg-zinc-900 border border-white/10 rounded-xl p-8 max-w-2xl w-full">
                            <h2 className="text-2xl font-bold mb-6">Szczegóły zlecenia</h2>
                            <div className="space-y-4 mb-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-zinc-500 mb-1">Imię i nazwisko</div>
                                        <div className="font-medium">{selectedOrder.client_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500 mb-1">Firma</div>
                                        <div className="font-medium">{selectedOrder.company_name || '—'}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-zinc-500 mb-1">Email</div>
                                        <div className="font-medium">{selectedOrder.email}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-zinc-500 mb-1">Telefon</div>
                                        <div className="font-medium">{selectedOrder.phone}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 mb-1">Typ usługi</div>
                                    <div className="font-medium">{selectedOrder.service_type}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-zinc-500 mb-1">Szczegóły</div>
                                    <div className="font-medium whitespace-pre-wrap bg-zinc-800/50 p-3 rounded">
                                        {selectedOrder.details || '—'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setShowDetailModal(false)}
                                    className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
