'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Printer, Eye, Save, Plus, Trash2, ArrowRight, ChevronLeft, ChevronRight,
    Share2, Cloud, Mail, FileCheck, X, Check, ExternalLink, Settings, Image as ImageIcon, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';


// Types for our Offer Data
interface OfferData {
    title: string;
    subtitle: string;
    contactName: string;
    contactLocation: string;
    contactPhone: string;
    contactEmail: string;
    contactZip: string;
    contactAddress: string;

    eventLocation: string;
    eventDate: string;
    eventCount: string;
    eventTeam: string;

    preparations: {
        before: string;
        dayOf: string;
    };

    features: string[];

    // Dynamic Table Data
    pricingHeaders: string[]; // Array of column headers
    recommendationLabel: string; // e.g. "Rekomendowany"
    recommendationColumnIndex: number; // 0-based index of recommended column

    pricingRows: {
        values: string[]; // Array of values matching headers length
        isHeader?: boolean; // bold row?
    }[];

    footerPrices: string[]; // Array of prices matching headers length

    albumDescription: string;

    deliveryTerms: {
        t1: string;
        t2: string;
        t3: string;
    };

    footerCompany: string;

    // New editable fields
    sectionTitles: {
        preparations: string;
        standards: string;
        delivery: string;
    };

    labels: {
        location: string;
        date: string;
        count: string;
        team: string;
        prepBefore: string;
        prepDay: string;
        albumAdvantage: string;
        footerDisclaimer: string;
    };

    sectionVisibility: {
        eventInfo: boolean;
        preparations: boolean;
        features: boolean;
        pricing: boolean;
        album: boolean;
        delivery: boolean;
    };
    negotiation_enabled?: boolean; // New field
    category?: string; // New field
}

const INITIAL_DATA: OfferData = {
    title: "Oferta Pierwsza Komunia Święta - Toruń",
    subtitle: "Pierwsza Komunia Święta 2026",
    contactName: "Przemysław Właśniewski",
    contactLocation: "Toruń",
    contactPhone: "530788694",
    contactEmail: "pwlasniewski@gmail.com / www.wlasniewski.pl",
    contactZip: "87-100",
    contactAddress: "ul. Szeroka 1",

    eventLocation: "Parafia w Toruniu",
    eventDate: "30 maja 2026 r.",
    eventCount: "ok. 60 osób",
    eventTeam: "2 zawodowych fotografów",

    preparations: {
        before: "Osobista konsultacja z księdzem proboszczem w celu omówienia przebiegu liturgii...",
        dayOf: "Jesteśmy na miejscu 60 minut przed mszą. Dokumentujemy przygotowania..."
    },

    features: [
        "Bezpieczeństwo Techniczne: Każdy z dwóch fotografów pracuje na dwóch kartach...",
        "Uprawnienia Kurialne: Posiadamy oficjalne licencje...",
        "Prywatna Galeria Online: Rodzice otrzymują dostęp..."
    ],

    pricingHeaders: [
        "ELEMENTY OFERTY",
        "PAKIET KLASYCZNY",
        "ALBUMOWY STANDARD",
        "PAKIET EXTRA"
    ],

    recommendationLabel: "Rekomendowany",
    recommendationColumnIndex: 2, // "ALBUMOWY STANDARD" is index 2

    pricingRows: [
        { values: ["Reportaż (2 fotografów)", "TAK", "TAK", "TAK"] },
        { values: ["Galeria online", "TAK", "TAK", "TAK"] },
        { values: ["Odbitki Premium 15x23", "5 sztuk", "—", "—"] },
        { values: ["Luksusowy Fotoalbum", "—", "10 ROZKŁADÓWEK", "20 ROZKŁADÓWEK"], isHeader: true },
        { values: ["Indywidualna Sesja", "—", "—", "Studio lub Plener"], isHeader: true },
    ],

    footerPrices: [
        "Inwestycja (za dziecko)",
        "139 zł",
        "209 zł",
        "890 zł"
    ],

    albumDescription: "Nasze albumy to profesjonalne księgi z grubymi, sztywnymi kartami...",

    deliveryTerms: {
        t1: "14 dni roboczych: Czas na udostępnienie galerii...",
        t2: "40 dni: Czas na dostarczenie gotowych albumów...",
        t3: "Brak ukrytych kosztów: Podane ceny są kwotami brutto..."
    },

    footerCompany: "FOTO-DRON Przemysław Właśniewski NIP: 8781430365 • Toruń 2026",

    sectionTitles: {
        preparations: "Proces Przygotowań i Realizacji",
        standards: "Kluczowe Standardy Współpracy",
        delivery: "Dostarczenie Pamiątek"
    },

    labels: {
        location: "Lokalizacja",
        date: "Data",
        count: "Liczba dzieci",
        team: "Zespół",
        prepBefore: "Przed uroczystością",
        prepDay: "W dniu Komunii",
        albumAdvantage: "Zaleta Pamiątek Albumowych",
        footerDisclaimer: "Ogólne warunki współpracy",
    },

    sectionVisibility: {
        eventInfo: true,
        preparations: true,
        features: true,
        pricing: true,
        album: true,
        delivery: true
    },
    negotiation_enabled: true,
    category: 'standard'
};

