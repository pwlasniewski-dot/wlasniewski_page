'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Search, ArrowLeft, ShoppingBag } from 'lucide-react';
import GiftCard from '@/components/GiftCard';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api-config';

interface Order {
    id: number;
    customerId: number;
    customerEmail: string;
    customerName: string;
    recipientName?: string;
    recipientEmail?: string;
    amount: number;
    currency: string;
    status: string; // payment_status
    deliveryStatus: string;
    createdAt: string;
    payuOrderId?: string;
    stripeSessionId?: string;
    paymentMethod: string;
    giftCardCode?: string;
    giftCardValue?: number;
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        setIsAuthorized(true);
        fetchOrders();
    }, [router]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredOrders(orders);
            return;
        }
        const lower = searchTerm.toLowerCase();
        const filtered = orders.filter(o =>
            o.customerEmail.toLowerCase().includes(lower) ||
            o.customerName.toLowerCase().includes(lower) ||
            o.payuOrderId?.toLowerCase().includes(lower) ||
            o.giftCardCode?.toLowerCase().includes(lower) ||
            `ORD - ${o.id} `.toLowerCase().includes(lower)
        );
        setFilteredOrders(filtered);
    }, [searchTerm, orders]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('gift-cards/orders'), {
                headers: { 'Authorization': `Bearer ${token} ` }
            });

            if (res.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }

            const data = await res.json();
            if (data.success) {
                setOrders(data.orders);
                setFilteredOrders(data.orders);
            } else {
                toast.error(data.error || 'Błąd pobierania zamówień');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Błąd połączenia');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pl-PL', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
        }
    };

    const handleResendEmail = async (orderId: number) => {
        const toastId = toast.loading('Wysyłanie...');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`gift - cards / orders / ${orderId}/resend`), {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                toast.success('Wysłano pomyślnie!', { id: toastId });
                fetchOrders(); // Refresh status
            } else {
                toast.error(data.error || 'Błąd wysyłania', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Błąd połączenia', { id: toastId });
        }
    };


    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    return (
        <div className="min-h-screen bg-zinc-950 p-6">
            {!isAuthorized ? (
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-zinc-400">Ładowanie...</p>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => router.push('/admin/gift-cards')}
                                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                    <ShoppingBag className="text-gold-500" />
                                    Zamówienia Kart
                                </h1>
                            </div>
                            <p className="text-zinc-400 ml-9">Pełna historia zakupów kart podarunkowych</p>
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                            title="Odśwież"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                            <input
                                type="text"
                                placeholder="Szukaj po e-mailu, nazwisku, kodzie karty lub ID zamówienia..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none placeholder-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">ID / Data</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Klient</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Karta</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Płatność</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-zinc-500">
                                                {loading ? 'Ładowanie...' : 'Brak zamówień'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                                                onClick={() => setSelectedOrder(order)}
                                            >
                                                <td className="p-4">
                                                    <div className="font-mono text-gold-400 font-bold">ORD-{order.id}</div>
                                                    <div className="text-xs text-zinc-500 mt-1">{formatDate(order.createdAt)}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white font-medium">{order.customerName}</div>
                                                    <div className="text-sm text-zinc-400">{order.customerEmail}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white font-bold">{order.amount / 100} PLN</div>
                                                    {order.giftCardCode && (
                                                        <div className="text-xs text-emerald-400 font-mono mt-1 bg-emerald-900/30 px-2 py-0.5 rounded inline-block">
                                                            {order.giftCardCode}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-zinc-500 mt-1">Dla: {order.recipientName || order.recipientEmail}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-sm text-zinc-300 uppercase">{order.paymentMethod}</div>
                                                    <div className="text-xs font-mono text-zinc-500 break-all max-w-[150px] mt-1">
                                                        {order.payuOrderId || order.stripeSessionId || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                                                        {order.status === 'completed' ? 'Opłacone' : order.status === 'pending' ? 'Oczekuje' : order.status}
                                                    </span>
                                                    {order.deliveryStatus !== 'sent' && order.status === 'completed' && (
                                                        <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                                                            <AlertCircle size={12} /> Nie wysłano
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedOrder(order);
                                                            }}
                                                            className="p-2 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                                                            title="Szczegóły"
                                                        >
                                                            <Search size={16} />
                                                        </button>
                                                        {order.status === 'completed' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Czy na pewno chcesz wysłać ponownie email z kartą do klienta?')) {
                                                                        handleResendEmail(order.id);
                                                                    }
                                                                }}
                                                                className="p-2 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
                                                                title="Wyślij ponownie email"
                                                            >
                                                                <RefreshCw size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div >
                    </div >
                </div >
            )
            }

            {/* Details Modal */}
            {
                selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">Szczegóły Zamówienia <span className="text-gold-500">ORD-{selectedOrder.id}</span></h2>
                                <button onClick={() => setSelectedOrder(null)} className="text-zinc-400 hover:text-white"><div className="w-6 h-6 flex items-center justify-center">✕</div></button>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Dane Klienta (Kupujący)</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-zinc-500">Imię i nazwisko</label>
                                            <div className="text-white font-medium">{selectedOrder.customerName}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500">Email</label>
                                            <div className="text-white">{selectedOrder.customerEmail}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Dane Odbiorcy (Karta)</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-zinc-500">Kod Karty</label>
                                            <div className="text-emerald-400 font-mono font-bold bg-emerald-900/20 px-2 py-1 rounded inline-block">
                                                {selectedOrder.giftCardCode || '-'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500">Wartość</label>
                                            <div className="text-white font-bold">{selectedOrder.amount / 100} PLN</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500">Dla kogo</label>
                                            <div className="text-white">{selectedOrder.recipientName || '-'}</div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-zinc-500">Email odbiorcy</label>
                                            <div className="text-zinc-300">{selectedOrder.recipientEmail || '(Pusty - wysłano do kupującego)'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 border-t border-zinc-800 pt-6">
                                    <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Status i Akcje</h3>
                                    <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full ${selectedOrder.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                                            <div>
                                                <div className="text-sm font-medium text-white">Status Płatności: {selectedOrder.status}</div>
                                                <div className="text-xs text-zinc-500">Ref: {selectedOrder.payuOrderId || selectedOrder.stripeSessionId}</div>
                                            </div>
                                        </div>
                                        {selectedOrder.status === 'completed' && (
                                            <button
                                                onClick={() => handleResendEmail(selectedOrder.id)}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <RefreshCw size={14} /> Wyślij email ponownie
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
