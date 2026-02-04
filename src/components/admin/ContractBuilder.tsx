'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, Save, FileCheck, Cloud, Share2, Mail, X, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

interface ContractData {
    contractNumber: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    eventDate: string;
    eventLocation: string;
    offerTitle: string;
    totalPrice: string;
    content: string; // The legal markdown/HTML
    signedAt: string | null;
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
        eventLocation: '',
        offerTitle: '',
        totalPrice: '0',
        content: DEFAULT_CONTRACT_TEMPLATE,
        signedAt: null
    });

    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedId, setLastSavedId] = useState<number | null>(null);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (offerId) {
            fetchOfferAndGenerateNumber(offerId);
        }
    }, [offerId]);

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

                setData(prev => ({
                    ...prev,
                    contractNumber: draftNum,
                    clientName: offer.user?.name || offer.client_email,
                    clientEmail: offer.user?.email || offer.client_email,
                    clientPhone: offer.user?.phone || '',
                    eventDate: offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'Brak daty',
                    eventLocation: 'Do ustalenia',
                    offerTitle: offer.title,
                    totalPrice: offer.total_price.toString()
                }));
            }
        } catch (error) {
            console.error('Error fetching offer for contract:', error);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Umowa_${data.contractNumber}`,
    });

    const handleSave = async () => {
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
                    offer_id: parseInt(offerId!),
                    client_id: clientId ? parseInt(clientId) : null,
                    content: data.content
                })
            });
            const result = await res.json();
            if (res.ok) {
                setLastSavedId(result.contract.id);
                setData(prev => ({ ...prev, contractNumber: result.contract.contract_number }));
                alert('Umowa została wygenerowana i powiązana z ofertą!');
            }
        } catch (error) {
            alert('Błąd podczas zapisywania umowy');
        } finally {
            setIsSaving(false);
        }
    };

    const replacedContent = data.content
        .replace(/{{contractNumber}}/g, data.contractNumber)
        .replace(/{{clientName}}/g, data.clientName)
        .replace(/{{clientEmail}}/g, data.clientEmail)
        .replace(/{{clientPhone}}/g, data.clientPhone)
        .replace(/{{offerTitle}}/g, data.offerTitle)
        .replace(/{{eventDate}}/g, data.eventDate)
        .replace(/{{eventLocation}}/g, data.eventLocation)
        .replace(/{{totalPrice}}/g, data.totalPrice)
        .replace(/{{currentDate}}/g, new Date().toLocaleDateString());

    return (
        <div className="flex h-screen bg-zinc-950 overflow-hidden text-white font-sans">
            {/* LEFT: Legal Content Editor */}
            <div className="w-full lg:w-1/2 border-r border-zinc-800 p-8 flex flex-col gap-6 overflow-y-auto bg-zinc-900 shadow-2xl z-10">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                    <button onClick={() => router.back()} className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition font-bold">
                        <ArrowLeft size={16} /> Powrót
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !offerId}
                            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl shadow-lg hover:bg-green-700 transition font-bold disabled:opacity-30"
                        >
                            <Save size={18} /> {isSaving ? 'Generowanie...' : 'Generuj Umowę'}
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-6 py-2.5 rounded-xl shadow border border-zinc-700 hover:bg-zinc-700 transition font-bold"
                        >
                            <Printer size={18} /> Drukuj
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <FileCheck className="text-blue-500" />
                            Kreator Umów
                        </h2>
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                            {offerId ? 'Powiązana z ofertą' : 'Nowa Umowa'}
                        </span>
                    </div>

                    <div className="bg-zinc-800/30 border border-zinc-800 rounded-2xl p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-black mb-1 block">Nr Umowy</label>
                                <div className="text-sm font-mono text-zinc-300">{data.contractNumber}</div>
                            </div>
                            <div>
                                <label className="text-[10px] text-zinc-500 uppercase font-black mb-1 block">Powiązana Oferta</label>
                                <div className="text-sm text-zinc-300 truncate">{data.offerTitle}</div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-zinc-500 uppercase font-black mb-2 block tracking-wider">Treść Umowy (Markdown/HTML)</label>
                            <textarea
                                value={data.content}
                                onChange={e => setData(prev => ({ ...prev, content: e.target.value }))}
                                className="w-full h-[600px] bg-zinc-950 text-zinc-300 p-6 rounded-2xl border border-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Actions (After save) */}
                {lastSavedId && (
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <p className="text-blue-400 font-bold text-center text-xs uppercase tracking-widest">Zarządzaj Dokumentem</p>
                        <div className="flex gap-2">
                            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-3 rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition">
                                <Cloud size={14} /> S3
                            </button>
                            <button className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-3 rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition">
                                <Share2 size={14} /> Drive
                            </button>
                            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition">
                                <Mail size={14} /> Wyślij do klienta
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Live Preview (A4 Sim) */}
            <div className="flex-1 bg-zinc-950 flex justify-center items-start overflow-y-auto p-12 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                <div
                    ref={componentRef}
                    className="w-[210mm] min-h-[297mm] bg-white text-black p-[25mm] shadow-[0_40px_100px_rgba(0,0,0,0.6)] leading-relaxed text-[11pt] font-serif"
                >
                    <div className="contract-preview whitespace-pre-wrap">
                        {replacedContent}
                    </div>

                    <div className="mt-[50mm] flex justify-between border-t border-black pt-4 italic text-sm">
                        <div className="w-1/3">
                            <p>Podpis Wykonawcy</p>
                            <div className="h-20"></div>
                            <p className="font-bold">Przemysław Właśniewski</p>
                        </div>
                        <div className="w-1/3 text-right">
                            <p>Podpis Zleceniodawcy</p>
                            <div className="h-20 border-b border-dashed border-black/20"></div>
                            <p className="font-bold">{data.clientName}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