interface OfferBuilderProps {
    offerId?: number; // Added for edit mode
    initialData?: Partial<OfferData>;
    onSave?: (data: OfferData) => Promise<void>;
    saveButtonText?: string;
    offerStatus?: string;
}

export default function OfferBuilder({ offerId, initialData, onSave, saveButtonText, offerStatus }: OfferBuilderProps = {}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const clientId = searchParams.get('client_id');
    const clientEmailParam = searchParams.get('clientEmail');
    const type = searchParams.get('type')?.toLowerCase() || 'b2c';

    const [data, setData] = useState<OfferData>({
        ...INITIAL_DATA,
        contactZip: '',
        contactAddress: '',
        contactEmail: clientEmailParam || '', // Pre-fill email from URL immediately
        ...initialData
    });
    const componentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedId, setLastSavedId] = useState<number | null>(offerId || null);

    // Auto-fill client data if clientId is present
    useEffect(() => {
        if (clientId) {
            fetchClientData(clientId);
        }
    }, [clientId]);

    const fetchClientData = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.client) {
                    const client = json.client;
                    setData(prev => ({
                        ...prev,
                        // User model has single 'name' field, not firstName/lastName
                        contactName: client.name || '',
                        contactEmail: client.email || '',
                        contactPhone: client.phone || '',
                        contactLocation: client.city || prev.contactLocation,
                        // User model uses snake_case: postal_code, not postalCode
                        contactZip: client.postal_code || '',
                        contactAddress: client.address || '',
                    }));
                }
            }
        } catch (error) {
            console.error('Error auto-filling client data:', error);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Oferta_${data.title.replace(/ /g, '_')}`,
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const url = lastSavedId ? `/api/admin/offers/${lastSavedId}` : '/api/admin/offers';
            const method = lastSavedId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: data.title,
                    slug: lastSavedId ? undefined : `offer-${Date.now()}`,
                    type: type,
                    client_id: clientId ? parseInt(clientId) : undefined,
                    client_email: data.contactEmail, // Sync email to top level
                    negotiation_enabled: data.negotiation_enabled,
                    category: data.category,
                    template_data: data // Wrap the A4 builder state
                })
            });
            const result = await res.json();
            if (res.ok) {
                setLastSavedId(result.offer.id);
                if (onSave) await onSave(data);
                // Redirect back to Client CRM if clientId exists
                if (clientId) {
                    toast.success('Oferta zapisana! Powrót do klienta...');
                    setTimeout(() => {
                        window.location.href = `/admin/clients/${clientId}?tab=offers`;
                    }, 1000);
                } else {
                    const publicLink = `${window.location.origin}/konto`;
                    alert(`Oferta zapisana pomyślnie!\n\nKlient może zobaczyć ofertę po zalogowaniu do:\n${publicLink}`);
                }
            }
        } catch (error) {
            alert('Błąd podczas zapisywania oferty');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (lastSavedId && clientId) {
            window.location.href = `/admin/clients/${clientId}?tab=offers`;
            return;
        }
        if (lastSavedId) {
            router.push('/admin/clients');
            return;
        }
        if (confirm('Czy na pewno chcesz anulować? Wszystkie niezapisane zmiany zostaną utracone.')) {
            if (clientId) {
                window.location.href = `/admin/clients/${clientId}?tab=offers`;
            } else {
                router.back();
            }
        }
    };

    const handleAction = async (action: 's3' | 'drive' | 'email' | 'all') => {
        if (!lastSavedId) {
            alert('Najpierw zapisz ofertę!');
            return;
        }
        const token = localStorage.getItem('admin_token');
        const endpoint = `/api/admin/offers/${lastSavedId}/${action === 'all' ? 'send-all' : `${action === 'email' ? 'send-email' : `save-${action}`}`}`;

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const result = await res.json();
                let message = `Akcja ${action.toUpperCase()} wykonana pomyślnie!`;
                if (action === 's3' && result.pdfUrl) message += `\nPlik PDF: ${result.pdfUrl}`;
                if (action === 'drive' && result.driveUrl) message += `\nLink Drive: ${result.driveUrl}`;
                alert(message);
            } else {
                const err = await res.json();
                alert(`Błąd: ${err.error || action}`);
            }
        } catch (error) {
            alert('Błąd połączenia');
        }
    };

    const handleDelete = async () => {
        if (!lastSavedId) return;
        if (!confirm('Czy na pewno chcesz USUNĄĆ tę ofertę? Ta operacja jest nieodwracalna.')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers/${lastSavedId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('Oferta została usunięta.');
                if (clientId) {
                    window.location.href = `/admin/clients/${clientId}?tab=offers`;
                } else {
                    router.push('/admin/clients');
                }
            } else {
                toast.error('Błąd podczas usuwania oferty.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Błąd serwera.');
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!lastSavedId) {
            alert('Najpierw zapisz ofertę!');
            return;
        }
        setIsSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers/${lastSavedId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                toast.success(`Status zmieniony`);
                if (newStatus === 'pending') {
                    // Wyślij powiadomienie
                    await fetch(`/api/admin/offers/${lastSavedId}/send-email`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    toast.success('Powiadomienie email wysłane do klienta.');
                }
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error('Błąd zmiany statusu');
            }
        } catch (error) {
            toast.error('Błąd serwera');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to update fields
    const update = (field: keyof OfferData, value: any) => {
        setData(prev => ({ ...prev, [field]: value }));
    };

    const updateNested = (parent: keyof OfferData, key: string, value: any) => {
        setData(prev => ({
            ...prev,
            [parent]: {
                ...(prev[parent] as any),
                [key]: value
            }
        }));
    };

    // --- Dynamic Table Actions ---

    const addColumn = () => {
        setData(prev => ({
            ...prev,
            pricingHeaders: [...prev.pricingHeaders, "Nowa Kolumna"],
            pricingRows: prev.pricingRows.map(row => ({
                ...row,
                values: [...row.values, "-"]
            })),
            footerPrices: [...prev.footerPrices, "0 zł"]
        }));
    };

    const removeColumn = (index: number) => {
        if (data.pricingHeaders.length <= 1) return; // Prevent removing last column
        if (index === 0) return; // Prevent removing first column (labels)

        setData(prev => ({
            ...prev,
            pricingHeaders: prev.pricingHeaders.filter((_, i) => i !== index),
            pricingRows: prev.pricingRows.map(row => ({
                ...row,
                values: row.values.filter((_, i) => i !== index)
            })),
            footerPrices: prev.footerPrices.filter((_, i) => i !== index),
            recommendationColumnIndex: prev.recommendationColumnIndex === index
                ? -1 // Removed column was recommended
                : prev.recommendationColumnIndex > index
                    ? prev.recommendationColumnIndex - 1
                    : prev.recommendationColumnIndex
        }));
    };

    const addRow = () => {
        setData(prev => ({
            ...prev,
            pricingRows: [...prev.pricingRows, { values: new Array(prev.pricingHeaders.length).fill("-") }]
        }));
    };

    const removeRow = (index: number) => {
        setData(prev => ({
            ...prev,
            pricingRows: prev.pricingRows.filter((_, i) => i !== index)
        }));
    };

    const toggleRowHeader = (index: number) => {
        setData(prev => {
            const newRows = [...prev.pricingRows];
            newRows[index].isHeader = !newRows[index].isHeader;
            return { ...prev, pricingRows: newRows };
        });
    };

    const setRecommendedColumn = (index: number) => {
        update('recommendationColumnIndex', index);
    };

    // --- Column Reordering ---
    const moveColumn = (index: number, direction: 'left' | 'right') => {
        if (direction === 'left' && index === 0) return; // Can't move left if first (skipping label col 0? usually headers[0] is labels)
        // Actually, pricingHeaders[0] is usually "ELEMENTY OFERTY" (the label column). moving that might be bad.
        // Let's assume index 0 works like any other column, OR restrict it.
        // The user said: "nagłówek 1, na miejsce nagłówka 2". If header 1 is the labels column, they probably don't want to move it.
        // But if they mean the first *price* column (index 1), then yes.
        // Let's allow moving indices 1..N. Index 0 is typically the row labels.

        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 1 || newIndex >= data.pricingHeaders.length) return; // Keep index 0 fixed

        setData(prev => {
            const newHeaders = [...prev.pricingHeaders];
            const newFooterPrices = [...prev.footerPrices];
            const newRows = prev.pricingRows.map(r => ({ ...r, values: [...r.values] }));

            // Swap Headers
            [newHeaders[index], newHeaders[newIndex]] = [newHeaders[newIndex], newHeaders[index]];

            // Swap Footer Prices
            [newFooterPrices[index], newFooterPrices[newIndex]] = [newFooterPrices[newIndex], newFooterPrices[index]];

            // Swap Row Values
            newRows.forEach(row => {
                [row.values[index], row.values[newIndex]] = [row.values[newIndex], row.values[index]];
            });

            // Adjust Recommendation Index
            let newRecIndex = prev.recommendationColumnIndex;
            if (prev.recommendationColumnIndex === index) newRecIndex = newIndex;
            else if (prev.recommendationColumnIndex === newIndex) newRecIndex = index;

            return {
                ...prev,
                pricingHeaders: newHeaders,
                footerPrices: newFooterPrices,
                pricingRows: newRows,
                recommendationColumnIndex: newRecIndex
            };
        });
    };

    const isB2B = type === 'b2b';
    const mainColor = isB2B ? '#3b82f6' : '#c5a059'; // Blue for B2B, Gold for B2C

    return (
        <div className={`flex flex-col lg:flex-row h-screen overflow-hidden ${isB2B ? 'bg-zinc-950 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* LEFT: EDITOR */}
            <div className={`w-full lg:w-7/12 border-r overflow-y-auto p-6 shadow-xl z-10 ${isB2B ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-wrap items-center justify-between mb-6 border-b pb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h2 className={`text-xl font-bold ${isB2B ? 'text-white' : 'text-gray-900'}`}>Kreator Ofert</h2>
                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${isB2B ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-[#c5a059]/10 text-[#c5a059] border-[#c5a059]/20'}`}>
                                TRYB {type.toUpperCase()}
                            </span>
                        </div>
                        {offerStatus && (
                            <div className={`px-3 py-1 text-xs font-bold uppercase rounded-full border ${offerStatus === 'accepted' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                offerStatus === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    offerStatus === 'pending' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                }`}>
                                {offerStatus === 'draft' ? 'Szkic' :
                                    offerStatus === 'pending' ? 'Oczekuje na klienta' :
                                        offerStatus === 'accepted' ? 'Zaakceptowana' :
                                            offerStatus === 'rejected' ? 'Odrzucona' : offerStatus}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="flex items-center justify-center gap-2 bg-zinc-200 text-zinc-700 hover:bg-zinc-300 px-4 py-2 rounded shadow transition font-bold whitespace-nowrap"
                        >
                            <X size={18} /> {lastSavedId ? 'Zamknij' : 'Anuluj'}
                        </button>
                        {lastSavedId && (
                            <button
                                onClick={() => router.push(clientId ? `/admin/clients/${clientId}` : '/admin/clients')}
                                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition font-bold whitespace-nowrap"
                            >
                                <Check size={18} /> Zakończ
                            </button>
                        )}

                        {lastSavedId && (
                            <button
                                onClick={handleDelete}
                                className="flex items-center justify-center gap-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-3 py-2 rounded shadow transition font-bold border border-red-500/20 whitespace-nowrap"
                                title="Usuń ofertę"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}

                        <label className="flex items-center justify-center gap-2 cursor-pointer bg-zinc-200 dark:bg-zinc-800 px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition whitespace-nowrap" title="Włącz/Wyłącz negocjacje">
                            <input
                                type="checkbox"
                                checked={data.negotiation_enabled ?? true}
                                onChange={e => update('negotiation_enabled', e.target.checked)}
                                className="w-4 h-4 accent-green-500"
                            />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Negocjacje</span>
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition disabled:opacity-50 font-bold"
                        >
                            <Save size={18} /> {isSaving ? 'Zapisywanie...' : lastSavedId ? 'Aktualizuj' : 'Zapisz'}
                        </button>

                        {/* Dynamic status buttons */}
                        {lastSavedId && offerStatus === 'draft' && (
                            <button
                                onClick={() => handleUpdateStatus('pending')}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition disabled:opacity-50 font-bold"
                            >
                                <Share2 size={18} /> Wyślij do zatwierdzenia
                            </button>
                        )}
                        {lastSavedId && (offerStatus === 'rejected' || offerStatus === 'accepted') && (
                            <button
                                onClick={() => handleUpdateStatus('pending')}
                                disabled={isSaving}
                                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded shadow hover:bg-orange-700 transition disabled:opacity-50 font-bold"
                            >
                                <Share2 size={18} /> Wyślij ponownie
                            </button>
                        )}

                        {lastSavedId && (
                            <a
                                href={`/strefa-klienta/oferty/${lastSavedId}`}
                                target="_blank"
                                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded shadow hover:bg-purple-700 transition font-bold"
                            >
                                <ExternalLink size={18} /> Podgląd
                            </a>
                        )}
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-zinc-700 text-white px-4 py-2 rounded shadow hover:bg-zinc-600 transition font-bold"
                        >
                            <Printer size={18} /> Drukuj
                        </button>
                    </div>
                </div>

                {/* Storage Actions (Persistent once saved) */}
                {lastSavedId && (
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-6 flex flex-wrap gap-2 justify-center shadow-inner">
                        <button onClick={() => handleAction('s3')} className="flex items-center gap-1.5 bg-blue-600/10 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-600/20 transition">
                            <Cloud size={14} /> S3
                        </button>
                        <button onClick={() => handleAction('drive')} className="flex items-center gap-1.5 bg-green-600/10 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600/20 transition">
                            <Share2 size={14} /> Drive
                        </button>
                        <button onClick={() => handleAction('email')} className="flex items-center gap-1.5 bg-purple-600/10 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-purple-600/20 transition">
                            <Mail size={14} /> Email
                        </button>
                        <button onClick={() => handleAction('all')} className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700 transition shadow-lg">
                            <FileCheck size={14} /> Wyślij Wszystko
                        </button>
                    </div>
                )}

                {/* Explicit Admin Context Banner */}
                {lastSavedId && offerStatus === 'draft' && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                        <span className="text-amber-500 mt-0.5">⚠️</span>
                        <div>
                            <p className="text-amber-500 font-bold text-sm mb-1">Status: Szkic (Tylko do odczytu dla klienta)</p>
                            <p className="text-amber-400/80 text-xs">Klient widzi tę ofertę pod linkiem, ale <b>nie ma możliwości</b> jej akceptacji, odrzucenia ani negocjacji. Użyj przycisku <span className="text-white">„Wyślij do zatwierdzenia”</span>, aby odblokować te opcje dla klienta.</p>
                        </div>
                    </div>
                )}
                {lastSavedId && offerStatus === 'pending' && (
                    <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
                        <span className="text-blue-400 mt-0.5">📨</span>
                        <div>
                            <p className="text-blue-400 font-bold text-sm mb-1">Status: Oczekuje na decyzję</p>
                            <p className="text-blue-300/80 text-xs">Klient ma pełny dostęp do oferty. Może ją przeglądać, akceptować pakiety (odblokowane przyciski), odrzucać lub przesyłać wiadomości w ramach negocjacji.</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* 1. Header & Contact */}
                    <Section title="1. Nagłówek i Kontakt">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kategoria Oferty</label>
                            <select
                                value={data.category || 'standard'}
                                onChange={e => update('category', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-black"
                            >
                                <option value="standard">Standardowa</option>
                                <option value="komunia">Komunia Święta</option>
                                <option value="slub">Ślub</option>
                                <option value="b2b">B2B</option>
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1">Wybierz "Komunia Święta", aby włączyć licznik dzieci.</p>
                        </div>
                        <Input label="Tytuł Główny" value={data.title} onChange={v => update('title', v)} />
                        <Input label="Podtytuł (Accent)" value={data.subtitle} onChange={v => update('subtitle', v)} />
                        <div className="border-t pt-2 mt-2">
                            <Input label="Imię Nazwisko" value={data.contactName} onChange={v => update('contactName', v)} />
                            <Input label="Miasto" value={data.contactLocation} onChange={v => update('contactLocation', v)} />
                            <div className="grid grid-cols-2 gap-2">
                                <Input label="Kod Pocztowy" value={data.contactZip} onChange={v => update('contactZip', v)} />
                                <Input label="Ulica / Adres" value={data.contactAddress} onChange={v => update('contactAddress', v)} />
                            </div>
                            <Input label="Telefon" value={data.contactPhone} onChange={v => update('contactPhone', v)} />
                            <Input label="Email / WWW" value={data.contactEmail} onChange={v => update('contactEmail', v)} />
                        </div>
                    </Section>

                    {/* 2. Event Info */}
                    <Section
                        title="2. Informacje o Wydarzeniu"
                        action={
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Pokaż w PDF</span>
                                <input
                                    type="checkbox"
                                    checked={data.sectionVisibility.eventInfo}
                                    onChange={e => updateNested('sectionVisibility', 'eventInfo', e.target.checked)}
                                    className="accent-gold-500"
                                />
                            </label>
                        }
                    >
                        <div className="grid grid-cols-2 gap-2 text-xs font-bold text-gray-500 mb-1">
                            <span>Etykieta</span>
                            <span>Wartość</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Input label="" value={data.labels.location} onChange={v => updateNested('labels', 'location', v)} />
                            <Input label="" value={data.eventLocation} onChange={v => update('eventLocation', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Input label="" value={data.labels.date} onChange={v => updateNested('labels', 'date', v)} />
                            <Input label="" value={data.eventDate} onChange={v => update('eventDate', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Input label="" value={data.labels.count} onChange={v => updateNested('labels', 'count', v)} />
                            <Input label="" value={data.eventCount} onChange={v => update('eventCount', v)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Input label="" value={data.labels.team} onChange={v => updateNested('labels', 'team', v)} />
                            <Input label="" value={data.eventTeam} onChange={v => update('eventTeam', v)} />
                        </div>
                    </Section>

                    {/* 3. Preparations */}
                    <Section
                        title="3. Proces Przygotowań"
                        action={
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Pokaż w PDF</span>
                                <input
                                    type="checkbox"
                                    checked={data.sectionVisibility.preparations}
                                    onChange={e => updateNested('sectionVisibility', 'preparations', e.target.checked)}
                                    className="accent-gold-500"
                                />
                            </label>
                        }
                    >
                        <Input label="Nagłówek Sekcji" value={data.sectionTitles.preparations} onChange={v => updateNested('sectionTitles', 'preparations', v)} />

                        <div className="border-t pt-2 mt-2 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1"><Input label="Etykieta 1" value={data.labels.prepBefore} onChange={v => updateNested('labels', 'prepBefore', v)} /></div>
                                <div className="col-span-2"><Input label="Opis 1" value={data.preparations.before} onChange={v => updateNested('preparations', 'before', v)} /></div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1"><Input label="Etykieta 2" value={data.labels.prepDay} onChange={v => updateNested('labels', 'prepDay', v)} /></div>
                                <div className="col-span-2"><Input label="Opis 2" value={data.preparations.dayOf} onChange={v => updateNested('preparations', 'dayOf', v)} /></div>
                            </div>
                        </div>
                    </Section>

                    {/* 4. Standards */}
                    <Section
                        title="4. Standardy Współpracy"
                        action={
                            <label className="flex items-center gap-2 cursor-pointer">
                                <span className="text-[10px] text-zinc-500 uppercase font-bold">Pokaż w PDF</span>
                                <input
                                    type="checkbox"
                                    checked={data.sectionVisibility.features}
                                    onChange={e => updateNested('sectionVisibility', 'features', e.target.checked)}
                                    className="accent-gold-500"
                                />
                            </label>
                        }
                    >
                        <Input label="Nagłówek Sekcji" value={data.sectionTitles.standards} onChange={v => updateNested('sectionTitles', 'standards', v)} />
                        <div className="mt-2 space-y-2">
                            {data.features.map((f, i) => (
                                <div key={i} className="flex gap-2 items-start">
                                    <div className="flex-1">
                                        <Input
                                            label={`Punkt ${i + 1}`}
                                            value={f}
                                            onChange={(val) => {
                                                const newFeatures = [...data.features];
                                                newFeatures[i] = val;
                                                update('features', newFeatures);
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newFeatures = data.features.filter((_, idx) => idx !== i);
                                            update('features', newFeatures);
                                        }}
                                        className="mt-6 text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => update('features', [...data.features, "Nowy punkt"])}
                                className="text-blue-600 text-xs font-bold flex items-center gap-1 mt-2"
                            >
                                <Plus size={14} /> Dodaj punkt
                            </button>
                        </div>
                    </Section>

                    {/* 5. Pricing Table (Dynamic) */}
                    <Section title="5. Tabela Cenowa">
                        <div className="mb-2">
                            <Input label="Etykieta Rekomendacji" value={data.recommendationLabel} onChange={v => update('recommendationLabel', v)} />
                        </div>

                        {/* Headers */}
                        <div className="overflow-x-auto pb-2">
                            <div className="min-w-max">
                                <div className="flex gap-2 mb-2">
                                    {data.pricingHeaders.map((header, idx) => (
                                        <div key={idx} className="w-32 flex flex-col gap-1 relative group">
                                            <Input
                                                label={`Nagłówek ${idx + 1}`}
                                                value={header}
                                                onChange={v => {
                                                    const newHeaders = [...data.pricingHeaders];
                                                    newHeaders[idx] = v;
                                                    update('pricingHeaders', newHeaders);
                                                }}
                                            />
                                            <div className="flex justify-between items-center text-xs mt-1">
                                                <div className="flex gap-1">
                                                    {idx > 1 && (
                                                        <button onClick={() => moveColumn(idx, 'left')} className="p-1 hover:bg-gray-200 rounded" title="Przesuń w lewo">
                                                            <ChevronLeft size={12} />
                                                        </button>
                                                    )}
                                                    {idx > 0 && idx < data.pricingHeaders.length - 1 && (
                                                        <button onClick={() => moveColumn(idx, 'right')} className="p-1 hover:bg-gray-200 rounded" title="Przesuń w prawo">
                                                            <ChevronRight size={12} />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <label className="flex items-center gap-1 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="recommend_col"
                                                            checked={data.recommendationColumnIndex === idx}
                                                            onChange={() => setRecommendedColumn(idx)}
                                                        />
                                                        <span className="text-gray-500 text-[10px]">Wyróżn.</span>
                                                    </label>
                                                    {idx > 0 && (
                                                        <button onClick={() => removeColumn(idx)} className="text-red-400 hover:text-red-600">
                                                            <Trash2 size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addColumn}
                                        className="w-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
                                        title="Dodaj kolumnę"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>

                                {/* Rows */}
                                <div className="space-y-2 border-t pt-2">
                                    {data.pricingRows.map((row, rowIdx) => (
                                        <div key={rowIdx} className="flex gap-2 items-center">
                                            {row.values.map((val, colIdx) => (
                                                <div key={colIdx} className="w-32">
                                                    <input
                                                        className={`w-full border border-zinc-700 bg-zinc-950 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-gold-500 ${colIdx === 0 ? 'font-bold' : ''}`}
                                                        value={val}
                                                        onChange={(e) => {
                                                            const newRows = [...data.pricingRows];
                                                            newRows[rowIdx].values[colIdx] = e.target.value;
                                                            update('pricingRows', newRows);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => toggleRowHeader(rowIdx)}
                                                    className={`p-1 rounded ${row.isHeader ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400'}`}
                                                    title="Wyróżnij wiersz (Pogrubienie)"
                                                >
                                                    <ArrowRight size={14} />
                                                </button>
                                                <button
                                                    onClick={() => removeRow(rowIdx)}
                                                    className="p-1 text-red-400 hover:text-red-600"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <button className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1" onClick={addRow}>
                                    <Plus size={14} /> Dodaj wiersz
                                </button>

                                {/* Footer Prices */}
                                <div className="mt-4 flex gap-2 border-t pt-2">
                                    {data.footerPrices.map((price, idx) => (
                                        <div key={idx} className="w-32">
                                            <Input
                                                label={`Cena (Kol ${idx + 1})`}
                                                value={price}
                                                onChange={v => {
                                                    const newPrices = [...data.footerPrices];
                                                    newPrices[idx] = v;
                                                    update('footerPrices', newPrices);
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* 6. Album Description */}
                    <Section title="6. Zaleta Pamiątek Albumowych">
                        <Input label="Nagłówek (Etykieta)" value={data.labels.albumAdvantage} onChange={v => updateNested('labels', 'albumAdvantage', v)} />
                        <Input label="Treść Opisu" value={data.albumDescription} onChange={v => update('albumDescription', v)} />
                    </Section>

                    {/* 7. Delivery */}
                    <Section title="7. Dostarczenie Pamiątek">
                        <Input label="Nagłówek Sekcji" value={data.sectionTitles.delivery} onChange={v => updateNested('sectionTitles', 'delivery', v)} />
                        <div className="mt-2 space-y-2">
                            <Input label="Termin 1" value={data.deliveryTerms.t1} onChange={v => updateNested('deliveryTerms', 't1', v)} />
                            <Input label="Termin 2" value={data.deliveryTerms.t2} onChange={v => updateNested('deliveryTerms', 't2', v)} />
                            <Input label="Termin 3" value={data.deliveryTerms.t3} onChange={v => updateNested('deliveryTerms', 't3', v)} />
                        </div>
                    </Section>

                    {/* 8. Footer */}
                    <Section title="8. Stopka">
                        <Input label="Tekst Prawny (Disclaimer)" value={data.labels.footerDisclaimer} onChange={v => updateNested('labels', 'footerDisclaimer', v)} />
                        <Input label="Firma / NIP" value={data.footerCompany} onChange={v => update('footerCompany', v)} />
                    </Section>
                </div>
            </div>

            {/* RIGHT: PREVIEW (A4) */}
            <div className="w-full lg:w-5/12 bg-gray-500 overflow-hidden relative flex flex-col items-center">
                {/* Preview Toolbar */}
                <div className="absolute top-4 z-20 bg-white rounded shadow-lg p-2 flex items-center gap-4 text-xs font-bold text-gray-700">
                    <span>Podgląd: {Math.round(scale * 100)}%</span>
                    <input
                        type="range"
                        min="0.3"
                        max="1.5"
                        step="0.1"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-24"
                    />
                    <button onClick={() => setScale(0.5)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">Dopasuj (0.5x)</button>
                    <button onClick={() => setScale(1.0)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded">1:1</button>
                    <div className="w-px h-4 bg-gray-300 mx-2" />
                    <span className="text-gray-400 font-normal">Kolumny: {data.pricingHeaders.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto w-full flex justify-center p-8">
                    <div
                        style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
                        className="relative"
                    >
                        <style>{`
                            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;600;700&display=swap');
                            
                            /* PREVIEW STYLES COMPACTED FOR 1 PAGE */
                            .a4-preview {
                                width: 210mm;
                                height: 297mm;
                                padding: 10mm 15mm;
                                background: white;
                                box-shadow: 0 0 20px rgba(0,0,0,0.3);
                                font-family: 'Montserrat', sans-serif;
                                color: #333;
                                line-height: 1.35;
                                box-sizing: border-box;
                                position: relative;
                                overflow: hidden;
                                min-height: 297mm;
                            }

                            .page-limit-line {
                                position: absolute;
                                top: 297mm;
                                left: 0;
                                width: 100%;
                                border-top: 2px dashed red;
                                z-index: 50;
                                pointer-events: none;
                            }
                            .page-limit-label {
                                position: absolute;
                                top: -20px;
                                right: 0;
                                background: red;
                                color: white;
                                font-size: 10px;
                                padding: 2px 5px;
                            }

                            .offer-header { display: flex; justify-content: space-between; border-bottom: 3px solid #c5a059; padding-bottom: 10px; margin-bottom: 12px; }
                            .offer-h1 { font-family: 'Playfair Display', serif; color: #1a1a1a; font-size: 19pt; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                            .offer-accent { color: #c5a059; font-weight: 600; letter-spacing: 1px; font-size: 10pt; }
                            .offer-my-data { font-size: 8pt; color: #7f8c8d; text-align: right; }
                            .offer-my-data b { color: #1a1a1a; font-size: 10pt; display: block; margin-bottom: 2px; }
                            
                            .offer-event-info { background: #f4efe6; padding: 8px; border-radius: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 9pt; margin-bottom: 12px; }
                            
                            .offer-h2 { font-family: 'Playfair Display', serif; font-size: 12pt; color: #1a1a1a; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 12px; margin-bottom: 6px; }
                            
                            .offer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 5px; }
                            .offer-prep-item { font-size: 8.5pt; }
                            .offer-prep-item b { color: #1a1a1a; display: block; margin-bottom: 2px; }

                            .offer-list { list-style: none; padding: 0; margin: 0; }
                            .offer-list li { padding-left: 18px; position: relative; margin-bottom: 3px; font-size: 8.5pt; }
                            .offer-list li::before { content: "✓"; position: absolute; left: 0; color: #c5a059; font-weight: bold; }

                            .offer-table { width: 100%; border-collapse: collapse; margin: 15px 0 12px 0; table-layout: fixed; }
                            .offer-th { background: #f8f8f8; padding: 6px 4px; font-size: 8pt; border: 1px solid #eee; position: relative; vertical-align: bottom; text-align: center; }
                            .offer-th.left { text-align: left; padding-left: 8px; }
                            .offer-th.rec { padding-top: 32px; background: #f4efe6; border: 2px solid #c5a059; }
                            
                            .offer-td { padding: 6px 4px; text-align: center; border: 1px solid #eee; font-size: 8.5pt; vertical-align: middle; }
                            .offer-td.left { text-align: left; padding-left: 8px; }
                            .offer-td.rec { border-left: 2px solid #c5a059; border-right: 2px solid #c5a059; background: #f4efe6; }
                            
                            .rec-label { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: #c5a059; color: white; padding: 2px 8px; font-size: 6.5pt; font-weight: bold; border-radius: 3px; text-transform: uppercase; white-space: nowrap; width: 85%; }
                            
                            .price-tag { font-size: 11pt; font-weight: bold; color: #1a1a1a; display: block; margin-top: 2px; }
                            
                            .desc-box { background: #fff; border: 1px solid #eee; padding: 10px; margin-top: 10px; font-size: 9pt; border-left: 4px solid #c5a059; }
                            
                            .offer-footer { text-align: center; font-size: 7.5pt; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 8px; margin-top: auto; }
                        `}</style>

                        <div ref={componentRef} className="a4-preview">
                            <div className="page-limit-line"><span className="page-limit-label">KONIEC STRONY A4</span></div>

                            <header className="offer-header">
                                <div>
                                    <h1 className="offer-h1">{data.title}</h1>
                                    <div className="offer-accent">{data.subtitle}</div>
                                </div>
                                <div className="offer-my-data">
                                    <b>{data.contactName}</b>
                                    {data.contactLocation}<br />
                                    Tel: {data.contactPhone}<br />
                                    {data.contactEmail}
                                </div>
                            </header>

                            {data.sectionVisibility.eventInfo && (
                                <div className="offer-event-info">
                                    <div><b>{data.labels.location}:</b> {data.eventLocation}</div>
                                    <div><b>{data.labels.date}:</b> {data.eventDate}</div>
                                    <div><b>{data.labels.count}:</b> {data.eventCount}</div>
                                    <div><b>{data.labels.team}:</b> {data.eventTeam}</div>
                                </div>
                            )}

                            {data.sectionVisibility.preparations && (
                                <>
                                    <h2 className="offer-h2">{data.sectionTitles.preparations}</h2>
                                    <div className="offer-grid">
                                        <div className="offer-prep-item">
                                            <b>{data.labels.prepBefore}:</b>
                                            {data.preparations.before}
                                        </div>
                                        <div className="offer-prep-item">
                                            <b>{data.labels.prepDay}:</b>
                                            {data.preparations.dayOf}
                                        </div>
                                    </div>
                                </>
                            )}

                            {data.sectionVisibility.features && (
                                <>
                                    <h2 className="offer-h2">{data.sectionTitles.standards}</h2>
                                    <ul className="offer-list">
                                        {data.features.map((f, i) => (
                                            <li key={i} dangerouslySetInnerHTML={{ __html: f.replace(':', ':</b>').replace(/^/, '<b>') }} />
                                        ))}
                                    </ul>
                                </>
                            )}

                            {data.sectionVisibility.pricing && (
                                <table className="offer-table">
                                    <thead>
                                        <tr>
                                            {data.pricingHeaders.map((header, idx) => {
                                                const isRec = idx === data.recommendationColumnIndex;
                                                return (
                                                    <th
                                                        key={idx}
                                                        className={`offer-th ${idx === 0 ? 'left' : ''} ${isRec ? 'rec' : ''}`}
                                                        style={{ width: `${100 / data.pricingHeaders.length}%` }}
                                                    >
                                                        {isRec && <div className="rec-label">{data.recommendationLabel}</div>}
                                                        {header}
                                                    </th>
                                                );
                                            })}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.pricingRows.map((row, i) => (
                                            <tr key={i}>
                                                {row.values.map((val, colIdx) => {
                                                    const isRec = colIdx === data.recommendationColumnIndex;
                                                    const isHeader = row.isHeader;
                                                    const displayVal = isHeader ? `<b>${val}</b>` : val;
                                                    return (
                                                        <td
                                                            key={colIdx}
                                                            className={`offer-td ${colIdx === 0 ? 'left' : ''} ${isRec ? 'rec' : ''}`}
                                                            dangerouslySetInnerHTML={{ __html: displayVal }}
                                                        />
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        <tr>
                                            {data.footerPrices.map((price, idx) => {
                                                const isRec = idx === data.recommendationColumnIndex;
                                                return (
                                                    <td key={idx} className={`offer-td ${idx === 0 ? 'left' : ''} ${isRec ? 'rec' : ''}`}>
                                                        {idx === 0 ? price : <span className="price-tag">{price}</span>}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            )}

                            {data.sectionVisibility.album && (
                                <div className="desc-box">
                                    <b>{data.labels.albumAdvantage}:</b><br />
                                    {data.albumDescription}
                                </div>
                            )}

                            {data.sectionVisibility.delivery && (
                                <>
                                    <h2 className="offer-h2">{data.sectionTitles.delivery}</h2>
                                    <ul className="offer-list" style={{ marginBottom: '20px' }}>
                                        {Object.values(data.deliveryTerms).map((t, i) => (
                                            <li key={i} dangerouslySetInnerHTML={{ __html: t.replace(':', ':</b>').replace(/^/, '<b>') }} />
                                        ))}
                                    </ul>
                                </>
                            )}

                            <div className="offer-footer" dangerouslySetInnerHTML={{ __html: `${data.labels.footerDisclaimer}<br><b>${data.footerCompany}</b>` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper Components
const Section = ({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) => (
    <div className="bg-zinc-800/20 border border-zinc-700/50 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-widest">{title}</h3>
            {action}
        </div>
        <div className="space-y-3">{children}</div>
    </div>
);

const Input = ({ label, value, onChange, placeholder = "" }: { label: string; value: string | boolean; onChange: (v: string) => void; placeholder?: string }) => (
    <div>
        {label && <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">{label}</label>}
        <input
            type="text"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-gold-500 transition-colors"
        />
    </div>
);
