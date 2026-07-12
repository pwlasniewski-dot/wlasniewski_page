'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Search, ArrowLeft, ShoppingBag, Image as ImageIcon, Camera, Ticket, CircleDollarSign, Package, Clock3, SlidersHorizontal, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApiUrl } from '@/lib/api-config';

interface Order {
    type: 'gift_card' | 'gallery_photo';
    rawId: number;
    id: string;
    customerEmail: string;
    customerName: string;
    recipientName?: string;
    recipientEmail?: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    paymentRef?: string;
    paymentMethod: string;
    giftCardCode?: string;
    giftCardValue?: number;
    galleryId?: number;
    galleryName?: string;
    groupAccessCode?: string | null;
    participantId?: number | null;
    participantName?: string | null;
    participantEmail?: string | null;
    participantIdentifier?: string | null;
    photoCount?: number;
    photoIds?: number[];
    selectedPhotos?: Array<{ id: number; thumbnail_url: string | null; file_url: string }>;
    standardPhotoCount?: number;
    standardSelectedPhotos?: Array<{ id: number; thumbnail_url: string | null; file_url: string }>;
    sizeSummary?: string[];
    orderItems?: Array<{
        kind: 'extra_photo' | 'product';
        title: string;
        quantity: number;
        unitAmount: number;
        totalAmount: number;
        sizeLabel?: string;
    }>;
    orderBreakdown?: {
        extraPhotoCount: number;
        extraPhotoUnitAmount: number;
        extraPhotoTotal: number;
        productsTotal: number;
    };
}

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    const formatMoney = (amount: number, currency = 'PLN') => `${(amount / 100).toFixed(2)} ${currency}`;

    const extractClassLabel = (galleryName?: string) => {
        if (!galleryName) return null;
        const match = galleryName.match(/klasa\s*[a-z0-9]+/i);
        return match ? match[0].replace(/\s+/g, ' ').trim().toUpperCase() : null;
    };

    const classOptions = Array.from(
        new Set(
            orders
                .filter((order) => order.type === 'gallery_photo')
                .map((order) => extractClassLabel(order.galleryName))
                .filter((value): value is string => Boolean(value))
        )
    ).sort((a, b) => a.localeCompare(b, 'pl'));

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
        const lower = searchTerm.toLowerCase();
        const filtered = orders.filter(o => {
            const orderClass = extractClassLabel(o.galleryName);
            const matchesClass = classFilter === 'all' || orderClass === classFilter;
            const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
            const matchesType = typeFilter === 'all' || o.type === typeFilter;

            if (!matchesClass || !matchesStatus || !matchesType) return false;

            if (!searchTerm) return true;

            return (
                o.customerEmail.toLowerCase().includes(lower) ||
                o.customerName.toLowerCase().includes(lower) ||
                o.paymentRef?.toLowerCase().includes(lower) ||
                o.giftCardCode?.toLowerCase().includes(lower) ||
                o.id.toLowerCase().includes(lower) ||
                o.galleryName?.toLowerCase().includes(lower) ||
                o.participantName?.toLowerCase().includes(lower) ||
                o.participantIdentifier?.toLowerCase().includes(lower) ||
                (o.sizeSummary || []).some((size) => size.toLowerCase().includes(lower))
            );
        });
        setFilteredOrders(filtered);
    }, [searchTerm, classFilter, statusFilter, typeFilter, orders]);

    const stats = useMemo(() => {
        const paid = orders.filter((order) => order.status === 'paid' || order.status === 'completed');
        const pending = orders.filter((order) => order.status === 'pending');
        const gallery = orders.filter((order) => order.type === 'gallery_photo');
        return {
            allCount: orders.length,
            paidRevenue: paid.reduce((sum, order) => sum + order.amount, 0),
            paidCount: paid.length,
            pendingCount: pending.length,
            galleryCount: gallery.length,
            giftCount: orders.length - gallery.length,
        };
    }, [orders]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl('admin/orders'), {
                headers: { 'Authorization': `Bearer ${token}` }
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
            case 'completed':
            case 'paid':
                return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            case 'cancelled': return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
            case 'failed': return 'text-red-400 bg-red-400/10 border-red-400/20';
            default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
        }
    };

    const getStatusLabel = (status: string) => {
        if (status === 'completed' || status === 'paid') return 'Opłacone';
        if (status === 'pending') return 'Oczekuje';
        if (status === 'cancelled') return 'Anulowane';
        if (status === 'failed') return 'Błąd';
        return status;
    };

    const handleResendEmail = async (orderId: number) => {
        const toastId = toast.loading('Wysyłanie...');
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(getApiUrl(`gift-cards/orders/${orderId}/resend`), {
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
    const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
    const [downloadingGalleryId, setDownloadingGalleryId] = useState<number | null>(null);

    const collectOrderFormats = (order: Order): string[] => {
        const formats = new Set<string>();
        if ((order.standardPhotoCount || 0) > 0) {
            formats.add('15x21');
        }
        (order.sizeSummary || []).forEach((size) => formats.add(size));
        return Array.from(formats);
    };

    const handleDownloadParticipantZip = async (order: Order) => {
        if (!order.galleryId || !order.participantId) {
            toast.error('Brak danych uczestnika do pobrania ZIP');
            return;
        }

        setDownloadingOrderId(order.id);
        try {
            const token = localStorage.getItem('admin_token');
            const endpoint = getApiUrl(`admin/galleries/${order.galleryId}/participants/${order.participantId}/download-all`);
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }

            if (!res.ok) {
                toast.error('Nie udało się pobrać ZIP dla uczestnika');
                return;
            }

            const data = await res.json();
            if (!data?.downloadUrl) {
                toast.error('Nie udało się pobrać ZIP dla uczestnika');
                return;
            }

            const link = document.createElement('a');
            const participantSlug = (order.participantName || order.participantIdentifier || String(order.participantId))
                .replace(/[^a-zA-Z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase() || 'uczestnik';
            const formatsSlug = collectOrderFormats(order).join('-') || 'format';
            link.href = data.downloadUrl;
            link.download = data.fileName || `druk-${participantSlug}-${formatsSlug}.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Pobieranie ZIP rozpoczęte');
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania ZIP');
        } finally {
            setDownloadingOrderId(null);
        }
    };

    const handleDownloadGalleryZip = async (galleryId: number) => {
        setDownloadingGalleryId(galleryId);
        try {
            const token = localStorage.getItem('admin_token');
            const endpoint = getApiUrl(`admin/galleries/${galleryId}/participants/download-all`);
            const res = await fetch(endpoint, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (res.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
                return;
            }

            if (!res.ok) {
                toast.error('Nie udało się pobrać ZIP całej galerii');
                return;
            }

            const data = await res.json();
            if (!data?.downloadUrl) {
                toast.error('Nie udało się pobrać ZIP całej galerii');
                return;
            }

            const link = document.createElement('a');
            link.href = data.downloadUrl;
            link.download = data.fileName || `druk-galeria-${galleryId}-wszyscy.zip`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Pobieranie ZIP całej galerii rozpoczęte');
        } catch (error) {
            console.error(error);
            toast.error('Błąd pobierania ZIP galerii');
        } finally {
            setDownloadingGalleryId(null);
        }
    };

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
                                    onClick={() => router.push('/admin/bookings')}
                                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 transition-all"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                                    <ShoppingBag className="text-gold-500" />
                                    Zamówienia
                                </h1>
                            </div>
                            <p className="text-zinc-400 ml-9">Jedna lista: karty podarunkowe + dodatkowe odbitki z galerii</p>
                        </div>
                        <button
                            onClick={fetchOrders}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all"
                            title="Odśwież"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    {/* KPI */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Przychód opłacony</div>
                            <div className="text-2xl font-black text-emerald-300">{formatMoney(stats.paidRevenue)}</div>
                            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1"><CircleDollarSign size={13} /> {stats.paidCount} opłaconych zamówień</div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Wszystkie zamówienia</div>
                            <div className="text-2xl font-black text-white">{stats.allCount}</div>
                            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1"><Package size={13} /> {stats.galleryCount} galeria / {stats.giftCount} karty</div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Oczekujące</div>
                            <div className="text-2xl font-black text-yellow-300">{stats.pendingCount}</div>
                            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1"><Clock3 size={13} /> do monitorowania płatności</div>
                        </div>
                        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                            <div className="text-xs uppercase tracking-wider text-zinc-500 mb-2">Wynik filtrowania</div>
                            <div className="text-2xl font-black text-gold-400">{filteredOrders.length}</div>
                            <div className="mt-2 text-xs text-zinc-400 flex items-center gap-1"><SlidersHorizontal size={13} /> rekordów po filtrach</div>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                            <div className="relative lg:col-span-2">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                                <input
                                    type="text"
                                    placeholder="Szukaj po e-mailu, nazwisku, kodzie, galerii, uczestniku lub ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none placeholder-zinc-600"
                                />
                            </div>
                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                            >
                                <option value="all">Wszystkie klasy</option>
                                {classOptions.map((className) => (
                                    <option key={className} value={className}>{className}</option>
                                ))}
                            </select>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                            >
                                <option value="all">Wszystkie statusy</option>
                                <option value="paid">Opłacone</option>
                                <option value="completed">Completed</option>
                                <option value="pending">Oczekujące</option>
                                <option value="failed">Błąd</option>
                                <option value="cancelled">Anulowane</option>
                            </select>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                            >
                                <option value="all">Wszystkie typy</option>
                                <option value="gallery_photo">Galeria</option>
                                <option value="gift_card">Karta podarunkowa</option>
                            </select>
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setClassFilter('all');
                                    setStatusFilter('all');
                                    setTypeFilter('all');
                                }}
                                className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-100 transition-colors"
                            >
                                Wyczyść filtry
                            </button>
                        </div>
                    </div>

                    {/* Orders Table */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-zinc-950/50 border-b border-zinc-800">
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">ID / Data</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Typ</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Klient</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Pozycje koszyka</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Kwota i płatność</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-medium text-zinc-500 uppercase tracking-wider">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-zinc-500">
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
                                                    <div className="font-mono text-gold-400 font-bold">{order.id}</div>
                                                    <div className="text-xs text-zinc-500 mt-1">{formatDate(order.createdAt)}</div>
                                                </td>
                                                <td className="p-4">
                                                    {order.type === 'gift_card' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300">
                                                            <Ticket size={12} />
                                                            Karta
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                                                            <Camera size={12} />
                                                            Galeria
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white font-medium">{order.customerName}</div>
                                                    <div className="text-sm text-zinc-400">{order.customerEmail}</div>
                                                    {order.participantIdentifier && (
                                                        <div className="text-xs text-zinc-500 mt-1">ID: {order.participantIdentifier}</div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {order.type === 'gift_card' ? (
                                                        <>
                                                            <div className="text-white font-bold">Karta podarunkowa</div>
                                                            {order.giftCardCode && (
                                                                <div className="text-xs text-emerald-400 font-mono mt-1 bg-emerald-900/30 px-2 py-0.5 rounded inline-block">
                                                                    {order.giftCardCode}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-zinc-500 mt-1">Dla: {order.recipientName || order.recipientEmail || '-'}</div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="text-white font-bold">{order.galleryName}</div>
                                                            <div className="text-xs text-zinc-400 mt-1">{order.photoCount || 0} zdjęć dodatkowych</div>
                                                            {order.orderItems && order.orderItems.length > 0 && (
                                                                <div className="mt-2 space-y-1">
                                                                    {order.orderItems.slice(0, 2).map((item, index) => (
                                                                        <div key={`${order.id}-item-${index}`} className="text-xs text-zinc-300">
                                                                            {item.title} • {item.quantity} × {formatMoney(item.unitAmount)}
                                                                        </div>
                                                                    ))}
                                                                    {order.orderItems.length > 2 && (
                                                                        <div className="text-xs text-zinc-500">+{order.orderItems.length - 2} kolejnych pozycji</div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {order.sizeSummary && order.sizeSummary.length > 0 && (
                                                                <div className="mt-2 flex flex-wrap gap-1">
                                                                    {order.sizeSummary.map((size) => (
                                                                        <span key={`${order.id}-${size}`} className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-amber-500/40 text-amber-300 bg-amber-500/10">
                                                                            {size}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {order.groupAccessCode && (
                                                                <div className="text-xs text-gold-400 font-mono mt-1">Kod: {order.groupAccessCode}</div>
                                                            )}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-white font-bold">{formatMoney(order.amount, order.currency)}</div>
                                                    <div className="text-xs text-zinc-300 uppercase mt-1">{order.paymentMethod || '-'}</div>
                                                    <div className="text-xs font-mono text-zinc-500 break-all max-w-[150px] mt-1">
                                                        {order.paymentRef || '-'}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                                                        {getStatusLabel(order.status)}
                                                    </span>
                                                    {order.type === 'gift_card' && order.status === 'completed' && (
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
                                                        {order.type === 'gift_card' && order.status === 'completed' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (confirm('Czy na pewno chcesz wysłać ponownie email z kartą do klienta?')) {
                                                                        handleResendEmail(order.rawId);
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
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Szczegóły Zamówienia <span className="text-gold-500">{selectedOrder.id}</span></h2>
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
                                {selectedOrder.type === 'gift_card' ? (
                                    <>
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
                                                <div className="text-white font-bold">{formatMoney(selectedOrder.amount, selectedOrder.currency)}</div>
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
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Szczegóły Zakupu (Galeria)</h3>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-xs text-zinc-500">Galeria</label>
                                                <div className="text-white font-medium">{selectedOrder.galleryName || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500">Uczestnik</label>
                                                <div className="text-white">{selectedOrder.participantName || selectedOrder.participantIdentifier || '-'}</div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500">ID uczestnika / email</label>
                                                <div className="text-zinc-300">{selectedOrder.participantIdentifier || '-'} {selectedOrder.participantEmail ? `• ${selectedOrder.participantEmail}` : ''}</div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500">Kwota / zdjęcia</label>
                                                <div className="text-white font-bold">{formatMoney(selectedOrder.amount, selectedOrder.currency)} • {selectedOrder.photoCount || 0} szt.</div>
                                            </div>
                                            {selectedOrder.sizeSummary && selectedOrder.sizeSummary.length > 0 && (
                                                <div>
                                                    <label className="text-xs text-zinc-500">Rozmiary odbitek</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {selectedOrder.sizeSummary.map((size) => (
                                                            <span key={`selected-${size}`} className="px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-500/40 text-amber-300 bg-amber-500/10">
                                                                {size}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="md:col-span-2 border-t border-zinc-800 pt-6">
                                {selectedOrder.type === 'gallery_photo' && selectedOrder.orderItems && selectedOrder.orderItems.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-3">Pozycje Zamówienia</h3>
                                        <div className="rounded-lg border border-zinc-800 overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-zinc-950/60">
                                                    <tr>
                                                        <th className="px-4 py-2 text-xs text-zinc-500 uppercase">Pozycja</th>
                                                        <th className="px-4 py-2 text-xs text-zinc-500 uppercase">Ilość</th>
                                                        <th className="px-4 py-2 text-xs text-zinc-500 uppercase">Cena jedn.</th>
                                                        <th className="px-4 py-2 text-xs text-zinc-500 uppercase">Wartość</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-zinc-800">
                                                    {selectedOrder.orderItems.map((item, index) => (
                                                        <tr key={`selected-item-${index}`}>
                                                            <td className="px-4 py-2 text-sm text-white">
                                                                {item.title}
                                                                {item.sizeLabel && <span className="ml-2 text-xs text-amber-300">({item.sizeLabel})</span>}
                                                            </td>
                                                            <td className="px-4 py-2 text-sm text-zinc-300">{item.quantity}</td>
                                                            <td className="px-4 py-2 text-sm text-zinc-300">{formatMoney(item.unitAmount)}</td>
                                                            <td className="px-4 py-2 text-sm font-semibold text-white">{formatMoney(item.totalAmount)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {selectedOrder.orderBreakdown && (
                                            <div className="mt-3 text-xs text-zinc-400">
                                                Odbitki: {selectedOrder.orderBreakdown.extraPhotoCount} × {formatMoney(selectedOrder.orderBreakdown.extraPhotoUnitAmount)} • Produkty: {formatMoney(selectedOrder.orderBreakdown.productsTotal)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Zdjęcia i Galeria</h3>
                                {selectedOrder.type === 'gift_card' ? (
                                    <>
                                        <Link
                                            href={`/admin/galleries?createFor=${encodeURIComponent(JSON.stringify({
                                                name: selectedOrder.recipientName || selectedOrder.customerName,
                                                email: selectedOrder.recipientEmail || selectedOrder.customerEmail
                                            }))}`}
                                            className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-gold-500 font-bold rounded-xl transition-all border border-zinc-700 hover:border-gold-500/50"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                            Zarządzaj Zdjęciami (Dodaj do Panelu Klienta)
                                        </Link>
                                        <p className="text-center text-xs text-zinc-500 mt-2 mb-6">
                                            Jeśli to zamówienie karty, możesz od razu utworzyć galerię dla obdarowanego (jeśli podano email).
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadParticipantZip(selectedOrder)}
                                                disabled={downloadingOrderId === selectedOrder.id || !selectedOrder.galleryId || !selectedOrder.participantId}
                                                className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold rounded-xl transition-all border border-emerald-500/50"
                                            >
                                                <Download className="w-5 h-5" />
                                                {downloadingOrderId === selectedOrder.id ? 'Przygotowuję ZIP...' : 'Pobierz ZIP zdjęć do druku tego rodzica'}
                                            </button>
                                            {selectedOrder.galleryId && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadGalleryZip(selectedOrder.galleryId!)}
                                                    disabled={downloadingGalleryId === selectedOrder.galleryId}
                                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-semibold rounded-xl transition-all border border-gold-400/50"
                                                >
                                                    <Download className="w-5 h-5" />
                                                    {downloadingGalleryId === selectedOrder.galleryId ? 'Przygotowuję ZIP galerii...' : 'Pobierz ZIP całej galerii (wszyscy rodzice)'}
                                                </button>
                                            )}
                                            {selectedOrder.galleryId && (
                                                <Link
                                                    href={`/admin/galleries/${selectedOrder.galleryId}`}
                                                    className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-emerald-300 font-semibold rounded-xl transition-all border border-zinc-700 hover:border-emerald-500/50"
                                                >
                                                    <ImageIcon className="w-5 h-5" />
                                                    Otwórz galerię (widok szczegółowy)
                                                </Link>
                                            )}
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-xs text-zinc-500 mb-2">Płatne dodatkowe (ID): {(selectedOrder.photoIds || []).join(', ') || '-'}</p>
                                            {selectedOrder.selectedPhotos && selectedOrder.selectedPhotos.length > 0 ? (
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                                    {selectedOrder.selectedPhotos.map((photo) => (
                                                        <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={photo.thumbnail_url || photo.file_url}
                                                                alt={`Zdjęcie ${photo.id}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white font-mono">#{photo.id}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-500">Brak podglądu miniatur.</p>
                                            )}
                                        </div>
                                        <div className="mt-4">
                                            <p className="text-xs text-zinc-500 mb-2">Standard do druku 15x21 (ID): {(selectedOrder.standardSelectedPhotos || []).map((photo) => photo.id).join(', ') || '-'}</p>
                                            {selectedOrder.standardSelectedPhotos && selectedOrder.standardSelectedPhotos.length > 0 ? (
                                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                                    {selectedOrder.standardSelectedPhotos.map((photo) => (
                                                        <div key={`std-${photo.id}`} className="relative aspect-square rounded-lg overflow-hidden border border-gold-500/30 bg-zinc-950">
                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                            <img
                                                                src={photo.thumbnail_url || photo.file_url}
                                                                alt={`Standard ${photo.id}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white font-mono">#{photo.id}</span>
                                                            <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-gold-500 text-black font-bold">15x21</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-zinc-500">Brak standardowych miniatur dla tego rodzica.</p>
                                            )}
                                        </div>
                                    </>
                                )}

                                <h3 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Status i Akcje</h3>
                                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-lg border border-zinc-800">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${(selectedOrder.status === 'completed' || selectedOrder.status === 'paid') ? 'bg-green-500' : selectedOrder.status === 'pending' ? 'bg-yellow-500' : 'bg-zinc-500'}`}></div>
                                        <div>
                                            <div className="text-sm font-medium text-white">Status Płatności: {getStatusLabel(selectedOrder.status)}</div>
                                            <div className="text-xs text-zinc-500">Ref: {selectedOrder.paymentRef || '-'}</div>
                                        </div>
                                    </div>
                                    {selectedOrder.type === 'gift_card' && selectedOrder.status === 'completed' && (
                                        <button
                                            onClick={() => handleResendEmail(selectedOrder.rawId)}
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
            )}
        </div>
    );
}
