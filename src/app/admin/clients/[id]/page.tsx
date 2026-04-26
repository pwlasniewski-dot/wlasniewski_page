'use client';

import React, { useState, useEffect, Suspense, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    User, Calendar, Image as ImageIcon,
    FileText, Shield, Trash2, ExternalLink, RefreshCw, Cloud, Download,
    ChevronLeft, Save, Mail, MapPin, Phone, Edit, Plus, Lock, CheckCircle2, AlertTriangle, Upload,
    Activity, Eye, PenTool, MessageSquare, FileUp, Package, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import GalleryAdmin from '@/components/admin/GalleryAdmin';

interface ClientDetails {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    last_login: string | null;
    last_failed_login: string | null;
    created_at: string;
    is_active: boolean;
    stats: {
        ordersCount: number;
        bookingsCount: number;
        galleriesCount: number;
        totalSpent: number;
        lastActive: string | null;
    };
    offers: any[];
    orders: any[];
    assigned_bookings: any[];
    assigned_galleries: any[];
    client_galleries: any[]; // New field
    contracts: any[];
    baskets: any[];
    permissions?: Record<string, boolean> | null;
}

function ClientDetailsContent({ id }: { id: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [client, setClient] = useState<ClientDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const tabFromUrl = searchParams.get('tab') as 'overview' | 'galleries' | 'offers' | 'contracts' | 'settings' | 'permissions' | null;
    const [activeTab, setActiveTab] = useState<'overview' | 'galleries' | 'offers' | 'contracts' | 'activity' | 'settings' | 'permissions'>(tabFromUrl || 'overview');
    const [permissions, setPermissions] = useState<Record<string, boolean>>({
        galleries: true, offers: true, contracts: true, bookings: true, gift_cards: true
    });
    const [isSavingPerms, setIsSavingPerms] = useState(false);
    const [editingGalleryId, setEditingGalleryId] = useState<number | null>(null);
    const [isCreatingGallery, setIsCreatingGallery] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingGalleryId, setDeletingGalleryId] = useState<number | null>(null);
    const [deletingOfferId, setDeletingOfferId] = useState<number | null>(null);
    const [confirmingOfferDelete, setConfirmingOfferDelete] = useState<number | null>(null);
    const [deletingContractId, setDeletingContractId] = useState<number | null>(null);
    const [confirmingContractDelete, setConfirmingContractDelete] = useState<number | null>(null);
    const [savingContractId, setSavingContractId] = useState<number | null>(null);
    const [savingOfferId, setSavingOfferId] = useState<number | null>(null);
    const [uploadingOfferPdf, setUploadingOfferPdf] = useState<number | null>(null);
    const [uploadingContractPdf, setUploadingContractPdf] = useState<number | null>(null);
    const offerPdfInputRef = React.useRef<HTMLInputElement>(null);
    const contractPdfInputRef = React.useRef<HTMLInputElement>(null);
    const [pendingUploadId, setPendingUploadId] = useState<{ type: 'offer' | 'contract'; id: number } | null>(null);
    const standaloneOfferPdfRef = React.useRef<HTMLInputElement>(null);
    const standaloneContractPdfRef = React.useRef<HTMLInputElement>(null);
    const [uploadingStandaloneOffer, setUploadingStandaloneOffer] = useState(false);
    const [uploadingStandaloneContract, setUploadingStandaloneContract] = useState(false);
    const [notifyingOffer, setNotifyingOffer] = useState<number | null>(null);
    const [notifyingContract, setNotifyingContract] = useState<number | null>(null);

    // CRM Activity state
    const [activities, setActivities] = useState<any[]>([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [activitiesTotal, setActivitiesTotal] = useState(0);

    const loadActivities = async () => {
        setActivitiesLoading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/crm-activity?client_id=${id}&limit=200`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities || []);
                setActivitiesTotal(data.total || 0);
            }
        } catch (e) {
            console.error('Failed to load activities:', e);
        } finally {
            setActivitiesLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'activity' && activities.length === 0) {
            loadActivities();
        }
    }, [activeTab]);

    const handleStandaloneUpload = async (type: 'offer' | 'contract', file: File) => {
        const setUploading = type === 'offer' ? setUploadingStandaloneOffer : setUploadingStandaloneContract;
        setUploading(true);
        try {
            const token = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('pdf', file);
            if (type === 'offer') {
                formData.append('client_id', String(client.id));
                formData.append('client_email', client.email);
            } else {
                formData.append('client_id', String(client.id));
            }
            const endpoint = type === 'offer'
                ? '/api/admin/offers/upload-standalone'
                : '/api/admin/contracts/upload-standalone';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`PDF ${type === 'offer' ? 'oferty' : 'umowy'} wgrany i utworzony pomyślnie`);
                fetchClientDetails();
            } else {
                toast.error(data.error || 'Błąd uploadu PDF');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setUploading(false);
        }
    };

    const handleNotifyClient = async (type: 'offer' | 'contract', entityId: number) => {
        const setNotifying = type === 'offer' ? setNotifyingOffer : setNotifyingContract;
        setNotifying(entityId);
        try {
            const token = localStorage.getItem('admin_token');
            const endpoint = type === 'offer'
                ? `/api/admin/offers/${entityId}/send-email`
                : `/api/admin/contracts/${entityId}/send-email`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            const data = await res.json();
            if (data.success || res.ok) {
                toast.success(data.message || `E-mail wysłany do klienta`);
            } else {
                toast.error(data.error || 'Błąd wysyłki e-mail');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setNotifying(null);
        }
    };

    const handleUploadPdf = async (type: 'offer' | 'contract', entityId: number, file: File) => {
        const setUploading = type === 'offer' ? setUploadingOfferPdf : setUploadingContractPdf;
        setUploading(entityId);
        try {
            const token = localStorage.getItem('admin_token');
            const formData = new FormData();
            formData.append('pdf', file);
            const endpoint = type === 'offer'
                ? `/api/admin/offers/${entityId}/upload-pdf`
                : `/api/admin/contracts/${entityId}/upload-pdf`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`PDF ${type === 'offer' ? 'oferty' : 'umowy'} wgrany pomyślnie`);
                fetchClientDetails();
            } else {
                toast.error(data.error || 'Błąd uploadu PDF');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setUploading(null);
            setPendingUploadId(null);
        }
    };

    // Edit Form State
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        is_active: true
    });

    useEffect(() => {
        fetchClientDetails();
    }, [id]);

    const fetchClientDetails = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setClient(data.client);
                setEditForm({
                    name: data.client.name || '',
                    email: data.client.email || '',
                    phone: data.client.phone || '',
                    address: data.client.address || '',
                    city: data.client.city || '',
                    postal_code: data.client.postal_code || '',
                    is_active: data.client.is_active ?? true
                });
                // Load persisted permissions or default all to true
                if (data.client.permissions && typeof data.client.permissions === 'object') {
                    setPermissions({ galleries: true, offers: true, contracts: true, bookings: true, gift_cards: true, ...data.client.permissions });
                }
            } else {
                toast.error('Nie znaleziono klienta');
                router.push('/admin/clients');
            }
        } catch (error) {
            toast.error('Błąd pobierania danych');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateClient = async () => {
        if (!client) return;
        try {
            setIsSaving(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${client.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                toast.success('Dane zaktualizowane');
                fetchClientDetails();
            } else {
                toast.error('Błąd aktualizacji');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setIsSaving(false);
        }
    };

    const [sendingWelcomeEmail, setSendingWelcomeEmail] = useState(false);

    const handleSendWelcomeEmail = async () => {
        if (!client) return;
        if (!confirm(`Czy wysłać email powitalny z linkiem do ustawienia hasła do ${client.email}?`)) return;

        setSendingWelcomeEmail(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${client.id}/send-welcome-email`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Email powitalny wysłany');
            } else {
                toast.error(data.error || 'Błąd wysyłania emaila');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setSendingWelcomeEmail(false);
        }
    };

    const handleDeleteGallery = async (galleryId: number) => {
        if (!confirm('Czy na pewno chcesz usunąć tę galerię? Tej operacji nie można cofnąć.')) return;
        try {
            setDeletingGalleryId(galleryId);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/galleries/${galleryId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Galeria została usunięta');
                fetchClientDetails();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Błąd usuwania galerii');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setDeletingGalleryId(null);
        }
    };


    const handleDeleteOffer = async (offerId: number) => {
        console.log('Rozpoczynam usuwanie oferty:', offerId);
        try {
            setDeletingOfferId(offerId);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers/${offerId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Odpowiedź z usunięcia:', res.status);
            if (res.ok) {
                toast.success('Oferta została usunięta');
                fetchClientDetails();
            } else {
                const data = await res.json();
                console.error('Błąd usuwania API:', data);
                toast.error(data.error || 'Błąd usuwania oferty');
            }
        } catch (error) {
            console.error('Błąd połączenia podczas usuwania:', error);
            toast.error('Błąd połączenia');
        } finally {
            setDeletingOfferId(null);
            setConfirmingOfferDelete(null);
        }
    };

    const handleDeleteContract = async (contractId: number) => {
        console.log('Rozpoczynam usuwanie umowy:', contractId);
        try {
            setDeletingContractId(contractId);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/contracts/${contractId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('Odpowiedź z usunięcia:', res.status, data);
            if (res.ok) {
                toast.success('Umowa została usunięta');
                fetchClientDetails();
            } else {
                toast.error(data.error || 'Błąd podczas usuwania umowy');
            }
        } catch (error) {
            console.error('Błąd połączenia podczas usuwania:', error);
            toast.error('Błąd połączenia');
        } finally {
            setDeletingContractId(null);
            setConfirmingContractDelete(null);
        }
    };

    const handleSaveContractS3 = async (contractId: number) => {
        try {
            setSavingContractId(contractId);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/contracts/${contractId}/save-s3`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('PDF został zapisany w S3');
                fetchClientDetails();
            } else {
                toast.error(data.error || 'Błąd zapisu do S3');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setSavingContractId(null);
        }
    };

    const handleSaveOfferS3 = async (offerId: number) => {
        try {
            setSavingOfferId(offerId);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers/${offerId}/save-s3`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Oferta została zapisana w S3');
                fetchClientDetails();
            } else {
                toast.error(data.error || 'Błąd zapisu do S3');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setSavingOfferId(null);
        }
    };

    const handleAnonymizeClient = async (isHardDelete: boolean = false) => {
        if (!client) return;
        const actionName = isHardDelete ? 'USUNĄĆ CAŁKOWICIE (usuwa też rezerwacje)' : 'ZANONIMIZOWAĆ (RODO)';
        if (!confirm(`Czy na pewno chcesz ${actionName} tego klienta? Tej operacji nie można cofnąć.`)) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients?id=${client.id}${isHardDelete ? '&hard=true' : ''}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success(isHardDelete ? 'Klient usunięty na zawsze' : 'Klient zanonimizowany');
                router.push('/admin/clients');
            } else {
                const data = await res.json();
                toast.error(data.error || 'Błąd operacji');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        }
    };

    const handleSavePermissions = async () => {
        if (!client) return;
        try {
            setIsSavingPerms(true);
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${client.id}`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions })
            });
            if (res.ok) {
                toast.success('Uprawnienia zapisane');
            } else {
                toast.error('Błąd zapisu uprawnień');
            }
        } catch {
            toast.error('Błąd połączenia');
        } finally {
            setIsSavingPerms(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
                <RefreshCw className="w-8 h-8 animate-spin mr-3" /> Ładowanie profilu...
            </div>
        );
    }

    if (!client) return null;

    // Merge galleries from both sources (legacy assigned vs new client_galleries)
    // Prioritize client_galleries if available, but show both unique sets
    const allGalleries = [...(client.client_galleries || []), ...(client.assigned_galleries || [])]
        .filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Unique by ID

    return (
        <div className="min-h-screen bg-zinc-950 text-white pb-20">
            {/* Hidden file inputs for PDF upload */}
            <input
                type="file"
                ref={offerPdfInputRef}
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && pendingUploadId?.type === 'offer') {
                        handleUploadPdf('offer', pendingUploadId.id, file);
                    }
                    e.target.value = '';
                }}
            />
            <input
                type="file"
                ref={contractPdfInputRef}
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && pendingUploadId?.type === 'contract') {
                        handleUploadPdf('contract', pendingUploadId.id, file);
                    }
                    e.target.value = '';
                }}
            />
            <input
                type="file"
                ref={standaloneOfferPdfRef}
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStandaloneUpload('offer', file);
                    e.target.value = '';
                }}
            />
            <input
                type="file"
                ref={standaloneContractPdfRef}
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStandaloneUpload('contract', file);
                    e.target.value = '';
                }}
            />
            {/* Header / Hero */}
            <div className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    <div className="flex items-center gap-4 mb-6">
                        <NextLink href="/admin/clients" className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
                            <ChevronLeft className="w-6 h-6" />
                        </NextLink>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-white mb-1 flex items-center gap-3">
                                {client.name}
                                {!client.is_active && <span className="px-2 py-0.5 bg-red-500/20 text-red-500 text-xs rounded-full uppercase tracking-wider font-bold">Nieaktywny</span>}
                            </h1>
                            <div className="flex items-center gap-6 text-sm text-zinc-400">
                                <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {client.email}</span>
                                {client.phone && <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {client.phone}</span>}
                                <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> ID: {client.id}</span>
                            </div>
                        </div>
                        <div className="ml-auto flex gap-3">
                            <button
                                onClick={handleSendWelcomeEmail}
                                disabled={sendingWelcomeEmail}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                                title="Wyślij email powitalny z linkiem do ustawienia hasła"
                            >
                                {sendingWelcomeEmail ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" /> Wysyłanie...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="w-4 h-4" /> Wyślij Email Powitalny
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleUpdateClient}
                                disabled={isSaving}
                                className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded-lg transition-all flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 overflow-x-auto pb-1">
                        {[
                            { id: 'overview', label: 'Przegląd & Statystyki', icon: User },
                            { id: 'galleries', label: `Galerie (${allGalleries.length})`, icon: ImageIcon },
                            { id: 'offers', label: `Oferty (${client.offers?.length || 0})`, icon: Calendar },
                            { id: 'contracts', label: `Umowy (${client.contracts?.length || 0})`, icon: FileText },
                            { id: 'activity', label: 'Aktywność', icon: Activity },
                            { id: 'settings', label: 'Edycja Danych', icon: Edit },
                            { id: 'permissions', label: 'Dostęp Klienta', icon: Lock },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-lg transition-all border-b-2 ${activeTab === tab.id
                                    ? 'border-gold-500 text-gold-400 bg-zinc-800/50'
                                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Stats Cards */}
                        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Wydane (LTV)</p>
                                <p className="text-3xl font-bold text-gold-400">
                                    {client.orders?.reduce((sum: number, o: any) => sum + o.amount_paid, 0).toLocaleString()} PLN
                                </p>
                            </div>
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Sesje (Bookings)</p>
                                <p className="text-3xl font-bold text-white">{client.assigned_bookings?.length || 0}</p>
                            </div>
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Galerie</p>
                                <p className="text-3xl font-bold text-white">{allGalleries.length}</p>
                            </div>
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                <p className="text-zinc-500 text-xs uppercase font-bold mb-2">Aktywność</p>
                                <div className="space-y-1">
                                    <p className="text-xs text-green-400">Ostatnie logowanie: {client.last_login ? new Date(client.last_login).toLocaleDateString() : '-'}</p>
                                    <p className="text-xs text-zinc-500">Rejestracja: {new Date(client.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Bookings */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">Ostatnie Rezerwacje</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {client.assigned_bookings?.length > 0 ? (
                                        client.assigned_bookings.map((booking: any) => (
                                            <div key={booking.id} className="bg-zinc-950/50 p-4 rounded-lg flex justify-between items-center border border-zinc-800/50">
                                                <div>
                                                    <p className="font-bold text-white">{booking.package}</p>
                                                    <p className="text-xs text-zinc-500">{new Date(booking.date).toLocaleDateString()} • {booking.city}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-400'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-zinc-500 italic">Brak historii rezerwacji.</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">Historia Zamówień</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    {client.orders?.length > 0 ? (
                                        client.orders.map((order: any) => (
                                            <div key={order.id} className="bg-zinc-950/50 p-4 rounded-lg flex justify-between items-center border border-zinc-800/50">
                                                <div>
                                                    <p className="font-bold text-white">{order.gift_card ? `Karta Podarunkowa #${order.id}` : `Zamówienie #${order.id}`}</p>
                                                    <p className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                                <p className="font-bold text-gold-400">{order.amount_paid} PLN</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-zinc-500 italic">Brak zamówień.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Card */}
                        <div className="space-y-8">
                            <div className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 h-fit">
                                <h3 className="text-lg font-bold text-white mb-6">Dane Kontaktowe</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Adres Email</label>
                                        <div className="flex items-center gap-3 text-white">
                                            <Mail className="w-4 h-4 text-gold-500" />
                                            {client.email}
                                        </div>
                                    </div>
                                    <div className="h-px bg-zinc-800" />
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Telefon</label>
                                        <div className="flex items-center gap-3 text-white">
                                            <Phone className="w-4 h-4 text-gold-500" />
                                            {client.phone || '-'}
                                        </div>
                                    </div>
                                    <div className="h-px bg-zinc-800" />
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-1">Adres</label>
                                        <div className="flex items-start gap-3 text-white">
                                            <MapPin className="w-4 h-4 text-gold-500 mt-1" />
                                            <div>
                                                <p>{client.address || '-'}</p>
                                                <p>{client.postal_code} {client.city}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* GALLERIES TAB */}
                {activeTab === 'galleries' && (
                    <div className="space-y-6">
                        {editingGalleryId || isCreatingGallery ? (
                            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-white">
                                        {isCreatingGallery ? 'Tworzenie Nowej Galerii' : 'Edycja Galerii'}
                                    </h3>
                                    <button
                                        onClick={() => { setEditingGalleryId(null); setIsCreatingGallery(false); }}
                                        className="text-zinc-400 hover:text-white"
                                    >
                                        Anuluj
                                    </button>
                                </div>
                                <GalleryAdmin
                                    galleryId={editingGalleryId}
                                    clientEmail={client.email}
                                    clientName={client.name}
                                    onClose={() => {
                                        setEditingGalleryId(null);
                                        setIsCreatingGallery(false);
                                        fetchClientDetails();
                                    }}
                                    onCreated={(newId) => {
                                        setIsCreatingGallery(false);
                                        setEditingGalleryId(newId);
                                        fetchClientDetails();
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Galerie Zdjęć</h2>
                                        <p className="text-zinc-500">Zarządzaj dostępem klienta do zdjęć.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreatingGallery(true)}
                                        className="px-6 py-3 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded-lg flex items-center gap-2 transition-all"
                                    >
                                        <ImageIcon className="w-5 h-5" /> Nowa Galeria
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {allGalleries.length > 0 ? (
                                        allGalleries.map((gallery: any) => (
                                            <div key={gallery.id} className="bg-zinc-900 border border-zinc-800 hover:border-gold-500/50 rounded-xl overflow-hidden transition-all group shadow-lg">
                                                {/* Cover / Placeholder */}
                                                <div className="h-40 bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                                                    {gallery.photos && gallery.photos.length > 0 ? (
                                                        <img
                                                            src={gallery.photos[0].url}
                                                            alt="Cover"
                                                            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="w-12 h-12 text-zinc-800" />
                                                    )}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                                                    <div className="absolute bottom-4 left-4">
                                                        <p className="font-mono text-gold-400 text-xs bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                                                            KOD: {gallery.access_code}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="p-6">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h3 className="font-bold text-white text-lg">Galeria #{gallery.id}</h3>
                                                            <p className="text-xs text-zinc-500">
                                                                Utworzono: {new Date(gallery.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <span className={`w-2 h-2 rounded-full ${gallery.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                                        <div className="bg-zinc-950 p-2 rounded text-center">
                                                            <p className="text-zinc-500 text-xs">Standard</p>
                                                            <p className="font-bold text-white">{gallery.standard_count || 0}</p>
                                                        </div>
                                                        <div className="bg-zinc-950 p-2 rounded text-center">
                                                            <p className="text-zinc-500 text-xs">Cena/szt</p>
                                                            <p className="font-bold text-white">{gallery.price_per_premium} PLN</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => setEditingGalleryId(gallery.id)}
                                                            className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700 hover:border-zinc-600"
                                                        >
                                                            Edytuj
                                                        </button>
                                                        <a
                                                            href={`/galeria/${gallery.access_code}`}
                                                            target="_blank"
                                                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors border border-zinc-700 hover:border-zinc-600"
                                                        >
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                        <button
                                                            onClick={() => handleDeleteGallery(gallery.id)}
                                                            disabled={deletingGalleryId === gallery.id}
                                                            className="px-4 py-2 bg-red-900/30 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-red-900/50 hover:border-red-700 disabled:opacity-50"
                                                            title="Usuń galerię"
                                                        >
                                                            {deletingGalleryId === gallery.id
                                                                ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                                : <Trash2 className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 text-center text-zinc-500 bg-zinc-900 rounded-xl border border-zinc-800 border-dashed">
                                            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            <p className="text-lg font-medium">Brak galerii</p>
                                            <p className="text-sm">Kliknij "Nowa Galeria" aby dodać zdjęcia.</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}


                {/* OFFERS TAB */}
                {activeTab === 'offers' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                            <div>
                                <h2 className="text-xl font-bold text-white">Oferty Handlowe</h2>
                                <p className="text-zinc-500">Historia propozycji i wycen.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => standaloneOfferPdfRef.current?.click()}
                                    disabled={uploadingStandaloneOffer}
                                    className="px-5 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 text-white font-bold rounded-lg flex items-center gap-2 transition-all"
                                >
                                    {uploadingStandaloneOffer
                                        ? <><RefreshCw className="w-5 h-5 animate-spin" /> Wgrywam...</>
                                        : <><Upload className="w-5 h-5" /> Wgraj PDF</>}
                                </button>
                                <NextLink href={`/admin/offers/create?client_id=${client.id}&clientEmail=${client.email}`}>
                                    <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg flex items-center gap-2 transition-all">
                                        <Plus className="w-5 h-5" /> Nowa Oferta
                                    </button>
                                </NextLink>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {client.offers?.length > 0 ? (
                                client.offers.map((offer: any) => (
                                    <div key={offer.id} className="space-y-4">
                                        <div className="bg-zinc-900 hover:bg-zinc-800/80 p-6 rounded-xl border border-zinc-800 transition-all group flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className={`w-2 h-12 rounded-full ${offer.type === 'b2b' ? 'bg-indigo-500' : 'bg-rose-500'}`} />
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">{offer.title}</h3>
                                                        <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 border border-zinc-700 uppercase font-bold text-zinc-400">
                                                            {offer.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-zinc-500 text-sm">Utworzono: {new Date(offer.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="flex flex-col items-end mb-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${offer.status === 'accepted' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                            offer.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                                                offer.status === 'pending' || offer.status === 'sent' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                                    offer.status === 'unlock_requested' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                                        'bg-zinc-800 text-zinc-500 border-zinc-700'
                                                            }`}>
                                                            {offer.status === 'accepted' ? 'Zaakceptowana' :
                                                                offer.status === 'rejected' ? 'Odrzucona' :
                                                                    offer.status === 'pending' || offer.status === 'sent' ? 'Oczekuje' :
                                                                        offer.status === 'unlock_requested' ? 'Prośba o odblokowanie' :
                                                                            offer.status === 'draft' ? 'Szkic' : offer.status}
                                                        </span>
                                                    </div>

                                                    {offer.status === 'accepted' ? (
                                                        <>
                                                            <p className="text-2xl font-bold text-white">{offer.total_price?.toLocaleString() || 0} PLN</p>
                                                            <p className="text-xs uppercase font-bold text-zinc-600 tracking-wider">Wartość końcowa</p>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-end">
                                                            <span className="text-xs font-bold text-zinc-600 uppercase">Wartość</span>
                                                            <span className="text-sm font-bold text-zinc-500 italic">Po decyzji klienta</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <NextLink href={`/admin/offers/${offer.id}`} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white border border-zinc-700 hover:border-zinc-500 transition-all">
                                                        Edytuj
                                                    </NextLink>

                                                    <button
                                                        onClick={() => handleSaveOfferS3(offer.id)}
                                                        disabled={savingOfferId === offer.id}
                                                        className={`p-3 rounded-lg border transition-all ${offer.pdf_url
                                                            ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 hover:border-zinc-500'
                                                            : 'bg-zinc-900/50 text-gold-500/50 border-zinc-800 hover:border-gold-500/50'
                                                            }`}
                                                        title={offer.pdf_url ? "Zaktualizuj PDF w S3" : "Zapisz PDF w S3"}
                                                    >
                                                        {savingOfferId === offer.id
                                                            ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                            : <Cloud className="w-5 h-5" />}
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setPendingUploadId({ type: 'offer', id: offer.id });
                                                            offerPdfInputRef.current?.click();
                                                        }}
                                                        disabled={uploadingOfferPdf === offer.id}
                                                        className="p-3 rounded-lg border transition-all bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 hover:text-amber-400 border-amber-900/30 hover:border-amber-700"
                                                        title="Wgraj własny PDF oferty"
                                                    >
                                                        {uploadingOfferPdf === offer.id
                                                            ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                            : <Upload className="w-5 h-5" />}
                                                    </button>

                                                    {/* Notify client about offer */}
                                                    <button
                                                        onClick={() => handleNotifyClient('offer', offer.id)}
                                                        disabled={notifyingOffer === offer.id}
                                                        className="p-3 rounded-lg border transition-all bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border-blue-900/30 hover:border-blue-700"
                                                        title="Wyślij e-mail do klienta o ofercie"
                                                    >
                                                        {notifyingOffer === offer.id
                                                            ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                            : <Mail className="w-5 h-5" />}
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const token = localStorage.getItem('admin_token');
                                                            if (!offer.pdf_url) {
                                                                toast.error('PDF nie został jeszcze wygenerowany. Użyj przycisku "S3" obok.');
                                                                return;
                                                            }
                                                            window.open(`/api/offers/${offer.id}/pdf?token=${token}`, '_blank');
                                                        }}
                                                        className={`p-3 rounded-lg border transition-all ${offer.pdf_url
                                                            ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 hover:border-zinc-500'
                                                            : 'bg-zinc-900/50 text-zinc-600 border-zinc-800 cursor-not-allowed'
                                                            }`}
                                                        title={offer.pdf_url ? "Pobierz PDF" : "PDF niedostępny (wymaga generowania)"}
                                                    >
                                                        <FileText className="w-5 h-5" />
                                                    </button>

                                                    {offer.status === 'accepted' && offer.pdf_url && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                const token = localStorage.getItem('admin_token');
                                                                const acceptedPdfUrl = offer.pdf_url.replace(/\.pdf$/, '_zatwierdzona.pdf');
                                                                window.open(acceptedPdfUrl, '_blank');
                                                            }}
                                                            className="p-3 rounded-lg border transition-all bg-green-600 hover:bg-green-700 text-white border-green-700 hover:border-green-500"
                                                            title="Pobierz ofertę po zatwierdzeniu"
                                                        >
                                                            <FileText className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (confirmingOfferDelete === offer.id) {
                                                                handleDeleteOffer(offer.id);
                                                            } else {
                                                                setConfirmingOfferDelete(offer.id);
                                                                setTimeout(() => setConfirmingOfferDelete(null), 3000);
                                                            }
                                                        }}
                                                        disabled={deletingOfferId === offer.id}
                                                        className={`p-3 rounded-lg transition-colors border disabled:opacity-50 flex items-center justify-center min-w-[44px] ${confirmingOfferDelete === offer.id ? 'bg-red-600 text-white border-red-500' : 'bg-red-900/10 hover:bg-red-900 text-red-500 hover:text-white border-red-900/20 hover:border-red-700'}`}
                                                        title={confirmingOfferDelete === offer.id ? "Potwierdź usunięcie" : "Usuń ofertę"}
                                                    >
                                                        {deletingOfferId === offer.id
                                                            ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                            : confirmingOfferDelete === offer.id ? <span className="text-[10px] font-bold">USUŃ</span> : <Trash2 className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Detailed breakdown for accepted offers */}
                                        {offer.status === 'accepted' && offer.client_selection && (
                                            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-4 ml-14 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <div className="flex flex-wrap gap-6 items-start">
                                                    {offer.client_selection.childCount !== undefined && (
                                                        <div>
                                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Liczba dzieci</p>
                                                            <p className="text-xl font-bold text-gold-400">{offer.client_selection.childCount}</p>
                                                        </div>
                                                    )}

                                                    {offer.client_selection.selectedPackage && (
                                                        <div>
                                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Wybrany pakiet</p>
                                                            <p className="text-sm font-bold text-white mb-1">{offer.client_selection.selectedPackage.name}</p>
                                                            <p className="text-xs text-zinc-400">{offer.client_selection.selectedPackage.price}</p>
                                                        </div>
                                                    )}

                                                    {offer.client_selection.packagesBreakdown && offer.client_selection.packagesBreakdown.length > 0 && (
                                                        <div className="flex-1">
                                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Rozliczenie pakietów</p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                                {offer.client_selection.packagesBreakdown.map((pkg: any, idx: number) => (
                                                                    <div key={idx} className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800">
                                                                        <p className="text-xs font-bold text-zinc-300 truncate" title={pkg.name}>{pkg.name}</p>
                                                                        <div className="flex justify-between items-end mt-1">
                                                                            <p className="text-xs text-zinc-500">{pkg.count} x {pkg.price}</p>
                                                                            <p className="font-bold text-white text-xs">{pkg.subtotal?.toLocaleString() || 0} PLN</p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {offer.client_selection.selectedOptionalItems && offer.client_selection.selectedOptionalItems.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Dodatki</p>
                                                            <p className="text-xs text-zinc-400">{offer.client_selection.selectedOptionalItems.length} wybranych</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Client note (notatka klienta) */}
                                        {offer.client_note && (
                                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 ml-14 mt-2">
                                                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                                    Notatka od klienta
                                                </p>
                                                <p className="text-sm text-zinc-200 whitespace-pre-wrap">{offer.client_note}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-zinc-500 bg-zinc-900 rounded-xl border border-zinc-800 border-dashed">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-medium">Brak ofert</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CONTRACTS TAB */}
                {activeTab === 'contracts' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-xl border border-zinc-800">
                            <div>
                                <h2 className="text-xl font-bold text-white">Umowy</h2>
                                <p className="text-zinc-500">Podpisane dokumenty i szablony.</p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => standaloneContractPdfRef.current?.click()}
                                    disabled={uploadingStandaloneContract}
                                    className="px-5 py-3 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-700 text-white font-bold rounded-lg flex items-center gap-2 transition-all"
                                >
                                    {uploadingStandaloneContract
                                        ? <><RefreshCw className="w-5 h-5 animate-spin" /> Wgrywam...</>
                                        : <><Upload className="w-5 h-5" /> Wgraj PDF</>}
                                </button>
                                <NextLink href={`/admin/generator-umow/create?client_id=${client.id}`}>
                                    <button className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg flex items-center gap-2 transition-all">
                                        <Plus className="w-5 h-5" /> Nowa Umowa
                                    </button>
                                </NextLink>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {client.contracts?.length > 0 ? (
                                client.contracts.map((contract: any) => (
                                    <div key={contract.id} className="bg-zinc-900 p-6 rounded-xl border border-zinc-800 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">
                                                {contract.contract_number || `Umowa #${contract.id}`}
                                            </h3>
                                            <p className="text-sm text-zinc-500">
                                                Status: <span className="uppercase text-white font-bold">{contract.status}</span>
                                                {contract.signed_pdf_url && (
                                                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                                                        <CheckCircle2 className="w-3 h-3" /> Skan podpisany
                                                    </span>
                                                )}
                                            </p>
                                            {contract.client_note && (
                                                <div className="mt-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                                                    <p className="text-[9px] text-amber-500 uppercase font-black tracking-widest mb-0.5">💬 Notatka klienta</p>
                                                    <p className="text-xs text-zinc-300">{contract.client_note}</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {/* View contract link */}
                                            <a
                                                href={`/strefa-klienta/umowy/${contract.id}`}
                                                target="_blank"
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm border border-zinc-700 transition-all font-semibold"
                                            >
                                                Podgląd
                                            </a>

                                            {/* Save unsigned PDF to S3 */}
                                            <button
                                                onClick={() => handleSaveContractS3(contract.id)}
                                                disabled={savingContractId === contract.id}
                                                className={`p-2 rounded-lg border transition-all ${contract.pdf_url
                                                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 hover:border-zinc-500'
                                                    : 'bg-zinc-900/50 text-gold-500/50 border-zinc-800 hover:border-gold-500/50'
                                                    }`}
                                                title={contract.pdf_url ? "Zaktualizuj PDF w S3" : "Zapisz PDF w S3"}
                                            >
                                                {savingContractId === contract.id
                                                    ? <RefreshCw className="w-5 h-5 animate-spin" />
                                                    : <Cloud className="w-5 h-5" />}
                                            </button>

                                            {/* Upload custom PDF */}
                                            <button
                                                onClick={() => {
                                                    setPendingUploadId({ type: 'contract', id: contract.id });
                                                    contractPdfInputRef.current?.click();
                                                }}
                                                disabled={uploadingContractPdf === contract.id}
                                                className="p-2 rounded-lg border transition-all bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 hover:text-amber-400 border-amber-900/30 hover:border-amber-700"
                                                title="Wgraj własny PDF umowy"
                                            >
                                                {uploadingContractPdf === contract.id
                                                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                    : <Upload className="w-5 h-5" />}
                                            </button>

                                            {/* Notify client about contract */}
                                            <button
                                                onClick={() => handleNotifyClient('contract', contract.id)}
                                                disabled={notifyingContract === contract.id}
                                                className="p-2 rounded-lg border transition-all bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 hover:text-blue-300 border-blue-900/30 hover:border-blue-700"
                                                title="Wyślij e-mail do klienta o umowie"
                                            >
                                                {notifyingContract === contract.id
                                                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                    : <Mail className="w-5 h-5" />}
                                            </button>

                                            {/* Download unsigned contract PDF */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const token = localStorage.getItem('admin_token');
                                                    const isPdfReady = contract.pdf_url || contract.status === 'signed' || contract.status === 'SIGNED';
                                                    if (!isPdfReady) {
                                                        toast.error('PDF nie został jeszcze wygenerowany. Użyj przycisku obok (chmura), aby zapisać umowę w S3.');
                                                        return;
                                                    }
                                                    window.open(`/api/contracts/${contract.id}/pdf?token=${token}`, '_blank');
                                                }}
                                                className={`p-2 rounded-lg border transition-all ${contract.pdf_url || contract.status === 'signed' || contract.status === 'SIGNED'
                                                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700 hover:border-zinc-500'
                                                    : 'bg-zinc-900/50 text-zinc-600 border-zinc-800 cursor-not-allowed'
                                                    }`}
                                                title={contract.pdf_url || contract.status === 'signed' || contract.status === 'SIGNED' ? "Pobierz umowę (bez podpisu)" : "PDF niedostępny (wymaga generowania)"}
                                            >
                                                <FileText className="w-5 h-5" />
                                            </button>

                                            {/* Download signed contract PDF (electronic signature confirmation) */}
                                            {(contract.status === 'signed' || contract.status === 'SIGNED') && contract.pdf_url && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        const signedPdfUrl = contract.pdf_url.replace(/\.pdf$/, '_podpisana.pdf');
                                                        window.open(signedPdfUrl, '_blank');
                                                    }}
                                                    className="p-2 rounded-lg border bg-green-900/20 hover:bg-green-900/40 text-green-500 hover:text-green-400 border-green-900/30 hover:border-green-700 transition-all"
                                                    title="Pobierz umowę z potwierdzeniem podpisu elektronicznego"
                                                >
                                                    <FileText className="w-5 h-5" />
                                                </button>
                                            )}

                                            {/* Download client-uploaded signed scan */}
                                            {contract.signed_pdf_url && (
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        window.open(contract.signed_pdf_url, '_blank');
                                                    }}
                                                    className="p-2 rounded-lg border bg-emerald-900/20 hover:bg-emerald-900/40 text-emerald-400 hover:text-emerald-300 border-emerald-900/30 hover:border-emerald-700 transition-all"
                                                    title="Pobierz skan podpisanej umowy (wgrane przez klienta)"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            )}

                                            {/* Delete contract */}
                                            <button
                                                onClick={() => {
                                                    if (confirmingContractDelete === contract.id) {
                                                        handleDeleteContract(contract.id);
                                                    } else {
                                                        setConfirmingContractDelete(contract.id);
                                                        setTimeout(() => setConfirmingContractDelete(null), 3000);
                                                    }
                                                }}
                                                disabled={deletingContractId === contract.id}
                                                className={`p-2 rounded-lg transition-colors border disabled:opacity-50 flex items-center justify-center min-w-[36px] ${confirmingContractDelete === contract.id ? 'bg-red-600 text-white border-red-500' : 'bg-red-900/10 hover:bg-red-900 text-red-500 hover:text-white border-red-900/20 hover:border-red-700'}`}
                                                title={confirmingContractDelete === contract.id ? "Potwierdź usunięcie" : "Usuń umowę"}
                                            >
                                                {deletingContractId === contract.id
                                                    ? <RefreshCw className="w-4 h-4 animate-spin" />
                                                    : confirmingContractDelete === contract.id ? <span className="text-[10px] font-bold">USUŃ</span> : <Trash2 className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>
                                ))

                            ) : (
                                <div className="py-20 text-center text-zinc-500 bg-zinc-900 rounded-xl border border-zinc-800 border-dashed">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg font-medium">Brak umów</p>
                                    <p className="text-sm text-zinc-400 mt-2">Utwórz nową umowę dla tego klienta.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* SETTINGS TAB */}
                {activeTab === 'settings' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6">Edycja Danych Klienta</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-xs text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Imię i Nazwisko</label>
                                    <input
                                        value={editForm.name}
                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Email</label>
                                    <input
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Telefon</label>
                                    <input
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 space-y-6">
                            <h2 className="text-xl font-bold text-white mb-6">Adres Korespondencyjny</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Ulica i numer</label>
                                    <input
                                        value={editForm.address}
                                        onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Kod Pocztowy</label>
                                        <input
                                            value={editForm.postal_code}
                                            onChange={e => setEditForm({ ...editForm, postal_code: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-zinc-500 block mb-2 font-bold uppercase tracking-wider">Miasto</label>
                                        <input
                                            value={editForm.city}
                                            onChange={e => setEditForm({ ...editForm, city: e.target.value })}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white outline-none focus:border-gold-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DANGER ZONE */}
                        <div className="bg-red-900/10 p-8 rounded-xl border border-red-900/20 space-y-6">
                            <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6" /> Strefa Zagrożenia
                            </h2>
                            <p className="text-sm text-zinc-500">Te akcje są nieodwracalne i mają wpływ na dostęp klienta do jego danych.</p>

                            <div className="space-y-4 pt-4">
                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-white text-sm">Anonimizuj Klienta (RODO)</p>
                                        <p className="text-xs text-zinc-500 mt-1">Zamienia dane na losowe ciągi znaków. Konto pozostaje w bazie, ale staje się nieaktywne.</p>
                                    </div>
                                    <button
                                        onClick={() => handleAnonymizeClient(false)}
                                        className="px-4 py-2 border border-orange-900/50 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                        Anonimizuj
                                    </button>
                                </div>

                                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-red-500 text-sm">Usuń Całkowicie (Hard Delete)</p>
                                        <p className="text-xs text-zinc-500 mt-1">Całkowicie usuwa rekord użytkownika i powiązane rezerwacje z bazy danych.</p>
                                    </div>
                                    <button
                                        onClick={() => handleAnonymizeClient(true)}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all"
                                    >
                                        Usuń na zawsze
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ACTIVITY TAB */}
                {activeTab === 'activity' && (
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-gold-500" /> Aktywność Klienta w CRM
                                </h2>
                                <p className="text-zinc-500 text-sm mt-1">
                                    Co klient robił: przeglądanie ofert, podpisywanie umów, pobieranie PDF, notatki, błędy.
                                    {activitiesTotal > 0 && <span className="ml-2 text-zinc-400">({activitiesTotal} zdarzeń)</span>}
                                </p>
                            </div>
                            <button
                                onClick={loadActivities}
                                disabled={activitiesLoading}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${activitiesLoading ? 'animate-spin' : ''}`} /> Odśwież
                            </button>
                        </div>

                        {activitiesLoading && activities.length === 0 ? (
                            <div className="flex items-center justify-center py-20 text-zinc-500">
                                <RefreshCw className="w-6 h-6 animate-spin mr-3" /> Ładowanie aktywności...
                            </div>
                        ) : activities.length === 0 ? (
                            <div className="text-center py-20 text-zinc-600">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p className="text-lg font-medium">Brak zarejestrowanej aktywności</p>
                                <p className="text-sm mt-1">Aktywność klienta pojawi się tutaj po jego pierwszej interakcji z portalem.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {activities.map((act: any, idx: number) => {
                                    const actionConfig: Record<string, { icon: any; color: string; label: string }> = {
                                        offer_viewed: { icon: Eye, color: 'text-blue-400', label: 'Przeglądał ofertę' },
                                        offer_accepted: { icon: CheckCircle2, color: 'text-green-400', label: 'Zaakceptował ofertę' },
                                        offer_rejected: { icon: AlertTriangle, color: 'text-red-400', label: 'Odrzucił ofertę' },
                                        offer_negotiate: { icon: MessageSquare, color: 'text-amber-400', label: 'Negocjacja oferty' },
                                        offer_selection_changed: { icon: Package, color: 'text-purple-400', label: 'Zmienił wybór w ofercie' },
                                        offer_pdf_downloaded: { icon: Download, color: 'text-cyan-400', label: 'Pobrał PDF oferty' },
                                        contract_viewed: { icon: Eye, color: 'text-blue-400', label: 'Przeglądał umowę' },
                                        contract_signed: { icon: PenTool, color: 'text-green-400', label: 'Podpisał umowę' },
                                        contract_scan_uploaded: { icon: FileUp, color: 'text-emerald-400', label: 'Wgrał skan umowy' },
                                        contract_note_added: { icon: MessageSquare, color: 'text-yellow-400', label: 'Dodał notatkę' },
                                        contract_pdf_downloaded: { icon: Download, color: 'text-cyan-400', label: 'Pobrał PDF umowy' },
                                        login: { icon: User, color: 'text-zinc-400', label: 'Zalogował się' },
                                        error: { icon: AlertTriangle, color: 'text-red-500', label: 'Wystąpił błąd' },
                                    };

                                    const cfg = actionConfig[act.action] || { icon: Activity, color: 'text-zinc-500', label: act.action };
                                    const IconComponent = cfg.icon;
                                    const time = new Date(act.created_at);
                                    const timeStr = time.toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
                                    const details = act.details;

                                    return (
                                        <div key={act.id} className="flex items-start gap-4 p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-xl hover:bg-zinc-800/50 transition-colors">
                                            <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center ${cfg.color}`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`font-medium text-sm ${cfg.color}`}>{cfg.label}</span>
                                                    {act.entity_type && act.entity_id && (
                                                        <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded">
                                                            {act.entity_type === 'offer' ? 'Oferta' : act.entity_type === 'contract' ? 'Umowa' : act.entity_type} #{act.entity_id}
                                                        </span>
                                                    )}
                                                </div>
                                                {details && (
                                                    <div className="mt-1 text-xs text-zinc-500 space-x-3">
                                                        {details.title && <span>„{details.title}"</span>}
                                                        {details.contract_number && <span>Nr: {details.contract_number}</span>}
                                                        {details.status && <span>Status: {details.status}</span>}
                                                        {details.message && <span className="italic">„{details.message}"</span>}
                                                        {details.note_length > 0 && <span>{details.note_length} znaków</span>}
                                                        {details.file_type && <span>{details.file_type}</span>}
                                                        {details.file_size && <span>{(details.file_size / 1024).toFixed(0)} KB</span>}
                                                    </div>
                                                )}
                                                {act.ip_address && (
                                                    <p className="mt-1 text-[10px] text-zinc-700 font-mono">{act.ip_address}</p>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                <p className="text-xs text-zinc-500 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {timeStr}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* PERMISSIONS TAB */}
                {activeTab === 'permissions' && (
                    <div className="max-w-lg">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2"><Lock className="w-6 h-6 text-gold-500" /> Dostęp Klienta do Portalu</h2>
                            <p className="text-zinc-500 text-sm">Włącz lub wyłącz dostęp do poszczególnych sekcji portalu klienta. Wyłączone sekcje nie będą widoczne jako zakładki dla klienta.</p>
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl divide-y divide-zinc-800 mb-6">
                            {[
                                { key: 'galleries', label: 'Galerie i Zdjęcia', desc: 'Dostęp do galerii i wyzwań fotograficznych' },
                                { key: 'offers', label: 'Oferty', desc: 'Przeglądanie i akceptowanie ofert' },
                                { key: 'contracts', label: 'Umowy', desc: 'Podgląd i podpisywanie umów' },
                                { key: 'bookings', label: 'Rezerwacje', desc: 'Historia rezerwacji i terminów sesji' },
                                { key: 'gift_cards', label: 'Karty Podarunkowe', desc: 'Portfel kart podarunkowych' },
                            ].map(({ key, label, desc }) => (
                                <div key={key} className="flex items-center justify-between p-5">
                                    <div>
                                        <p className="font-medium text-white">{label}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">{desc}</p>
                                    </div>
                                    <button
                                        onClick={() => setPermissions(prev => ({ ...prev, [key]: !prev[key] }))}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${permissions[key] !== false ? 'bg-gold-500' : 'bg-zinc-700'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${permissions[key] !== false ? 'translate-x-6' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleSavePermissions}
                            disabled={isSavingPerms}
                            className="flex items-center gap-2 px-6 py-3 bg-gold-600 hover:bg-gold-500 disabled:bg-zinc-700 text-black font-bold rounded-xl transition-all"
                        >
                            {isSavingPerms ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                            Zapisz uprawnienia
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
}

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-950 text-white p-8">Ładowanie...</div>}>
            <ClientDetailsContent id={resolvedParams.id} />
        </Suspense>
    );
}
