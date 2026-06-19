'use client';

import React, { useState, useEffect, Suspense } from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    Search, User, Image as ImageIcon,
    Plus, X, FileText, Camera, CheckCircle,
    Clock, AlertCircle, XCircle, ChevronDown, ChevronUp, Trash2, ShieldAlert, MessageCircle, RefreshCw, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ClientStats {
    ordersCount: number;
    bookingsCount: number;
    galleriesCount: number;
    totalSpent: number;
    lastActive: string | null;
    // Offer
    offerStatus: string | null;
    offersCount: number;
    approvedAmount: number | null;
    // Contract
    contractStatus: string | null;
    contractSignedAt: string | null;
    // Gallery
    photosExpected: number;
    photosAdded: number;
    hasGallery: boolean;
    isPaid: boolean;
    // Job type
    jobType: string | null;
    isKomunia: boolean;
    // Booking
    nextBookingDate: string | null;
    bookingStatus: string | null;
    // Deposit
    depositAmount?: number | null;
    depositPaidAt?: string | null;
    depositDueAt?: string | null;
    depositStatus?: 'paid' | 'overdue' | 'due_soon' | 'pending' | null;
    // Negotiations
    negotiationsCount: number;
}

interface Client {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    created_at: string;
    stats: ClientStats;
}

// ─── Status badge helpers ──────────────────────────────────────────────────────

