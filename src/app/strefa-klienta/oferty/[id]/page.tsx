'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [negotiationMessage, setNegotiationMessage] = useState('');
    const [showNegotiationForm, setShowNegotiationForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [unlockRequested, setUnlockRequested] = useState(false);

    const [selectedOptionalItems, setSelectedOptionalItems] = useState<Set<number>>(new Set());
    // New: Communion Split Logic
    // Store child counts per package index: { 1: 20, 2: 15 } (Index 0 is labels)
    const [splitPackageCounts, setSplitPackageCounts] = useState<{ [key: number]: number }>({});

    // Legacy single child count (keep for backward compatibility if needed, or remove)
    const [childCount, setChildCount] = useState<number>(0);

    const [selectedPackageIndex, setSelectedPackageIndex] = useState<number | null>(null);
    const [offerId, setOfferId] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>('#');

    const isCommunion = offer?.category?.toLowerCase() === 'komunia';

    useEffect(() => {
        const unwrapParams = async () => {
            const resolvedParams = await params;
            setOfferId(resolvedParams.id);
        };
        unwrapParams();
    }, [params]);

    useEffect(() => {
        if (offerId) {
            fetchOffer(offerId);
        }
    }, [offerId]);

    const fetchOffer = async (id: string) => {
        try {
            const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
            if (!token) {
                router.push('/logowanie');
                return;
            }

            const response = await fetch(`/api/client/portal/offers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setOffer(data.offer);
                // Initialize child count if already set (future proofing)
                // Initialize split counts if present
                if (data.offer.client_selection?.splitPackageCounts) {
                    setSplitPackageCounts(data.offer.client_selection.splitPackageCounts);
                } else if (data.offer.client_selection?.childCount) {
                    // Fallback for legacy
                    setChildCount(data.offer.client_selection.childCount);
                }

                // Prepare PDF URL with token
                const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
                if (token) {
                    setPdfUrl(`/api/offers/${id}/pdf?token=${token}`);
                }
            } else if (response.status === 401) {
                router.push('/logowanie');
            }
        } catch (error) {
            console.error('Error fetching offer:', error);
        } finally {
            setLoading(false);
        }
    };

    // Safe defaults for template data
    const templateData = offer?.template_data;
    const sectionVisibility = templateData?.sectionVisibility || {
        eventInfo: true,
        preparations: true,
        features: true,
        pricing: true,
        album: true,
        delivery: true
    };
    const contactName = templateData?.contactName === 'undefined undefined' ? '' : templateData?.contactName;

    // Calculate total price based on selected items AND selected package(s)
    const calculatedTotal = useMemo(() => {
        if (!offer) return 0;

        let total = 0;

        if (templateData?.footerPrices) {
            if (isCommunion) {
                // Communion Logic: Sum of (Price * Count) for each package
                templateData.footerPrices.forEach((priceStr: string, idx: number) => {
                    if (idx === 0) return; // Skip label column
                    const count = splitPackageCounts[idx] || 0;
                    if (count > 0) {
                        const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
                        total += price * count;
                    }
                });
            } else if (selectedPackageIndex !== null) {
                // Standard Logic: Single Package Price
                const priceStr = templateData.footerPrices[selectedPackageIndex];
                const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
                total += price;
            }
        }

        // 2. Add Optional Items (Legacy)
        offer.sections?.forEach((section: any) => {
            section.items?.forEach((item: any, itemIndex: number) => {
                if (!item.is_optional) {
                    // Always include non-optional items
                    total += item.price * item.quantity;
                } else if (selectedOptionalItems.has(itemIndex)) {
                    // Include selected optional items
                    total += item.price * item.quantity;
                }
            });
        });

        return total;
    }, [offer, selectedOptionalItems, selectedPackageIndex, templateData, splitPackageCounts, isCommunion]);

    // Total Children Count Helper
    const totalChildren = useMemo(() => {
        return Object.values(splitPackageCounts).reduce((a, b) => a + b, 0);
    }, [splitPackageCounts]);

    const updateSplitCount = (index: number, delta: number) => {
        setSplitPackageCounts(prev => {
            const current = prev[index] || 0;
            const newVal = Math.max(0, current + delta);
            if (newVal === 0) {
                const newObj = { ...prev };
                delete newObj[index];
                return newObj;
            }
            return { ...prev, [index]: newVal };
        });
    };

    const setSplitCountDirect = (index: number, val: string) => {
        const num = parseInt(val) || 0;
        setSplitPackageCounts(prev => ({ ...prev, [index]: Math.max(0, num) }));
    };

    const toggleOptionalItem = (itemIndex: number) => {
        setSelectedOptionalItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemIndex)) {
                newSet.delete(itemIndex);
            } else {
                newSet.add(itemIndex);
            }
            return newSet;
        });
    };

    // Prepare Client Selection Data
    const getClientSelection = () => {
        const selection: any = {
            selectedOptionalItems: Array.from(selectedOptionalItems),
            totalPrice: calculatedTotal
        };

        if (isCommunion) {
            selection.childCount = totalChildren; // Total count
            selection.splitPackageCounts = splitPackageCounts; // Detailed breakdown

            // Map to readable package names for Admin clarity
            selection.packagesBreakdown = Object.entries(splitPackageCounts).map(([idx, count]) => ({
                name: templateData.pricingHeaders[parseInt(idx)],
                price: templateData.footerPrices[parseInt(idx)],
                count: count,
                subtotal: (parseInt(templateData.footerPrices[parseInt(idx)].replace(/[^0-9]/g, '')) || 0) * count
            }));
        }

        if (!isCommunion && selectedPackageIndex !== null && templateData) {
            selection.selectedPackage = {
                index: selectedPackageIndex,
                name: templateData.pricingHeaders[selectedPackageIndex],
                price: templateData.footerPrices[selectedPackageIndex]
            };
        }
        return selection;
    };

    const handleAction = async (action: string) => {
        try {
            const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
            if (!token) {
                router.push('/logowanie');
                return;
            }

            // Validate selection before acceptance
            // Validate selection before acceptance
            if (action === 'accept') {
                if (isCommunion) {
                    if (totalChildren === 0) {
                        alert('Proszę wprowadzić liczbę dzieci dla przynajmniej jednego pakietu.');
                        document.querySelector('.offer-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        return;
                    }
                } else if (templateData?.pricingHeaders?.length > 1 && selectedPackageIndex === null) {
                    alert('Proszę wybrać pakiet przed zaakceptowaniem oferty.');
                    document.querySelector('.offer-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }

            setSubmitting(true);

            const response = await fetch(`/api/client/portal/offers/${offerId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action,
                    message: negotiationMessage,
                    client_selection: action === 'accept' ? getClientSelection() : undefined
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setOffer(data.offer);
                setNegotiationMessage('');
                setShowNegotiationForm(false);
            }
        } catch (error) {
            console.error('Error updating offer:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSignature = async (signatureData: string, metadata: any) => {
        // TODO: Send signature to API
        console.log('Signature captured:', metadata);
        setShowSignaturePad(false);
        handleAction('accept');
    };

    const handleUnlockRequest = async () => {
        try {
            const token = localStorage.getItem('client_token') || localStorage.getItem('user_token');
            if (!token) return;

            setSubmitting(true);
            const response = await fetch(`/api/client/portal/offers/${offerId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    action: 'request_unlock'
                }),
            });

            if (response.ok) {
                setUnlockRequested(true);
            }
        } catch (error) {
            console.error('Error requesting unlock:', error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-400 border-t-transparent mx-auto mb-6"></div>
                    <p className="text-white text-lg font-medium">Ładowanie oferty...</p>
                </div>
            </div>
        );
    }

    if (!offer) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-white text-2xl font-bold mb-2">Oferta nie znaleziona</p>
                    <p className="text-slate-300 mb-6">Sprawdź czy link jest poprawny</p>
                    <Link href="/konto">
                        <button className="px-8 py-3 bg-gold-500 text-black rounded-lg hover:bg-gold-400 font-bold transition-all">
                            ← Wróć do pulpitu
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const isPending = offer.status === 'sent' || offer.status === 'pending';
    const canAccept = isPending;
    const canReject = isPending;
    const canNegotiate = isPending;
    const isB2B = offer.type === 'b2b';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Immersive Hero Header */}
            <header className={`${isB2B ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900' : 'bg-gradient-to-r from-gold-600 via-amber-600 to-gold-600'} text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <Link href="/konto">
                            <button className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                                <span>←</span> Wróć do pulpitu ("Oferty i Umowy")
                            </button>
                        </Link>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${isPending ? 'bg-blue-500' :
                            offer.status === 'accepted' ? 'bg-green-500' : 'bg-gray-500'
                            }`}>
                            {isPending && '📨 Oczekuje na akcję'}
                            {offer.status === 'accepted' && '✅ Zaakceptowana'}
                            {offer.status === 'rejected' && '❌ Odrzucona'}
                        </span>
                    </div>

                    <div className="mb-4">
                        <p className="text-white/70 text-sm mb-2">Oferta przygotowana specjalnie dla Ciebie</p>
                        <h1 className="text-5xl font-bold mb-4">{offer.title}</h1>
                        <p className="text-white/90 text-lg">
                            {isB2B ? 'Propozycja współpracy biznesowej' : 'Twoja wymarzona sesja fotograficzna'}
                        </p>
                    </div>

                    <div className="flex gap-4 mt-8">
                        <a
                            href={pdfUrl}
                            target="_blank"
                            className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 font-medium transition-all flex items-center gap-2 border border-white/20"
                        >
                            📄 Pobierz PDF
                        </a>
                        {offer.contract && (
                            <Link href={`/strefa-klienta/umowy/${offer.contract.id}`}>
                                <button className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold transition-all shadow-lg">
                                    📝 Zobacz Umowę
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Price Summary Card (Sticky) */}
                <div className="sticky top-4 z-20 mb-8">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">
                                    {isCommunion ? 'Przewidywany koszt całkowity' : 'Łączna wartość oferty'}
                                </p>
                                <p className="text-4xl font-bold bg-gradient-to-r from-gold-600 to-amber-600 bg-clip-text text-transparent">
                                    {calculatedTotal.toLocaleString('pl-PL')} PLN
                                </p>
                                {isCommunion && (
                                    <p className="text-xs text-slate-500 mt-1 font-bold">
                                        Wybrano łącznie: {totalChildren} dzieci
                                    </p>
                                )}
                            </div>

                            {/* Communion: Helper Text */}
                            {isCommunion && (
                                <div className="ml-8 px-4 py-2 bg-blue-50/50 rounded-lg border border-blue-100 text-sm text-blue-800 max-w-xs text-center hidden md:block">
                                    <span className="font-bold block mb-1">📢 Instrukcja</span>
                                    Wpisz liczbę dzieci pod odpowiednimi pakietami w tabeli poniżej.
                                </div>
                            )}

                            {offer.valid_until && (
                                <div className="text-right">
                                    <p className="text-sm text-slate-600 mb-1">Ważna do</p>
                                    <p className="text-lg font-semibold text-slate-900">
                                        {new Date(offer.valid_until).toLocaleDateString('pl-PL')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* TEMPLATE DATA RENDERER (A4 Style) */}
                {offer.template_data ? (
                    <div className="flex justify-center mb-12">
                        <div className="relative w-full max-w-[210mm] bg-white shadow-2xl overflow-hidden text-[#333]">
                            <style>{`
                                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@300;400;600;700&display=swap');
                                
                                .a4-preview {
                                    width: 100%;
                                    padding: 10mm 15mm;
                                    background: white;
                                    font-family: 'Montserrat', sans-serif;
                                    color: #333;
                                    line-height: 1.35;
                                    box-sizing: border-box;
                                }

                                .offer-header { display: flex; justify-content: space-between; border-bottom: 3px solid #c5a059; padding-bottom: 10px; margin-bottom: 12px; }
                                .offer-h1 { font-family: 'Playfair Display', serif; color: #1a1a1a; font-size: 24px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                                .offer-accent { color: #c5a059; font-weight: 600; letter-spacing: 1px; font-size: 14px; }
                                .offer-my-data { font-size: 12px; color: #7f8c8d; text-align: right; }
                                .offer-my-data b { color: #1a1a1a; font-size: 14px; display: block; margin-bottom: 2px; }
                                
                                .offer-event-info { background: #f4efe6; padding: 12px; border-radius: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 12px; }
                                
                                .offer-h2 { font-family: 'Playfair Display', serif; font-size: 18px; color: #1a1a1a; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 16px; margin-bottom: 8px; }
                                
                                .offer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 5px; }
                                .offer-prep-item { font-size: 12px; }
                                .offer-prep-item b { color: #1a1a1a; display: block; margin-bottom: 2px; }

                                .offer-list { list-style: none; padding: 0; margin: 0; }
                                .offer-list li { padding-left: 20px; position: relative; margin-bottom: 4px; font-size: 12px; }
                                .offer-list li::before { content: "✓"; position: absolute; left: 0; color: #c5a059; font-weight: bold; }

                                .offer-table { width: 100%; border-collapse: collapse; margin: 15px 0 12px 0; table-layout: fixed; }
                                .offer-th { background: #f8f8f8; padding: 8px 6px; font-size: 11px; border: 1px solid #eee; position: relative; vertical-align: bottom; text-align: center; }
                                .offer-th.left { text-align: left; padding-left: 10px; }
                                .offer-th.rec { padding-top: 32px; background: #f4efe6; border: 2px solid #c5a059; border-bottom: 1px solid #c5a059; }
                                .offer-th.selected-package { background: #f0fdf4; border: 2px solid #16a34a; border-bottom: 1px solid #16a34a; color: #15803d; }
                                
                                .offer-td { padding: 8px 6px; text-align: center; border: 1px solid #eee; font-size: 12px; vertical-align: middle; }
                                .offer-td.left { text-align: left; padding-left: 10px; }
                                .offer-td.rec { border-left: 2px solid #c5a059; border-right: 2px solid #c5a059; background: #f4efe6; }
                                .offer-td.selected-package-cell { border-left: 2px solid #16a34a; border-right: 2px solid #16a34a; background: #f0fdf4; }
                                .offer-td.selected-package-footer { border: 2px solid #16a34a; border-top: 1px solid #16a34a; background: #f0fdf4; color: #15803d; font-weight: bold; }
                                
                                .rec-label { position: absolute; top: 6px; left: 50%; transform: translateX(-50%); background: #c5a059; color: white; padding: 2px 8px; font-size: 9px; font-weight: bold; border-radius: 3px; text-transform: uppercase; white-space: nowrap; width: 85%; }
                                
                                .price-tag { font-size: 14px; font-weight: bold; color: #1a1a1a; display: block; margin-top: 2px; }
                                
                                .desc-box { background: #fff; border: 1px solid #eee; padding: 12px; margin-top: 10px; font-size: 12px; border-left: 4px solid #c5a059; }
                                
                                .offer-footer { text-align: center; font-size: 10px; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 12px; margin-top: 20px; }
                                
                                @media (max-width: 768px) {
                                  .offer-header { flex-direction: column; text-align: center; }
                                  .offer-my-data { text-align: center; margin-top: 10px; }
                                  .offer-grid, .offer-event-info { grid-template-columns: 1fr; }
                                }
                            `}</style>

                            <div className="a4-preview">
                                <header className="offer-header">
                                    <div>
                                        <h1 className="offer-h1">{offer.template_data.title}</h1>
                                        <div className="offer-accent">{offer.template_data.subtitle}</div>
                                    </div>
                                    <div className="offer-my-data">
                                        <b>{contactName}</b>
                                        {offer.template_data.contactLocation}<br />
                                        Tel: {offer.template_data.contactPhone}<br />
                                        {offer.template_data.contactEmail}
                                    </div>
                                </header>

                                {sectionVisibility.eventInfo && (
                                    <div className="offer-event-info">
                                        <div><b>{offer.template_data.labels.location}:</b> {offer.template_data.eventLocation}</div>
                                        <div><b>{offer.template_data.labels.date}:</b> {offer.template_data.eventDate}</div>
                                        <div><b>{offer.template_data.labels.count}:</b> {offer.template_data.eventCount}</div>
                                        <div><b>{offer.template_data.labels.team}:</b> {offer.template_data.eventTeam}</div>
                                    </div>
                                )}

                                {sectionVisibility.preparations && (
                                    <>
                                        <h2 className="offer-h2">{offer.template_data.sectionTitles.preparations}</h2>
                                        <div className="offer-grid">
                                            <div className="offer-prep-item">
                                                <b>{offer.template_data.labels.prepBefore}:</b>
                                                {offer.template_data.preparations.before}
                                            </div>
                                            <div className="offer-prep-item">
                                                <b>{offer.template_data.labels.prepDay}:</b>
                                                {offer.template_data.preparations.dayOf}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {sectionVisibility.features && (
                                    <>
                                        <h2 className="offer-h2">{offer.template_data.sectionTitles.standards}</h2>
                                        <ul className="offer-list">
                                            {offer.template_data.features.map((f: string, i: number) => (
                                                <li key={i} dangerouslySetInnerHTML={{ __html: f.replace(':', ':</b>').replace(/^/, '<b>') }} />
                                            ))}
                                        </ul>
                                    </>
                                )}

                                {sectionVisibility.pricing && (
                                    <div className="overflow-x-auto">
                                        <table className="offer-table">
                                            <thead>
                                                <tr>
                                                    {offer.template_data.pricingHeaders.map((header: string, idx: number) => {
                                                        const isRec = idx === offer.template_data.recommendationColumnIndex;
                                                        // First column is usually labels, others are packages
                                                        const isPackageColumn = idx > 0;
                                                        const isSelected = selectedPackageIndex === idx;

                                                        return (
                                                            <th
                                                                key={idx}
                                                                onClick={() => {
                                                                    // Only allow selecting via radio/click if NOT communion or if logic requires it
                                                                    // For communion, selection is implied by child count > 0, so we disable column selection to avoid confusion
                                                                    if (!isCommunion && isPackageColumn) {
                                                                        setSelectedPackageIndex(idx);
                                                                    }
                                                                }}
                                                                className={`offer-th ${idx === 0 ? 'left' : ''} ${isRec ? 'rec' : ''} ${isSelected ? 'selected-package' : ''} ${!isCommunion && isPackageColumn ? 'cursor-pointer hover:bg-gold-50 transition-colors' : ''}`}
                                                                style={{ width: `${100 / offer.template_data.pricingHeaders.length}%` }}
                                                            >
                                                                {isRec && <div className="rec-label">{offer.template_data.recommendationLabel}</div>}
                                                                <div className="flex flex-col items-center justify-center gap-2">
                                                                    {header}
                                                                    {/* Hide Radio Button for Communion to avoid confusion */}
                                                                    {!isCommunion && isPackageColumn && (
                                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-gold-600 bg-gold-600' : 'border-slate-300'}`}>
                                                                            {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </th>
                                                        );
                                                    })}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* Make row cells click-through to selection too, for UX */}
                                                {offer.template_data.pricingRows.map((row: any, i: number) => (
                                                    <tr key={i}>
                                                        {row.values.map((val: string, colIdx: number) => {
                                                            const isRec = colIdx === offer.template_data.recommendationColumnIndex;
                                                            const isHeader = row.isHeader;
                                                            const displayVal = isHeader ? `<b>${val}</b>` : val;
                                                            const isSelected = selectedPackageIndex === colIdx;

                                                            return (
                                                                <td
                                                                    key={colIdx}
                                                                    onClick={() => {
                                                                        if (!isCommunion && colIdx > 0) {
                                                                            setSelectedPackageIndex(colIdx);
                                                                        }
                                                                    }}
                                                                    className={`offer-td ${colIdx === 0 ? 'left' : ''} ${isRec ? 'rec' : ''} ${isSelected ? 'selected-package-cell' : ''} ${!isCommunion && colIdx > 0 ? 'cursor-pointer' : ''}`}
                                                                    dangerouslySetInnerHTML={{ __html: displayVal }}
                                                                />
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                                <tr>
                                                    {offer.template_data.footerPrices.map((price: string, idx: number) => {
                                                        const isRec = idx === offer.template_data.recommendationColumnIndex;
                                                        const isSelected = selectedPackageIndex === idx;
                                                        return (
                                                            <td
                                                                key={idx}
                                                                onClick={() => idx > 0 && setSelectedPackageIndex(idx)}
                                                                className={`offer-td ${idx === 0 ? 'left' : ''} ${isRec ? 'rec' : ''} ${isSelected ? 'selected-package-footer' : ''} ${idx > 0 ? 'cursor-pointer hover:bg-gold-50' : ''}`}
                                                            >
                                                                {idx === 0 ? price : <span className="price-tag">{price}</span>}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                                {/* Communion: Input Row for Split Counts */}
                                                {isCommunion && (
                                                    <tr className="bg-blue-50/50 border-t-2 border-blue-100">
                                                        <td className="offer-td left font-bold text-blue-900">
                                                            Liczba dzieci
                                                        </td>
                                                        {offer.template_data.footerPrices.map((_: string, idx: number) => {
                                                            if (idx === 0) return null; // Skip label col
                                                            const count = splitPackageCounts[idx] || 0;
                                                            return (
                                                                <td key={`split-${idx}`} className="offer-td p-2">
                                                                    <div className="flex flex-col items-center gap-2">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); updateSplitCount(idx, -1); }}
                                                                                disabled={!isPending} // Disable if accepted/rejected
                                                                                className={`w-6 h-6 rounded bg-white shadow text-blue-600 font-bold hover:bg-blue-100 ${!isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >-</button>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                value={count}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                onChange={(e) => setSplitCountDirect(idx, e.target.value)}
                                                                                disabled={!isPending}
                                                                                className={`w-12 text-center border border-blue-200 rounded p-1 text-sm font-bold bg-white ${!isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            />
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); updateSplitCount(idx, 1); }}
                                                                                disabled={!isPending}
                                                                                className={`w-6 h-6 rounded bg-white shadow text-blue-600 font-bold hover:bg-blue-100 ${!isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >+</button>
                                                                        </div>
                                                                        {count > 0 && (
                                                                            <span className="text-[10px] text-blue-800 font-bold">
                                                                                {(count * (parseInt(offer.template_data.footerPrices[idx].replace(/[^0-9]/g, '')) || 0)).toLocaleString()} PLN
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {sectionVisibility.album && (
                                    <div className="desc-box">
                                        <b>{offer.template_data.labels.albumAdvantage}:</b><br />
                                        {offer.template_data.albumDescription}
                                    </div>
                                )}

                                {sectionVisibility.delivery && (
                                    <>
                                        <h2 className="offer-h2">{offer.template_data.sectionTitles.delivery}</h2>
                                        <ul className="offer-list" style={{ marginBottom: '20px' }}>
                                            {Object.values(offer.template_data.deliveryTerms).map((t: any, i: number) => (
                                                <li key={i} dangerouslySetInnerHTML={{ __html: String(t).replace(':', ':</b>').replace(/^/, '<b>') }} />
                                            ))}
                                        </ul>
                                    </>
                                )}

                                <div className="offer-footer" dangerouslySetInnerHTML={{ __html: `${offer.template_data.labels.footerDisclaimer}<br><b>${offer.template_data.footerCompany}</b>` }} />
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Sections & Packages (LEGACY RENDERER) */
                    offer.sections?.map((section: any, sectionIndex: number) => (
                        <div key={sectionIndex} className="mb-8">
                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                                {/* Section Header */}
                                <div className={`${isB2B ? 'bg-gradient-to-r from-slate-800 to-slate-700' : 'bg-gradient-to-r from-amber-600 to-gold-600'} px-8 py-6`}>
                                    <h2 className="text-2xl font-bold text-white mb-2">{section.title}</h2>
                                    {section.description && (
                                        <p className="text-white/80">{section.description}</p>
                                    )}
                                </div>

                                {/* Items */}
                                <div className="p-8">
                                    <div className="grid gap-4">
                                        {section.items?.map((item: any, itemIndex: number) => {
                                            const globalIndex = sectionIndex * 100 + itemIndex; // Unique ID
                                            const isSelected = item.is_optional ? selectedOptionalItems.has(globalIndex) : true;

                                            return (
                                                <div
                                                    key={itemIndex}
                                                    className={`p-6 rounded-xl border-2 transition-all ${isSelected
                                                        ? 'border-gold-400 bg-gold-50'
                                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                                        } ${item.is_optional ? 'cursor-pointer' : ''}`}
                                                    onClick={() => item.is_optional && toggleOptionalItem(globalIndex)}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {item.is_optional && (
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isSelected}
                                                                        onChange={() => toggleOptionalItem(globalIndex)}
                                                                        className="w-5 h-5 text-gold-600 rounded focus:ring-2 focus:ring-gold-500"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                )}
                                                                <h3 className="text-lg font-bold text-slate-900">
                                                                    {item.title}
                                                                </h3>
                                                                {item.is_optional && (
                                                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                                                        OPCJONALNIE
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.description && (
                                                                <p className="text-slate-600 text-sm mb-3">{item.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <span className="text-slate-500">
                                                                    Ilość: <strong className="text-slate-900">{item.quantity}</strong>
                                                                </span>
                                                                <span className="text-slate-500">
                                                                    Cena jedn.: <strong className="text-slate-900">{item.price.toLocaleString('pl-PL')} PLN</strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right ml-6">
                                                            <p className="text-2xl font-bold text-slate-900">
                                                                {(item.price * item.quantity).toLocaleString('pl-PL')} PLN
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )
                }

                {/* Negotiations History */}
                {
                    offer.negotiations && offer.negotiations.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                💬 Historia negocjacji
                            </h3>
                            <div className="space-y-4">
                                {offer.negotiations.map((negotiation: any, index: number) => (
                                    <div key={index} className="p-5 bg-slate-50 rounded-xl border border-slate-200">
                                        <p className="text-slate-700 mb-2">{negotiation.message}</p>
                                        <p className="text-sm text-slate-500">
                                            {new Date(negotiation.created_at).toLocaleDateString('pl-PL', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {/* Negotiation Form */}
                {
                    showNegotiationForm && (
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-4">Negocjuj ofertę</h3>
                            <p className="text-gray-600 mb-4 text-sm">
                                Wybierz elementy, które chcesz negocjować lub po prostu napisz wiadomość.
                            </p>

                            <textarea
                                value={negotiationMessage}
                                onChange={(e) => setNegotiationMessage(e.target.value)}
                                placeholder="Wpisz swoją wiadomość, uzasadnienie lub proponowane zmiany..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 text-black"
                                rows={4}
                            />

                            {/* Optional: Negotiation amount input could go here if needed */}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleAction('negotiate')}
                                    disabled={submitting || !negotiationMessage.trim()}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {submitting ? 'Wysyłanie...' : 'Wyślij propozycję'}
                                </button>
                                <button
                                    onClick={() => setShowNegotiationForm(false)}
                                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )
                }

                {/* Actions */}
                {
                    (canAccept || canReject || canNegotiate) && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Akcje</h3>
                            <div className="flex flex-wrap gap-3">
                                {canAccept && (
                                    <button
                                        onClick={() => handleAction('accept')}
                                        disabled={submitting}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
                                    >
                                        ✓ Zaakceptuj
                                    </button>
                                )}
                                {canReject && (
                                    <button
                                        onClick={() => handleAction('reject')}
                                        disabled={submitting}
                                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-semibold"
                                    >
                                        ✗ Odrzuć
                                    </button>
                                )}
                                {canNegotiate && (
                                    <button
                                        onClick={() => setShowNegotiationForm(!showNegotiationForm)}
                                        className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold"
                                    >
                                        💬 Negocjuj
                                    </button>
                                )}
                                {offer.pdf_url && (
                                    <a
                                        href={offer.pdf_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 font-semibold border border-zinc-700 flex items-center gap-2"
                                    >
                                        <FileText className="w-5 h-5" />
                                        Pobierz ofertę
                                    </a>
                                )}
                                {offer.status === 'accepted' && offer.pdf_url && (
                                    <a
                                        href={offer.pdf_url.replace(/\.pdf$/, '_zatwierdzona.pdf')}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold border border-green-700 flex items-center gap-2"
                                    >
                                        <FileText className="w-5 h-5" />
                                        Pobierz ofertę po zatwierdzeniu
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                }

                {/* Request Unlock (If accepted/rejected) */}
                {
                    (offer.status === 'accepted' || offer.status === 'rejected') && (
                        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Zauważyłeś błąd?</h3>
                            <p className="text-gray-600 mb-4 text-sm">
                                Wybrałeś zły pakiet lub chcesz zmienić liczbę osób, a oferta jest już zablokowana?
                                Możesz poprosić o ponowne odblokowanie opcji wyboru.
                            </p>
                            {unlockRequested ? (
                                <div className="px-6 py-3 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium inline-block">
                                    ✓ Prośba o odblokowanie została wysłana do administratora. Oczekuj na email.
                                </div>
                            ) : (
                                <button
                                    onClick={handleUnlockRequest}
                                    disabled={submitting}
                                    className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-gray-400 font-semibold"
                                >
                                    {submitting ? 'Wysyłanie...' : 'Poproś o odblokowanie edycji'}
                                </button>
                            )}
                        </div>
                    )
                }
            </main >
        </div >
    );
}
