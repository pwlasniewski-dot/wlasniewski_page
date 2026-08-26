'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Printer, Eye, Save, Plus, Trash2, ArrowRight, ChevronLeft, ChevronRight,
    FileCheck, X, Check, ExternalLink, Settings, Image as ImageIcon, FileText,
    BookCopy, Download
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
    /** Kanoniczna data sesji (YYYY-MM-DD) — synchronizowana z kalendarzem */
    sessionDateIso?: string;
    /** Godzina sesji "HH:MM" — synchronizowana z kalendarzem */
    sessionTime?: string;
    /** Godzina zakonczenia sesji "HH:MM" (opcjonalna) */
    sessionEndTime?: string;
    /** Czas trwania sesji w minutach (opcjonalny) */
    sessionDurationMin?: number;

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
    children_count?: number; // Added
}

const INITIAL_DATA: OfferData = {
    title: "Oferta Pierwsza Komunia Święta - Toruń",
    subtitle: "Pierwsza Komunia Święta 2026",
    contactName: "Przemysław Właśniewski",
    contactLocation: "Płużnica",
    contactPhone: "530788694",
    contactEmail: "pwlasniewski@gmail.com / www.wlasniewski.pl",
    contactZip: "87-214",
    contactAddress: "Płużnica",

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
    category: 'communion'
};