function OfferBadge({ status }: { status: string | null }) {
    if (!status) return <span className="text-zinc-600 text-xs">—</span>;
    const map: Record<string, { label: string; cls: string }> = {
        draft: { label: 'Szkic', cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' },
        sent: { label: 'Do zatwierdzenia', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        negotiating: { label: 'Negocjuje', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        accepted: { label: 'Zatwierdzona', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
        rejected: { label: 'Odrzucona', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    };
    const s = map[status] || { label: status, cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.cls}`}>
            {status === 'sent' && <Clock className="w-3 h-3" />}
            {status === 'accepted' && <CheckCircle className="w-3 h-3" />}
            {status === 'rejected' && <XCircle className="w-3 h-3" />}
            {status === 'negotiating' && <AlertCircle className="w-3 h-3" />}
            {s.label}
        </span>
    );
}

function NegotiationsBadge({ count }: { count: number }) {
    if (count === 0) return null;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-purple-500/10 text-purple-400 border-purple-500/20">
            <MessageCircle className="w-3 h-3" />
            💬 {count} {count === 1 ? 'negocjacja' : count < 5 ? 'negocjacje' : 'negocjacji'}
        </span>
    );
}

function ContractBadge({ status }: { status: string | null }) {
    if (!status) return <span className="text-zinc-600 text-xs">—</span>;
    const map: Record<string, { label: string; cls: string }> = {
        pending: { label: 'Oczekuje', cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
        sent: { label: 'Wysłana', cls: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
        signed: { label: 'Podpisana', cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
        rejected: { label: 'Odrzucona', cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
    };
    const s = map[status] || { label: status, cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600/30' };
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${s.cls}`}>
            {status === 'signed' && <CheckCircle className="w-3 h-3" />}
            {status === 'pending' && <Clock className="w-3 h-3" />}
            {s.label}
        </span>
    );
}

function GalleryStatus({ stats }: { stats: ClientStats }) {
    if (!stats.hasGallery) return <span className="text-zinc-600 text-xs">—</span>;
    const { photosAdded, photosExpected, isPaid } = stats;
    const pct = photosExpected > 0 ? Math.round((photosAdded / photosExpected) * 100) : 0;

    return (
        <div className="space-y-1 min-w-[110px]">
            <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                    <Camera className="w-3 h-3 inline mr-1" />
                    {photosAdded}/{photosExpected}
                </span>
                {isPaid
                    ? <span className="text-green-400 text-xs flex items-center gap-0.5"><CheckCircle className="w-3 h-3" />Zapłacone</span>
                    : photosAdded > 0
                        ? <span className="text-amber-400 text-xs">Dodane</span>
                        : <span className="text-zinc-500 text-xs">Do dodania</span>
                }
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-amber-500' : 'bg-zinc-700'}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function JobTypeBadge({ stats }: { stats: ClientStats }) {
    if (!stats.jobType) return <span className="text-zinc-600 text-xs">—</span>;
    const isKomunia = stats.isKomunia;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${isKomunia
            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}>
            {isKomunia ? '🕊️' : '📷'} {stats.jobType}
        </span>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────

function ClientsContent() {
    const searchParams = useSearchParams();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [sortField, setSortField] = useState<string>('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [filterOffer, setFilterOffer] = useState<string>('all');
    const [newClient, setNewClient] = useState({ name: '', email: '', phone: '' });
    const [rodoClient, setRodoClient] = useState<Client | null>(null);
    const [rodoLoading, setRodoLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [sendingWelcomeEmail, setSendingWelcomeEmail] = useState<number | null>(null);
    const [hideTestClients, setHideTestClients] = useState(true);

    useEffect(() => { fetchClients(); }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/clients', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setClients(data.clients);
        } catch {
            toast.error('Błąd pobierania klientów');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newClient)
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Klient utworzony! Pamiętaj aby wysłać email powitalny po dodaniu oferty.', { duration: 6000 });
                setShowCreateModal(false);
                setNewClient({ name: '', email: '', phone: '' });
                fetchClients();
            } else {
                toast.error(data.error || 'Błąd tworzenia klienta');
            }
        } catch {
            toast.error('Błąd połączenia');
        }
    };

    const handleRodoAnonymize = async () => {
        if (!rodoClient) return;
        setRodoLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients?id=${rodoClient.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`Dane klienta ${rodoClient.name} zostały zanonimizowane (RODO)`);
                setRodoClient(null);
                fetchClients();
            } else {
                toast.error(data.error || 'Błąd anonimizacji');
            }
        } catch {
            toast.error('Błąd połączenia');
        } finally {
            setRodoLoading(false);
        }
    };

    const handleSendWelcomeEmail = async (clientId: number, clientEmail: string) => {
        if (!confirm(`Czy wysłać email powitalny z linkiem do ustawienia hasła do ${clientEmail}?`)) return;

        setSendingWelcomeEmail(clientId);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${clientId}/send-welcome-email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Email powitalny wysłany');
            } else {
                toast.error(data.error || 'Błąd wysyłania emaila');
            }
        } catch {
            toast.error('Błąd połączenia');
        } finally {
            setSendingWelcomeEmail(null);
        }
    };

    const handleBulkHardDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Czy na pewno chcesz CAŁKOWICIE I NA ZAWSZE usunąć ${selectedIds.length} wybranych klientów? Ta operacja usunie też ich rezerwacje i zwolni adresy e-mail.`)) return;

        setIsDeletingBulk(true);
        try {
            const token = localStorage.getItem('admin_token');
            // We'll call the delete API in a loop for now or modify the API to accept multiple IDs
            // Given the current API, looping is safer without changing the backend logic too much, 
            // but let's assume we want efficiency.
            let successCount = 0;
            for (const id of selectedIds) {
                const res = await fetch(`/api/admin/clients?id=${id}&hard=true`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) successCount++;
            }

            toast.success(`Usunięto ${successCount} klientów.`);
            setSelectedIds([]);
            fetchClients();
        } catch (error) {
            toast.error('Błąd podczas usuwania zbiorczego');
        } finally {
            setIsDeletingBulk(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filtered.length) setSelectedIds([]);
        else setSelectedIds(filtered.map(c => c.id));
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSort = (field: string) => {
        if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortField(field); setSortDir('desc'); }
    };

    const SortIcon = ({ field }: { field: string }) => sortField === field
        ? (sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />)
        : null;

    const isTestClient = (client: Client) => {
        const email = (client.email || '').toLowerCase().trim();
        const name = (client.name || '').toLowerCase().trim();

        return (
            email.endsWith('@fotomatch.test') ||
            email.endsWith('@deleted.local') ||
            /^test\d+@/.test(email) ||
            name.includes('[t]')
        );
    };

    const visibleClients = hideTestClients
        ? clients.filter(c => !isTestClient(c))
        : clients;

    const filtered = visibleClients
        .filter(c =>
            (c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterOffer === 'all' || c.stats.offerStatus === filterOffer ||
                (filterOffer === 'none' && !c.stats.offerStatus))
        )
        .sort((a, b) => {
            let av: any, bv: any;
            if (sortField === 'name') { av = a.name; bv = b.name; }
            else if (sortField === 'totalSpent') { av = a.stats.totalSpent; bv = b.stats.totalSpent; }
            else if (sortField === 'offerStatus') { av = a.stats.offerStatus || ''; bv = b.stats.offerStatus || ''; }
            else { av = a.created_at; bv = b.created_at; }
            if (av < bv) return sortDir === 'asc' ? -1 : 1;
            if (av > bv) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });

    useEffect(() => {
        setSelectedIds(prev => {
            const next = prev.filter(id => filtered.some(c => c.id === id));
            if (next.length === prev.length && next.every((id, idx) => id === prev[idx])) {
                return prev;
            }
            return next;
        });
    }, [filtered]);

    // Summary stats
    const totalLTV = visibleClients.reduce((s, c) => s + (c.stats.approvedAmount || c.stats.totalSpent || 0), 0);
    const pendingOffers = visibleClients.filter(c => c.stats.offerStatus === 'sent').length;
    const signedContracts = visibleClients.filter(c => c.stats.contractStatus === 'signed').length;

    return (
        <div className="min-h-screen bg-zinc-950 text-white p-6">
            <div className="max-w-[1600px] mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-white mb-1">Panel Klienta (CRM)</h1>
                        <p className="text-zinc-400 text-sm">Zarządzaj relacjami, historią i danymi klientów w jednym miejscu.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Szukaj klienta..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full md:w-72 pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:border-gold-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <select
                            value={filterOffer}
                            onChange={e => setFilterOffer(e.target.value)}
                            className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-300 outline-none focus:border-gold-500"
                        >
                            <option value="all">Wszystkie oferty</option>
                            <option value="sent">Do zatwierdzenia</option>
                            <option value="negotiating">Negocjuje</option>
                            <option value="accepted">Zatwierdzona</option>
                            <option value="rejected">Odrzucona</option>
                            <option value="none">Brak oferty</option>
                        </select>
                        <button
                            onClick={() => setHideTestClients(v => !v)}
                            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${hideTestClients
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-600'
                                }`}
                            title="Ukryj/pokaż konta testowe i zanonimizowane"
                        >
                            {hideTestClients ? 'Ukrywanie testowych: ON' : 'Ukrywanie testowych: OFF'}
                        </button>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkHardDelete}
                                disabled={isDeletingBulk}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all text-sm animate-in fade-in zoom-in duration-200"
                            >
                                <Trash2 className="w-4 h-4" /> {isDeletingBulk ? 'Usuwanie...' : `Usuń (${selectedIds.length})`}
                            </button>
                        )}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center justify-center gap-2 px-5 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded-lg transition-all shadow-lg shadow-gold-900/20 text-sm"
                        >
                            <Plus className="w-4 h-4" /> Dodaj Klienta
                        </button>
                    </div>
                </div>

                {/* KPI Summary Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Klientów', value: visibleClients.length, color: 'text-white' },
                        { label: 'LTV łącznie', value: `${totalLTV.toLocaleString('pl-PL')} PLN`, color: 'text-gold-400' },
                        { label: 'Oferty do zatwierdzenia', value: pendingOffers, color: 'text-amber-400' },
                        { label: 'Umowy podpisane', value: signedContracts, color: 'text-green-400' },
                    ].map(kpi => (
                        <div key={kpi.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">{kpi.label}</p>
                            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/80">
                                    <th className="px-4 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === filtered.length && filtered.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-gold-500 focus:ring-gold-500/20"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('name')}>
                                        Klient <SortIcon field="name" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Typ zlecenia
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('offerStatus')}>
                                        Oferta <SortIcon field="offerStatus" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Umowa
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Zaliczka
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Galeria
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300" onClick={() => toggleSort('totalSpent')}>
                                        Wydane (LTV) <SortIcon field="totalSpent" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Sesja
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">
                                        Akcje
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/60">
                                {loading ? (
                                    <tr><td colSpan={9} className="px-6 py-12 text-center text-zinc-500">Ładowanie bazy klientów...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-12 text-center text-zinc-500">Brak klientów spełniających kryteria.</td></tr>
                                ) : filtered.map(client => (
                                    <tr key={client.id} className={`hover:bg-zinc-800/20 transition-colors group ${selectedIds.includes(client.id) ? 'bg-gold-500/5' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(client.id)}
                                                onChange={() => toggleSelect(client.id)}
                                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-950 text-gold-500 focus:ring-gold-500/20"
                                            />
                                        </td>
                                        {/* Klient */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-gold-400 font-bold text-sm shrink-0">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <NextLink href={`/admin/clients/${client.id}`} className="font-medium text-white group-hover:text-gold-400 transition-colors leading-tight block">
                                                        {client.name}
                                                    </NextLink>
                                                    <div className="text-zinc-500 text-xs">{client.email}</div>
                                                    {client.phone && <div className="text-zinc-600 text-xs">{client.phone}</div>}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Typ zlecenia */}
                                        <td className="px-4 py-3">
                                            <JobTypeBadge stats={client.stats} />
                                        </td>

                                        {/* Oferta */}
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <OfferBadge status={client.stats.offerStatus} />
                                                <NegotiationsBadge count={client.stats.negotiationsCount} />
                                                {client.stats.approvedAmount != null && (
                                                    <div className="text-gold-400 text-xs font-bold">
                                                        {client.stats.approvedAmount.toLocaleString('pl-PL')} PLN
                                                    </div>
                                                )}
                                                {client.stats.offersCount > 1 && (
                                                    <div className="text-zinc-600 text-xs">{client.stats.offersCount} ofert</div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Umowa */}
                                        <td className="px-4 py-3">
                                            <div className="space-y-1">
                                                <ContractBadge status={client.stats.contractStatus} />
                                                {client.stats.contractSignedAt && (
                                                    <div className="text-zinc-500 text-xs">
                                                        {new Date(client.stats.contractSignedAt).toLocaleDateString('pl-PL')}
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Zaliczka */}
                                        <td className="px-4 py-3">
                                            {client.stats.depositAmount ? (
                                                <div className="space-y-0.5">
                                                    <div className={`text-xs font-bold ${client.stats.depositStatus === 'paid' ? 'text-emerald-400' :
                                                        client.stats.depositStatus === 'overdue' ? 'text-rose-400' :
                                                            client.stats.depositStatus === 'due_soon' ? 'text-amber-400' :
                                                                'text-zinc-300'}`}>
                                                        {client.stats.depositAmount.toLocaleString('pl-PL')} PLN
                                                    </div>
                                                    <div className={`text-[10px] uppercase tracking-wider ${client.stats.depositStatus === 'paid' ? 'text-emerald-500' :
                                                        client.stats.depositStatus === 'overdue' ? 'text-rose-500 animate-pulse' :
                                                            client.stats.depositStatus === 'due_soon' ? 'text-amber-500' :
                                                                'text-zinc-500'}`}>
                                                        {client.stats.depositStatus === 'paid' ? '✓ opłacona' :
                                                            client.stats.depositStatus === 'overdue' ? '⚠ po terminie' :
                                                                client.stats.depositStatus === 'due_soon' ? '! wkrótce' :
                                                                    'oczekuje'}
                                                    </div>
                                                    {client.stats.depositDueAt && client.stats.depositStatus !== 'paid' && (
                                                        <div className="text-zinc-600 text-[10px]">
                                                            do {new Date(client.stats.depositDueAt).toLocaleDateString('pl-PL')}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-zinc-600 text-xs">—</span>
                                            )}
                                        </td>

                                        {/* Galeria */}
                                        <td className="px-4 py-3">
                                            <GalleryStatus stats={client.stats} />
                                        </td>

                                        {/* Kwota */}
                                        <td className="px-4 py-3">
                                            <div>
                                                <div className={`font-bold ${(client.stats.approvedAmount || client.stats.totalSpent) > 0 ? 'text-gold-400' : 'text-zinc-600'}`}>
                                                    {(client.stats.approvedAmount || client.stats.totalSpent || 0).toLocaleString('pl-PL')} PLN
                                                </div>
                                                {client.stats.isPaid && (
                                                    <div className="text-green-400 text-xs flex items-center gap-0.5 mt-0.5">
                                                        <CheckCircle className="w-3 h-3" /> Zapłacone
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* Sesja */}
                                        <td className="px-4 py-3">
                                            {client.stats.nextBookingDate ? (
                                                <div>
                                                    <div className="text-white text-xs font-medium">
                                                        {new Date(client.stats.nextBookingDate).toLocaleDateString('pl-PL')}
                                                    </div>
                                                    <div className={`text-xs mt-0.5 ${client.stats.bookingStatus === 'confirmed' ? 'text-green-400' :
                                                        client.stats.bookingStatus === 'completed' ? 'text-zinc-400' :
                                                            'text-amber-400'
                                                        }`}>
                                                        {client.stats.bookingStatus === 'confirmed' ? 'Potwierdzona' :
                                                            client.stats.bookingStatus === 'completed' ? 'Zrealizowana' :
                                                                client.stats.bookingStatus === 'pending' ? 'Oczekuje' :
                                                                    client.stats.bookingStatus || ''}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-600 text-xs">—</span>
                                            )}
                                        </td>

                                        {/* Akcje */}
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <NextLink
                                                    href={`/admin/clients/${client.id}`}
                                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs transition-all border border-zinc-700 hover:border-zinc-600 inline-flex items-center gap-1"
                                                >
                                                    <User className="w-3 h-3" /> Profil
                                                </NextLink>
                                                <button
                                                    onClick={() => handleSendWelcomeEmail(client.id, client.email)}
                                                    disabled={sendingWelcomeEmail === client.id}
                                                    title="Wyślij email powitalny z linkiem do ustawienia hasła"
                                                    className="p-1.5 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 rounded-lg text-xs transition-all border border-blue-900/30 hover:border-blue-700 disabled:opacity-50"
                                                >
                                                    {sendingWelcomeEmail === client.id ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Mail className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setRodoClient(client)}
                                                    title="Anonimizuj dane (RODO)"
                                                    className="p-1.5 bg-zinc-800 hover:bg-red-900/40 text-zinc-500 hover:text-red-400 rounded-lg text-xs transition-all border border-zinc-700 hover:border-red-800"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    {filtered.length > 0 && (
                        <div className="px-4 py-3 border-t border-zinc-800 text-xs text-zinc-500">
                            Wyświetlono {filtered.length} z {visibleClients.length} klientów
                        </div>
                    )}
                </div>

                {/* RODO Anonymization Modal */}
                {rodoClient && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-red-900/50 rounded-2xl w-full max-w-md shadow-2xl">
                            <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                                    <ShieldAlert className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Anonimizacja RODO</h2>
                                    <p className="text-xs text-zinc-500">Operacja nieodwracalna</p>
                                </div>
                                <button onClick={() => setRodoClient(null)} className="ml-auto text-zinc-500 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
                                    <p className="text-red-300 text-sm font-medium mb-1">⚠️ Uwaga: ta operacja jest nieodwracalna</p>
                                    <p className="text-zinc-400 text-sm">
                                        Dane klienta <strong className="text-white">{rodoClient.name}</strong> ({rodoClient.email}) zostaną zanonimizowane zgodnie z RODO:
                                    </p>
                                    <ul className="mt-2 text-xs text-zinc-500 space-y-1 list-disc list-inside">
                                        <li>Imię i email zastąpione anonimowymi wartościami</li>
                                        <li>Telefon i adres usunięte</li>
                                        <li>Powiązane zamówienia i rezerwacje zanonimizowane</li>
                                        <li>Konto dezaktywowane</li>
                                    </ul>
                                </div>
                                <p className="text-zinc-400 text-sm">Dane finansowe i historyczne pozostają w systemie w formie zanonimizowanej dla celów księgowych.</p>
                            </div>
                            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                                <button
                                    onClick={() => setRodoClient(null)}
                                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors font-medium text-sm"
                                >
                                    Anuluj
                                </button>
                                <button
                                    onClick={handleRodoAnonymize}
                                    disabled={rodoLoading}
                                    className="px-6 py-2 bg-red-700 hover:bg-red-600 disabled:bg-zinc-700 text-white font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {rodoLoading ? 'Anonimizowanie...' : 'Anonimizuj (RODO)'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Create Client Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
                            <form onSubmit={handleCreateClient}>
                                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <User className="w-5 h-5 text-gold-500" /> Nowy Klient
                                    </h2>
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {[
                                        { label: 'Imię i Nazwisko', key: 'name', type: 'text', placeholder: 'Jan Kowalski', required: true },
                                        { label: 'Email', key: 'email', type: 'email', placeholder: 'jan@example.com', required: true },
                                        { label: 'Telefon', key: 'phone', type: 'tel', placeholder: '+48 123 456 789', required: false },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-sm text-zinc-400 mb-1">{f.label}</label>
                                            <input
                                                type={f.type}
                                                required={f.required}
                                                value={(newClient as any)[f.key]}
                                                onChange={e => setNewClient({ ...newClient, [f.key]: e.target.value })}
                                                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-lg focus:border-gold-500 outline-none text-white text-sm"
                                                placeholder={f.placeholder}
                                            />
                                        </div>
                                    ))}
                                    <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3">
                                        <p className="text-xs text-amber-400 font-medium">� Email powitalny NIE zostanie wysłany automatycznie</p>
                                        <p className="text-xs text-zinc-500 mt-1">Po utworzeniu konta, dodaj ofertę dla klienta, a następnie ręcznie wyślij email powitalny używając przycisku <Mail className="inline w-3 h-3" /> w tabeli klientów lub na profilu klienta.</p>
                                    </div>
                                </div>
                                <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-zinc-400 hover:text-white transition-colors font-medium text-sm">
                                        Anuluj
                                    </button>
                                    <button type="submit" className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded-lg transition-colors shadow-lg shadow-gold-900/20 text-sm">
                                        Utwórz konto
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ClientsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white p-8">Ładowanie...</div>}>
            <ClientsContent />
        </Suspense>
    );
}
