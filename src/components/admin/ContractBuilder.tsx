'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Printer, Save, FileCheck, Cloud, Share2, Mail, X, ArrowLeft,
    Bold, Italic, List, Heading1, Heading2, Heading3, Type, Eye, EyeOff, Plus, FileEdit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    CONTRACT_TEMPLATES_META,
    getContractTemplate,
    suggestTemplateForCategory,
    type ContractTemplateKey,
} from '@/lib/contracts/templates';

interface ContractData {
    contractNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    eventDate: string;
    eventTime: string;
    eventLocation: string;
    eventCount: string;
    eventTeam: string;
    offerTitle: string;
    packageDetails: string;
    totalPrice: string;
    content: string; // The legal markdown/HTML
    signedAt: string | null;
    signature: string; // Added signature field
}

const DEFAULT_CONTRACT_TEMPLATE = `
# UMOWA ŚWIADCZENIA USŁUG FOTOGRAFICZNYCH
**Numer umowy:** {{contractNumber}}
**Data zawarcia:** {{currentDate}}

## 1. STRONY UMOWY
Wykonawca: **FOTO-DRON Przemysław Właśniewski**
Zleceniodawca: **{{clientName}}** ({{clientEmail}}, tel: {{clientPhone}})

## 2. PRZEDMIOT UMOWY
Przedmiotem umowy jest wykonanie reportażu fotograficznego zgodnie z ofertą "{{offerTitle}}" w dniu **{{eventDate}}** w lokalizacji **{{eventLocation}}**.

{{packageDetails}}

## 3. WYNAGRODZENIE
Strony ustalają wynagrodzenie w kwocie **{{totalPrice}} PLN**. Płatność nastąpi zgodnie z harmonogramem:
- Zadatek: 500 PLN płatny w dniu podpisania.
- Reszta kwoty: płatna w dniu oddania materiałów.

## 4. POSTANOWIENIA KOŃCOWE
Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.
`;