const BIRTHDAY_DATA: OfferData = {
    title: "Oferta Urodzinowa - Toruń",
    subtitle: "Urodziny 2026",
    contactName: "Przemysław Właśniewski",
    contactLocation: "Płużnica",
    contactPhone: "530788694",
    contactEmail: "pwlasniewski@gmail.com / www.wlasniewski.pl",
    contactZip: "87-214",
    contactAddress: "Płużnica",

    eventLocation: "Do uzupełnienia",
    eventDate: new Date().toISOString().split('T')[0],
    eventCount: "Dzieci + dorośli",
    eventTeam: "1 fotograf",

    preparations: {
        before: "Przygotowanie listy kluczowych momentów do uwiecznienia (dmuchanie świeczek, tort, prezenty, zabawy)...",
        dayOf: "Przyjeżdżamy 15 minut przed rozpoczęciem imprezy. Uwieczniamy dekoracje, przygotowania..."
    },

    features: [
        "Profesjonalny Sprzęt: Aparat full-frame z szybkimi obiektywami, idealny do zdjęć w ruchu",
        "Naturalne Ujęcia: Fotografujemy spontaniczne reakcje dzieci, autentyczne emocje",
        "Galeria Online: Rodzice otrzymują dostęp do prywatnej galerii ze wszystkimi zdjęciami"
    ],

    pricingHeaders: [
        "ELEMENTY OFERTY",
        "EKONOMICZNY",
        "FOTO",
        "STANDARD",
        "PREMIUM"
    ],

    recommendationLabel: "Polecany",
    recommendationColumnIndex: 3, // "STANDARD" is recommended

    pricingRows: [
        { values: ["Czas trwania", "4h", "6h", "4h", "6h"] },
        { values: ["Fotograf", "TAK", "TAK", "TAK", "TAK"] },
        { values: ["Galeria online 150-200 zdjęć", "TAK", "TAK", "TAK", "TAK"] },
        { values: ["Filmik video HD", "—", "—", "do 10 min", "do 15 min"], isHeader: true },
        { values: ["Sesja zdjęciowa (dziecko)", "—", "TAK", "—", "TAK"], isHeader: true },
        { values: ["Odbitki 15x23", "50 szt", "50 szt", "50 szt", "50 szt"] },
    ],

    footerPrices: [
        "Cena",
        "870 zł",
        "1190 zł",
        "1350 zł",
        "1700 zł"
    ],

    albumDescription: "Możliwość zamówienia fotoalbuму premium z imprezowego reportażu (dostępne po sesji, cena do uzgodnienia).",

    deliveryTerms: {
        t1: "7 dni roboczych: Udostępnienie galerii online z wszystkimi zdjęciami",
        t2: "14 dni: Dostarczenie wydruków premium (jeśli wybrane w pakiecie)",
        t3: "Dojazd: Pierwszy 10km gratis, każdy dalszy 1.5zł/km. Podane ceny są kwotami brutto."
    },

    footerCompany: "FOTO-DRON Przemysław Właśniewski NIP: 8781430365 • Płużnica 2026",

    sectionTitles: {
        preparations: "Proces Realizacji Imprezy",
        standards: "Standardy Pracy",
        delivery: "Dostarczenie Materiałów"
    },

    labels: {
        location: "Miejsce imprezy",
        date: "Data urodzin",
        count: "Liczba gości",
        team: "Skład ekipy",
        prepBefore: "Przygotowania",
        prepDay: "W trakcie imprezy",
        albumAdvantage: "Dodatkowe opcje",
        footerDisclaimer: "Warunki współpracy",
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
    category: 'birthday'
};

const FAMILY_OLA_GRUDZIADZ_DATA: OfferData = {
    title: "Sesja rodzinna - Pani Ola (Grudziądz)",
    subtitle: "Rodzinna sesja plenerowa 2026",
    contactName: "Przemysław Właśniewski",
    contactLocation: "Płużnica",
    contactPhone: "530788694",
    contactEmail: "pwlasniewski@gmail.com / www.wlasniewski.pl",
    contactZip: "87-214",
    contactAddress: "Płużnica",

    eventLocation: "Grudziądz - park miejski / okolice Wisły",
    eventDate: "Do uzgodnienia",
    eventCount: "13 osób (8 dorosłych + 5 dzieci)",
    eventTeam: "1 fotograf + asysta organizacyjna",

    preparations: {
        before: "Konsultacja stylizacji dla całej rodziny: paleta kolorów, podział akcentów i checklista ubioru dla dorosłych i dzieci.",
        dayOf: "Spotkanie 15 minut przed sesją, szybki plan kadrów grupowych i mini sesji rodzinnych w podgrupach."
    },

    features: [
        "Kompozycja dużej grupy: prowadzenie ustawień tak, by każdy wyglądał naturalnie i korzystnie.",
        "Kadry łączone: ujęcia całej rodziny, rodzice + dzieci, rodzeństwa oraz portrety indywidualne.",
        "Poradnik stylizacji: w ofercie klient dostaje gotowe palety kolorów i przykładowe outfity."
    ],

    pricingHeaders: [
        "ELEMENTY OFERTY",
        "RODZINNY START",
        "RODZINNY KOMFORT",
        "RODZINNY PREMIUM"
    ],

    recommendationLabel: "Najczęściej wybierany",
    recommendationColumnIndex: 2,

    pricingRows: [
        { values: ["Czas sesji", "90 min", "120 min", "150 min"] },
        { values: ["Liczba finalnych zdjęć", "35", "55", "80"] },
        { values: ["Zdjęcia grupowe (13 osób)", "TAK", "TAK", "TAK"] },
        { values: ["Mini portrety podgrup", "—", "TAK", "TAK"], isHeader: true },
        { values: ["Ujęcia storytellingowe", "—", "—", "TAK"], isHeader: true },
        { values: ["Galeria online", "TAK", "TAK", "TAK"] }
    ],

    footerPrices: [
        "Cena pakietu",
        "1490 zł",
        "1990 zł",
        "2590 zł"
    ],

    albumDescription: "Możliwość rozszerzenia o fotoalbum rodzinny premium oraz zestaw odbitek dla dziadków.",

    deliveryTerms: {
        t1: "Do 5 dni: mini-zajawka (kilka zdjęć do udostępnienia rodzinie)",
        t2: "Do 14 dni: pełna galeria online po autorskiej obróbce",
        t3: "Dojazd w obrębie Grudziądza w cenie pakietu"
    },

    footerCompany: "FOTO-DRON Przemysław Właśniewski NIP: 8781430365 • Grudziądz 2026",

    sectionTitles: {
        preparations: "Plan i przebieg sesji rodzinnej",
        standards: "Standard jakości i efekt końcowy",
        delivery: "Terminy przekazania materiałów"
    },

    labels: {
        location: "Lokalizacja",
        date: "Termin",
        count: "Liczba uczestników",
        team: "Zespół",
        prepBefore: "Przed sesją",
        prepDay: "W dniu sesji",
        albumAdvantage: "Dodatki i pamiątki",
        footerDisclaimer: "Warunki współpracy",
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
    category: 'family'
};

interface OfferBuilderProps {
    offerId?: number; // Added for edit mode
    templateId?: number | null;
    templateName?: string | null;
    initialData?: Partial<OfferData>;
    onSave?: (data: OfferData) => Promise<void>;
    saveButtonText?: string;
    offerStatus?: string;
}

export default function OfferBuilder({ offerId, templateId, templateName, initialData, onSave, saveButtonText, offerStatus }: OfferBuilderProps = {}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const clientId = searchParams.get('client_id');
    const clientEmailParam = searchParams.get('clientEmail');
    const type = searchParams.get('type')?.toLowerCase() || 'b2c';
    const templateParam = searchParams.get('template')?.toLowerCase();
    const isSuperseded = offerStatus?.trim().toLowerCase() === 'superseded';

    // Choose initial preset based on URL parameter
    const getInitialPreset = () => {
        if (templateParam === 'birthday') return BIRTHDAY_DATA;
        if (templateParam === 'family') return FAMILY_OLA_GRUDZIADZ_DATA;
        if (templateParam === 'family-ola-grudziadz') return FAMILY_OLA_GRUDZIADZ_DATA;
        return INITIAL_DATA; // Default: communion
    };

    const [data, setData] = useState<OfferData>({
        ...getInitialPreset(),
        contactZip: '',
        contactAddress: '',
        contactEmail: clientEmailParam || '', // Pre-fill email from URL immediately
        ...initialData
    });
    const componentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.8);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedId, setLastSavedId] = useState<number | null>(offerId || null);

    // Template system state
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [savingTemplate, setSavingTemplate] = useState(false);
    const [loadedTemplateId, setLoadedTemplateId] = useState<number | null>(templateId ?? null);
    const [loadedTemplateName, setLoadedTemplateName] = useState<string | null>(templateName ?? null);
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const [saveTemplateMode, setSaveTemplateMode] = useState<'new' | 'overwrite'>('new');
    const [saveTemplateDraftName, setSaveTemplateDraftName] = useState('');

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
        if (isSuperseded) {
            toast.error('Oferta zastąpiona jest tylko do odczytu. Edytuj ofertę, która ją zastąpiła.');
            return;
        }
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
                    // Kanoniczne pola sesji (spinają się z kalendarzem)
                    session_date: data.sessionDateIso || null,
                    session_time: data.sessionTime || null,
                    session_end_time: data.sessionEndTime || null,
                    session_duration_min: data.sessionDurationMin || null,
                    session_location: data.eventLocation || null,
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
        if (isSuperseded) {
            toast.error('Nie można ponownie wysłać oferty zastąpionej.');
            return;
        }
        if (!lastSavedId) {
            alert('Najpierw zapisz ofertę!');
            return;
        }
        // ✋ Email-sending actions require explicit confirmation. Default = OFF.
        if (action === 'email' || action === 'all') {
            const label = action === 'all'
                ? 'Wygenerować PDF i wysłać ofertę do klienta?'
                : 'WYSŁAĆ teraz maila z ofertą i PDF do klienta?';
            const ok = confirm(label + '\n\nOK = tak, wyślij\nAnuluj = NIE wysyłaj nic');
            if (!ok) {
                toast('Anulowano — mail NIE został wysłany.', { icon: '✋' });
                return;
            }
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

    // --- Template System ---

    const fetchTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch('/api/admin/templates', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setTemplates(json.templates || []);
            } else {
                toast.error('Błąd pobierania szablonów');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const handleSaveAsTemplate = async () => {
        if (isSuperseded) {
            toast.error('Nie zapisuj błędnej, zastąpionej oferty jako szablonu.');
            return;
        }
        setSaveTemplateMode(loadedTemplateId ? 'overwrite' : 'new');
        setSaveTemplateDraftName(data.title || 'Nowy szablon');
        setShowSaveTemplateDialog(true);
    };

    const confirmSaveTemplate = async () => {
        const updateExisting = saveTemplateMode === 'overwrite' && !!loadedTemplateId;
        const templateName = saveTemplateDraftName.trim();
        if (!templateName) {
            toast.error('Podaj nazwę szablonu');
            return;
        }

        setSavingTemplate(true);
        try {
            const token = localStorage.getItem('admin_token');
            // Strip client-specific data, keep offer structure
            const templateData: OfferData = {
                ...data,
                contactName: '',
                contactEmail: '',
                contactPhone: '',
                contactZip: '',
                contactAddress: '',
                contactLocation: '',
            };

            const url = updateExisting
                ? `/api/admin/templates/${loadedTemplateId}`
                : '/api/admin/templates';

            const res = await fetch(url, {
                method: updateExisting ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: templateName,
                    type: type,
                    category: data.category,
                    template_data: templateData
                })
            });

            if (res.ok) {
                const result = await res.json();
                if (!updateExisting && result.template?.id) {
                    setLoadedTemplateId(result.template.id);
                    setLoadedTemplateName(templateName);
                } else if (updateExisting) {
                    setLoadedTemplateName(templateName);
                }
                setShowSaveTemplateDialog(false);
                toast.success(updateExisting
                    ? `Szablon nadpisany.`
                    : `Szablon "${templateName}" zapisany!`
                );
            } else {
                const err = await res.json();
                toast.error(`Błąd: ${err.error || 'Nie udało się zapisać szablonu'}`);
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        } finally {
            setSavingTemplate(false);
        }
    };

    const handleLoadTemplate = (template: any) => {
        const tplData = template.template_data as Partial<OfferData>;
        if (!tplData) {
            toast.error('Szablon nie zawiera danych');
            return;
        }

        // Preserve current client-specific fields
        const currentClientData = {
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            contactZip: data.contactZip,
            contactAddress: data.contactAddress,
            contactLocation: data.contactLocation,
        };

        setData(prev => ({
            ...INITIAL_DATA,
            ...tplData,
            // Always keep current client data (don't overwrite with template's empty values)
            ...currentClientData,
        }));

        setLoadedTemplateId(template.id);
        setLoadedTemplateName(template.title);
        setShowTemplateModal(false);
        toast.success(`Wczytano szablon: ${template.title}`);
    };

    const handleDeleteTemplate = async (templateId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Czy na pewno chcesz usunąć ten szablon?')) return;

        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/templates/${templateId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Szablon usunięty');
                setTemplates(prev => prev.filter(t => t.id !== templateId));
            } else {
                toast.error('Błąd usuwania szablonu');
            }
        } catch (error) {
            toast.error('Błąd połączenia');
        }
    };

    const handleDelete = async () => {
        if (!lastSavedId) return;
        if (isSuperseded) {
            toast.error('Oferta zastąpiona pozostaje w historii audytowej i nie może być usunięta.');
            return;
        }
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

    // Load preset based on category
    const handleCategoryChange = (category: string) => {
        const currentContact = {
            contactName: data.contactName,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            contactLocation: data.contactLocation,
            contactZip: data.contactZip,
            contactAddress: data.contactAddress,
        };

        if (category === 'urodziny') {
            setData(prev => ({
                ...BIRTHDAY_DATA,
                ...currentContact, // Preserve contact info
                category: 'urodziny'
            }));
        } else if (category === 'family') {
            setData(prev => ({
                ...FAMILY_OLA_GRUDZIADZ_DATA,
                ...currentContact, // Preserve contact info
                category: 'family'
            }));
        } else if (category === 'komunia') {
            setData(prev => ({
                ...INITIAL_DATA,
                ...currentContact, // Preserve contact info
                category: 'komunia'
            }));
        } else {
            // Standard/Ślub/B2B - just update category, keep current data
            update('category', category);
        }
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
                                    offerStatus === 'superseded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                    offerStatus === 'pending' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                        'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                                }`}>
                                {offerStatus === 'draft' ? 'Szkic' :
                                    offerStatus === 'pending' ? 'Oczekuje na klienta' :
                                        offerStatus === 'accepted' ? 'Zaakceptowana' :
                                            offerStatus === 'rejected' ? 'Odrzucona' :
                                                offerStatus === 'superseded' ? 'Zastąpiona' : offerStatus}
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
                                disabled={isSuperseded}
                                className="flex items-center justify-center gap-2 bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white px-3 py-2 rounded shadow transition font-bold border border-red-500/20 whitespace-nowrap"
                                title={isSuperseded ? 'Oferta pozostaje w historii audytowej' : 'Usuń ofertę'}
                            >
                                <Trash2 size={18} />
                            </button>
                        )}

                        <label className="flex items-center justify-center gap-2 cursor-pointer bg-zinc-200 dark:bg-zinc-800 px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition whitespace-nowrap" title="Włącz/Wyłącz negocjacje">
                            <input
                                type="checkbox"
                                checked={data.negotiation_enabled ?? true}
                                onChange={e => update('negotiation_enabled', e.target.checked)}
                                disabled={isSuperseded}
                                className="w-4 h-4 accent-green-500"
                            />
                            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Negocjacje</span>
                        </label>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || isSuperseded}
                            title={isSuperseded ? 'Oferta zastąpiona jest tylko do odczytu' : undefined}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition disabled:opacity-50 font-bold"
                        >
                            <Save size={18} /> {isSaving ? 'Zapisywanie...' : lastSavedId ? 'Aktualizuj' : 'Zapisz'}
                        </button>

                        {lastSavedId && !isSuperseded && (
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

                        {/* Template buttons */}
                        <button
                            onClick={handleSaveAsTemplate}
                            disabled={savingTemplate || isSuperseded}
                            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded shadow hover:bg-amber-700 transition disabled:opacity-50 font-bold"
                            title="Zapisz aktualną ofertę jako szablon do ponownego użycia"
                        >
                            <BookCopy size={18} /> {savingTemplate ? 'Zapisywanie...' : 'Zapisz szablon'}
                        </button>
                        <button
                            onClick={() => { fetchTemplates(); setShowTemplateModal(true); }}
                            className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-2 rounded shadow hover:bg-cyan-700 transition font-bold"
                            title="Wczytaj dane z zapisanego szablonu"
                        >
                            <Download size={18} /> Wczytaj z szablonu
                        </button>
                    </div>
                </div>

                {/* Storage Actions (Persistent once saved) */}
                {lastSavedId && !isSuperseded && (
                    <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 mb-6 flex flex-wrap gap-2 justify-center shadow-inner">
                        <button onClick={() => handleAction('all')} className="flex items-center gap-1.5 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-orange-700 transition shadow-lg">
                            <FileCheck size={14} /> Wyślij ofertę + PDF
                        </button>
                    </div>
                )}

                {showSaveTemplateDialog && (
                    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl p-6">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">Zapisz szablon</h3>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {loadedTemplateId
                                            ? `Aktualnie załadowany szablon: #${loadedTemplateId}${loadedTemplateName ? ` — ${loadedTemplateName}` : ''}`
                                            : 'To będzie nowy szablon.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowSaveTemplateDialog(false)}
                                    className="text-zinc-400 hover:text-white transition"
                                    disabled={savingTemplate}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {loadedTemplateId && (
                                <div className="flex gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => setSaveTemplateMode('overwrite')}
                                        className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold border transition ${saveTemplateMode === 'overwrite' ? 'bg-amber-600 text-white border-amber-500' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
                                    >
                                        Nadpisz ten szablon
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSaveTemplateMode('new')}
                                        className={`flex-1 rounded-lg px-4 py-3 text-sm font-bold border transition ${saveTemplateMode === 'new' ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'}`}
                                    >
                                        Zapisz jako nowy
                                    </button>
                                </div>
                            )}

                            <div className="mb-5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Nazwa szablonu</label>
                                <input
                                    type="text"
                                    value={saveTemplateDraftName}
                                    onChange={(e) => setSaveTemplateDraftName(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-gold-500"
                                    placeholder="Np. Sesja rodzinna - Noc Świętojańska"
                                    disabled={savingTemplate}
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowSaveTemplateDialog(false)}
                                    className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition font-semibold"
                                    disabled={savingTemplate}
                                >
                                    Anuluj
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmSaveTemplate}
                                    disabled={savingTemplate}
                                    className="px-4 py-2 rounded-lg bg-gold-600 text-black hover:bg-gold-500 transition font-extrabold disabled:opacity-50"
                                >
                                    {savingTemplate ? 'Zapisywanie...' : 'Zapisz'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Explicit Admin Context Banner */}
                {lastSavedId && offerStatus === 'draft' && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                        <span className="text-amber-500 mt-0.5">⚠️</span>
                        <div>
                            <p className="text-amber-500 font-bold text-sm mb-1">Status: Szkic — niewidoczny dla klienta</p>
                            <p className="text-amber-400/80 text-xs">Sprawdź treść i cenę, a następnie użyj jednego przycisku <span className="text-white">„Wyślij ofertę + PDF”</span>. Dopiero udana wysyłka zmieni status na wysłany.</p>
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
                {lastSavedId && isSuperseded && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
                        <span className="text-amber-400 mt-0.5">🗄️</span>
                        <div>
                            <p className="text-amber-400 font-bold text-sm mb-1">Status: Zastąpiona — klient jej nie widzi</p>
                            <p className="text-amber-300/80 text-xs">Ten rekord jest tylko do odczytu i pozostaje w historii audytowej. Nie można go edytować, wysłać ponownie ani usunąć.</p>
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
                                onChange={e => handleCategoryChange(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded text-black"
                            >
                                <option value="standard">Standardowa</option>
                                <option value="komunia">Komunia Święta</option>
                                <option value="family">Sesja rodzinna</option>
                                <option value="urodziny">Urodziny</option>
                                <option value="slub">Ślub</option>
                                <option value="b2b">B2B</option>
                            </select>
                            <p className="text-[10px] text-gray-400 mt-1">Zmiana kategorii załaduje odpowiedni szablon (zachowując dane kontaktowe).</p>
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
                        {/* Kanoniczna data sesji - spina sie z kalendarzem (/admin/bookings/calendar) */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                            <div className="text-[10px] uppercase font-bold text-amber-700 mb-1.5">
                                Data sesji (kalendarz)
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="date"
                                    value={data.sessionDateIso || ''}
                                    onChange={e => update('sessionDateIso', e.target.value)}
                                    className="w-full px-2 py-1.5 border border-amber-300 rounded text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                                <input
                                    type="time"
                                    value={data.sessionTime || ''}
                                    onChange={e => update('sessionTime', e.target.value)}
                                    placeholder="Start"
                                    className="w-full px-2 py-1.5 border border-amber-300 rounded text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                                <input
                                    type="time"
                                    value={data.sessionEndTime || ''}
                                    onChange={e => update('sessionEndTime', e.target.value)}
                                    placeholder="Koniec"
                                    className="w-full px-2 py-1.5 border border-amber-300 rounded text-sm focus:ring-2 focus:ring-amber-400 focus:outline-none"
                                />
                            </div>
                            <div className="text-[10px] text-amber-800 mt-1">
                                Wypelnij zeby sesja pokazala sie w kalendarzu admina/fotografa. Godzina koncowa jest opcjonalna (np. "14:00 - 17:00"). Pole &quot;Data&quot; powyzej sluzy tylko do wyswietlenia w PDF.
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <Input label="" value={data.labels.count} onChange={v => updateNested('labels', 'count', v)} />
                            <Input label="" value={data.eventCount} onChange={v => update('eventCount', v)} />
                        </div>
                        {data.category === 'komunia' && (
                            <div className="grid grid-cols-2 gap-2">
                                <span className="text-xs font-bold text-zinc-500 uppercase flex items-center">Tracked Count</span>
                                <Input label="" type="number" value={data.children_count || ''} onChange={v => update('children_count', parseInt(v) || 0)} placeholder="Liczba children (numerycznie)" />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 mt-2">
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

            {/* Template Selection Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
                    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-5 border-b border-zinc-700">
                            <div>
                                <h3 className="text-lg font-bold text-white">Wczytaj z szablonu</h3>
                                <p className="text-xs text-zinc-400 mt-1">Dane klienta (imię, email, telefon) zostaną zachowane</p>
                            </div>
                            <button onClick={() => setShowTemplateModal(false)} className="text-zinc-400 hover:text-white transition">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-4">
                            {loadingTemplates ? (
                                <div className="text-center py-12 text-zinc-400">
                                    <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
                                    Ładowanie szablonów...
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-12">
                                    <BookCopy size={48} className="mx-auto text-zinc-600 mb-3" />
                                    <p className="text-zinc-400 font-bold">Brak zapisanych szablonów</p>
                                    <p className="text-zinc-500 text-sm mt-1">Użyj &quot;Zapisz szablon&quot; aby utworzyć pierwszy szablon</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {templates.map(tpl => (
                                        <button
                                            key={tpl.id}
                                            onClick={() => handleLoadTemplate(tpl)}
                                            className="w-full text-left p-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-cyan-500/50 rounded-xl transition group"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-white truncate group-hover:text-cyan-400 transition">{tpl.title}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">
                                                            {tpl.type || 'b2c'}
                                                        </span>
                                                        {(tpl.template_data as any)?.category && (
                                                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-700 text-zinc-300">
                                                                {(tpl.template_data as any).category}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] text-zinc-500">
                                                            {new Date(tpl.created_at).toLocaleDateString('pl-PL')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3">
                                                    <span className="text-cyan-500 opacity-0 group-hover:opacity-100 transition text-sm font-bold">Wczytaj</span>
                                                    <button
                                                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                                                        className="text-zinc-500 hover:text-red-400 transition p-1"
                                                        title="Usuń szablon"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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

const Input = ({ label, value, onChange, placeholder = "", type = "text" }: { label: string; value: string | boolean | number; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
        {label && <label className="text-[10px] uppercase font-bold text-zinc-500 mb-1 block">{label}</label>}
        <input
            type={type}
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-zinc-950 border border-zinc-700 rounded px-3 py-1.5 text-sm text-white outline-none focus:border-gold-500 transition-colors"
        />
    </div>
);