export default function ContractBuilder() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const offerId = searchParams.get('offer_id');
    const clientId = searchParams.get('client_id');

    const [data, setData] = useState<ContractData>({
        contractNumber: 'Ładowanie...',
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        eventDate: '',
        eventTime: '',
        eventLocation: '',
        eventCount: '',
        eventTeam: '',
        offerTitle: '',
        packageDetails: '',
        totalPrice: '0',
        content: DEFAULT_CONTRACT_TEMPLATE,
        signedAt: null,
        signature: 'Przemysław Właśniewski'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedId, setLastSavedId] = useState<number | null>(null);
    const [showPreview, setShowPreview] = useState(true);
    const [templateKey, setTemplateKey] = useState<ContractTemplateKey>('standard');
    const [templateLocked, setTemplateLocked] = useState(false); // true gdy user ręcznie edytował treść

    const applyTemplate = (key: ContractTemplateKey, force: boolean = false) => {
        if (!force && templateLocked) {
            const ok = window.confirm('Masz już zmiany w treści umowy. Załadowanie szablonu nadpisze treść. Kontynuować?');
            if (!ok) return;
        }
        setTemplateKey(key);
        setData(prev => ({ ...prev, content: getContractTemplate(key) }));
        setTemplateLocked(false);
    };
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (offerId) {
            fetchOfferAndGenerateNumber(offerId);
        } else if (clientId) {
            fetchClientAndPickOffer(clientId);
        } else {
            // Check if we should initialize as new blank contract
            if (data.contractNumber === 'Ładowanie...') {
                setData(prev => ({ ...prev, contractNumber: 'NOWA-UMOWA' }));
            }
        }
    }, [offerId, clientId]);

    const fetchClientAndPickOffer = async (cid: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/clients/${cid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Klient nie znaleziony');
            const json = await res.json();
            const client = json.client;
            const offers: any[] = client.offers || [];
            // Wybierz najlepszą ofertę: accepted > negotiating > pending > sent > najnowsza
            const order = ['accepted', 'negotiating', 'pending', 'sent'];
            const sorted = [...offers].sort((a, b) => {
                const ai = order.indexOf(a.status); const bi = order.indexOf(b.status);
                const an = ai === -1 ? 99 : ai; const bn = bi === -1 ? 99 : bi;
                if (an !== bn) return an - bn;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            const bestOffer = sorted[0];
            if (bestOffer) {
                // Mamy ofertę — załaduj ją normalną ścieżką (z pełnymi sekcjami)
                await fetchOfferAndGenerateNumber(String(bestOffer.id));
                toast.success(`Wczytano dane z oferty: ${bestOffer.title}`);
                return;
            }
            // Brak oferty — wypełnij tylko dane klienta
            const draftNum = `UMW-B2C-${new Date().getFullYear()}-XXX`;
            const suggested = suggestTemplateForCategory(null);
            setTemplateKey(suggested);
            setData(prev => ({
                ...prev,
                contractNumber: draftNum,
                clientName: client.name || client.email || '',
                clientEmail: client.email || '',
                clientPhone: client.phone || '',
                content: getContractTemplate(suggested),
            }));
            toast('Klient nie ma jeszcze ofert — wypełniono dane klienta. Pozostałe pola uzupełnij ręcznie.', { icon: 'ℹ️' });
        } catch (e) {
            console.error('[fetchClientAndPickOffer]', e);
            toast.error('Nie udało się wczytać danych klienta.');
            setData(prev => ({ ...prev, contractNumber: 'NOWA-UMOWA' }));
        }
    };

    const fetchOfferAndGenerateNumber = async (id: string) => {
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const offerData = await res.json();
                const offer = offerData.offer;

                // Generate a draft contract number (calling our numbering service via helper endpoint if needed or client-side prediction)
                const prefix = offer.type === 'b2b' ? 'UMW-B2B' : 'UMW-B2C';
                const draftNum = `${prefix}-${new Date().getFullYear()}-XXX`;

                // Calculate Package Details from Client Selection
                let packageDetails = '';
                let finalPrice = offer.total_price;

                if (offer.client_selection) {
                    const selection = offer.client_selection;

                    if (selection.selectedPackage) {
                        packageDetails += `**Wybrany pakiet:** ${selection.selectedPackage.name}\n`;
                    }

                    if (selection.childCount) {
                        packageDetails += `**Liczba dzieci:** ${selection.childCount}\n`;
                    }

                    if (selection.selectedOptionalItems && Array.isArray(selection.selectedOptionalItems)) {
                        const optionalItems: string[] = [];
                        offer.sections?.forEach((section: any, sIdx: number) => {
                            section.items?.forEach((item: any, iIdx: number) => {
                                const globalIdx = sIdx * 100 + iIdx;
                                if (selection.selectedOptionalItems.includes(globalIdx)) {
                                    optionalItems.push(`${item.title} (${item.price} PLN)`);
                                }
                            });
                        });

                        if (optionalItems.length > 0) {
                            packageDetails += `\n**Dodatkowe opcje:**\n` + optionalItems.map(i => `- ${i}`).join('\n');
                        }
                    }

                    // Use price from selection if available, otherwise offer total
                    if (selection.totalPrice) {
                        finalPrice = selection.totalPrice;
                    }
                }

                // Wybór szablonu wg kategorii oferty (komunia/urodziny/slub/...).
                const suggested = suggestTemplateForCategory(offer.category);
                setTemplateKey(suggested);
                const eventDateStr = offer.session_date
                    ? new Date(offer.session_date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
                    : (offer.valid_until ? new Date(offer.valid_until).toLocaleDateString('pl-PL') : 'Brak daty');
                const eventLoc = offer.session_location
                    || offer.template_data?.eventLocation
                    || 'Do ustalenia';
                // Godzina sesji: HH:MM lub HH:MM-HH:MM (od-do)
                const eventTimeStr = offer.session_time
                    ? (offer.session_end_time ? `${offer.session_time}–${offer.session_end_time}` : offer.session_time)
                    : (offer.template_data?.eventTime || '');
                // Liczba osób/dzieci: z client_selection lub template_data
                let eventCountStr = '';
                if (offer.client_selection?.childCount) eventCountStr = String(offer.client_selection.childCount);
                else if (offer.template_data?.eventCount) eventCountStr = String(offer.template_data.eventCount);
                else if (offer.template_data?.children_count) eventCountStr = String(offer.template_data.children_count);
                const eventTeamStr = offer.template_data?.eventTeam || '';
                setData(prev => ({
                    ...prev,
                    contractNumber: draftNum,
                    clientName: offer.user?.name || offer.client_email,
                    clientEmail: offer.user?.email || offer.client_email,
                    clientPhone: offer.user?.phone || '',
                    eventDate: eventDateStr,
                    eventTime: eventTimeStr,
                    eventLocation: eventLoc,
                    eventCount: eventCountStr,
                    eventTeam: eventTeamStr,
                    offerTitle: offer.title,
                    packageDetails: packageDetails,
                    totalPrice: finalPrice.toString(),
                    content: getContractTemplate(suggested),
                }));
            }
        } catch (error) {
            console.error('Error fetching offer for contract:', error);
            setData(prev => ({ ...prev, contractNumber: 'Błąd pobierania' }));
            toast.error('Nie udało się pobrać danych oferty.');
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Umowa_${data.contractNumber}`,
    });

    const handleSave = async () => {
        if (!data.signature || data.signature.length < 5) {
            toast.error('Proszę złożyć czytelny podpis Wykonawcy!');
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('admin_token');
            // 1. Actually generate the final contract number on server
            const res = await fetch('/api/admin/contracts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    offer_id: offerId ? parseInt(offerId) : null,
                    client_id: clientId ? parseInt(clientId) : null,
                    content: data.content
                })
            });
            const result = await res.json();
            if (res.ok) {
                setLastSavedId(result.contract.id);
                setData(prev => ({ ...prev, contractNumber: result.contract.contract_number }));

                if (clientId) {
                    toast.success('Umowa wygenerowana! Powrót do klienta...');
                    setTimeout(() => {
                        window.location.href = `/admin/clients/${clientId}?tab=contracts`;
                    }, 1000);
                } else {
                    toast.success('Umowa została wygenerowana i powiązana z ofertą!');
                }
            } else {
                toast.error('Błąd zapisu: ' + (result.error || 'Nieznany błąd'));
            }
        } catch (error) {
            toast.error('Błąd podczas zapisywania umowy');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Toolbar Actions ---
    const insertText = (prefix: string, suffix: string = '') => {
        if (!textareaRef.current) return;
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const selection = text.substring(start, end);
        const after = text.substring(end);

        const newText = before + prefix + selection + suffix + after;
        setData(prev => ({ ...prev, content: newText }));

        // Restore focus and selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, end + prefix.length);
        }, 0);
    };

    const variables = [
        { label: 'Klient', value: '{{clientName}}' },
        { label: 'Email', value: '{{clientEmail}}' },
        { label: 'Oferta', value: '{{offerTitle}}' },
        { label: 'Data', value: '{{eventDate}}' },
        { label: 'Cena', value: '{{totalPrice}}' },
        { label: 'Pakiety', value: '{{packageDetails}}' },
        { label: 'Nr Umowy', value: '{{contractNumber}}' },
    ];

    const replacedContent = data.content
        .replace(/{{contractNumber}}/g, data.contractNumber)
        .replace(/{{clientName}}/g, data.clientName || '[uzupełnij: clientName]')
        .replace(/{{clientEmail}}/g, data.clientEmail || '[uzupełnij: clientEmail]')
        .replace(/{{clientPhone}}/g, data.clientPhone || '[uzupełnij: clientPhone]')
        .replace(/{{offerTitle}}/g, data.offerTitle || '[uzupełnij: offerTitle]')
        .replace(/{{packageDetails}}/g, data.packageDetails || '')
        .replace(/{{eventDate}}/g, data.eventDate || '[uzupełnij: eventDate]')
        .replace(/{{eventTime}}/g, data.eventTime || '[uzupełnij: eventTime]')
        .replace(/{{eventLocation}}/g, data.eventLocation || '[uzupełnij: eventLocation]')
        .replace(/{{eventCount}}/g, data.eventCount || '[uzupełnij: eventCount]')
        .replace(/{{eventTeam}}/g, data.eventTeam || '[uzupełnij: eventTeam]')
        .replace(/{{workshopPlan}}/g, '[uzupełnij plan zajęć: dzień 1 / dzień 2 / dzień 3]')
        .replace(/{{deliveryDays}}/g, '21')
        .replace(/{{totalPrice}}/g, data.totalPrice)
        .replace(/{{currentDate}}/g, new Date().toLocaleDateString('pl-PL'));

    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden text-white font-sans">
            {/* LEFT: Editor */}
            <div className={`${showPreview ? 'w-1/2' : 'w-full max-w-5xl mx-auto'} border-r border-zinc-800 flex flex-col transition-all duration-300 bg-zinc-900 shadow-2xl z-10`}>

                {/* Header Toolbar */}
                <div className="flex items-center justify-between border-b border-zinc-800 p-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="text-zinc-400 hover:text-white transition">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FileCheck className="text-blue-500 w-5 h-5" />
                                Kreator Umów
                            </h2>
                            <p className="text-xs text-zinc-500 font-mono">{data.contractNumber}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                            title={showPreview ? "Ukryj podgląd" : "Pokaż podgląd"}
                        >
                            {showPreview ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        <div className="h-6 w-px bg-zinc-800 mx-2" />
                        <button onClick={handleSave} disabled={isSaving}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition disabled:opacity-50">
                            <Save size={16} /> Zapisz
                        </button>
                        <button onClick={handlePrint} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition border border-zinc-700">
                            <Printer size={16} /> Drukuj
                        </button>
                    </div>
                </div>

                {/* Formatting Toolbar */}
                <div className="border-b border-zinc-800 p-2 flex flex-wrap items-center gap-1 bg-zinc-800/50">
                    {/* Template selector */}
                    <select
                        value={templateKey}
                        onChange={e => applyTemplate(e.target.value as ContractTemplateKey)}
                        className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded px-2 py-1.5 mr-2"
                        title="Wybierz szablon umowy"
                    >
                        {CONTRACT_TEMPLATES_META.map(t => (
                            <option key={t.key} value={t.key}>Szablon: {t.label}</option>
                        ))}
                    </select>
                    <div className="h-4 w-px bg-zinc-700 mx-1" />
                    <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Pogrubienie"><Bold size={16} /></button>
                    <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Kursywa"><Italic size={16} /></button>
                    <div className="h-4 w-px bg-zinc-700 mx-1" />
                    <button onClick={() => insertText('# ')} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Nagłówek 1"><Heading1 size={16} /></button>
                    <button onClick={() => insertText('## ')} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Nagłówek 2"><Heading2 size={16} /></button>
                    <button onClick={() => insertText('### ')} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Nagłówek 3"><Heading3 size={16} /></button>
                    <div className="h-4 w-px bg-zinc-700 mx-1" />
                    <button onClick={() => insertText('- ')} className="p-2 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white" title="Lista"><List size={16} /></button>

                    <div className="flex-1" />

                    {/* Variable Chips */}
                    <div className="flex gap-2 overflow-x-auto max-w-[400px] no-scrollbar">
                        {variables.map(v => (
                            <button
                                key={v.value}
                                onClick={() => insertText(v.value)}
                                className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] font-bold hover:bg-blue-500/20 whitespace-nowrap transition"
                            >
                                + {v.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Text Editor Area */}
                <div className="flex-1 overflow-hidden relative">
                    <textarea
                        ref={textareaRef}
                        value={data.content}
                        onChange={e => { setData(prev => ({ ...prev, content: e.target.value })); setTemplateLocked(true); }}
                        className="w-full h-full bg-zinc-900 text-zinc-200 p-8 resize-none outline-none font-mono text-sm leading-relaxed"
                        placeholder="Zacznij pisać treść umowy..."
                    />

                    {/* Signature Panel */}
                    <div className="absolute bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 p-6 flex flex-col gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <FileEdit size={14} className="text-yellow-500" />
                                Twój Podpis Klawiaturowy (Obowiązkowy)
                            </label>
                            <input
                                type="text"
                                placeholder="Wpisz Imię i Nazwisko Wykonawcy"
                                value={data.signature}
                                onChange={e => setData(prev => ({ ...prev, signature: e.target.value }))}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white font-serif italic text-xl outline-none focus:border-yellow-500 transition shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Live Preview (A4 Sim) */}
            {showPreview && (
                <div className="w-1/2 bg-zinc-950 flex justify-center items-start overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <div
                        ref={componentRef}
                        className="w-[210mm] min-h-[297mm] bg-white text-black p-[25mm] shadow-[0_40px_100px_rgba(0,0,0,0.6)] leading-relaxed text-[11pt] font-serif transition-transform duration-300 origin-top scale-90 lg:scale-100"
                    >
                        <div className="contract-preview whitespace-pre-wrap">
                            {replacedContent}
                        </div>

                        <div className="mt-[60mm] flex justify-between gap-12 pt-8">
                            <div className="w-1/2 flex flex-col items-center">
                                <div className="w-full h-32 border-b border-zinc-300 flex items-end justify-center pb-4">
                                    <span className="font-serif italic text-2xl text-zinc-800 opacity-90 select-none">
                                        {data.signature || '...........................................'}
                                    </span>
                                </div>
                                <p className="mt-4 font-bold text-center">Przemysław Właśniewski</p>
                                <p className="text-[9pt] text-zinc-500 uppercase tracking-widest mt-1">Wykonawca</p>
                            </div>
                            <div className="w-1/2 flex flex-col items-center">
                                <div className="w-full h-32 border-b-2 border-zinc-800 flex items-end justify-center pb-2">
                                    <span className="text-[8pt] text-zinc-400 italic">Podpis czytelny Zleceniodawcy</span>
                                </div>
                                <p className="mt-4 font-bold text-center">{data.clientName || '...........................................'}</p>
                                <p className="text-[9pt] text-zinc-500 uppercase tracking-widest mt-1">Zleceniodawca</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
