'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';
import SignaturePad from '@/components/SignaturePad';
import ClientOfferAddonCheckbox, { type OfferAddon } from '@/components/client/ClientOfferAddonCheckbox';
import ClientStyleGuidePanel from '@/components/StyleGuide/ClientStyleGuidePanel';
import FamilyOfferVoucherPreview from '@/components/offers/FamilyOfferVoucherPreview';

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
    const [adultCount, setAdultCount] = useState<number>(0);
    const [familyChildCount, setFamilyChildCount] = useState<number>(0);
    const [familyVoucherEnabled, setFamilyVoucherEnabled] = useState(false);
    const [voucherSenderName, setVoucherSenderName] = useState('');
    const [voucherRecipientName, setVoucherRecipientName] = useState('Rodzice');
    const [voucherPackageName, setVoucherPackageName] = useState('');
    const [voucherPriceLabel, setVoucherPriceLabel] = useState('');
    const [voucherSessionDate, setVoucherSessionDate] = useState('');
    const [voucherSessionTime, setVoucherSessionTime] = useState('');
    const [voucherLocation, setVoucherLocation] = useState('');
    const [voucherHidePrice, setVoucherHidePrice] = useState(false);
    const [offerId, setOfferId] = useState<string | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string>('#');
    const [selectedAddons, setSelectedAddons] = useState<OfferAddon[]>([]);

    const getPreferredToken = () => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('user_token') || localStorage.getItem('client_token') || '';
    };

    const isCommunion = offer?.category?.toLowerCase() === 'komunia';
    const isFamilySession = (offer?.category || '').toLowerCase().includes('rodzin') || (offer?.category || '').toLowerCase() === 'family';

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
            const token = getPreferredToken();
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
                // Restore client selection state when offer was already accepted
                if (data.offer.client_selection) {
                    const cs = data.offer.client_selection;
                    // Restore split counts for communion
                    if (cs.splitPackageCounts) {
                        setSplitPackageCounts(cs.splitPackageCounts);
                    } else if (cs.childCount) {
                        setChildCount(cs.childCount);
                    }
                    if (cs.groupBreakdown) {
                        setAdultCount(Number(cs.groupBreakdown.adults) || 0);
                        setFamilyChildCount(Number(cs.groupBreakdown.children) || 0);
                    }
                    if (cs.familyVoucher) {
                        setFamilyVoucherEnabled(!!cs.familyVoucher.enabled);
                        setVoucherSenderName(cs.familyVoucher.senderName || '');
                        setVoucherRecipientName(cs.familyVoucher.recipientName || 'Rodzice');
                        setVoucherPackageName(cs.familyVoucher.packageName || '');
                        setVoucherPriceLabel(cs.familyVoucher.packagePriceLabel || '');
                        setVoucherSessionDate(cs.familyVoucher.sessionDate || '');
                        setVoucherSessionTime(cs.familyVoucher.sessionTime || '');
                        setVoucherLocation(cs.familyVoucher.location || '');
                        setVoucherHidePrice(!!cs.familyVoucher.hidePrice);
                    }
                    // Restore selected package for standard offers
                    if (cs.selectedPackage?.index !== undefined) {
                        setSelectedPackageIndex(cs.selectedPackage.index);
                    }
                }

                if (!data.offer.client_selection?.familyVoucher) {
                    setVoucherSenderName(data.offer?.template_data?.contactName || '');
                }

                // Prepare PDF URL with token
                const authToken = getPreferredToken();
                if (authToken) {
                    setPdfUrl(`/api/offers/${id}/pdf?token=${authToken}`);
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

        // 3. Add selected album addons
        selectedAddons.forEach(a => { total += (a.final_price || 0); });

        return total;
    }, [offer, selectedOptionalItems, selectedPackageIndex, templateData, splitPackageCounts, isCommunion, selectedAddons]);

    // Total Children Count Helper
    const totalChildren = useMemo(() => {
        return Object.values(splitPackageCounts).reduce((a, b) => a + b, 0);
    }, [splitPackageCounts]);

    const totalFamilyParticipants = useMemo(() => {
        return Math.max(0, adultCount) + Math.max(0, familyChildCount);
    }, [adultCount, familyChildCount]);

    const selectedPackageName = useMemo(() => {
        if (selectedPackageIndex === null || !templateData?.pricingHeaders) return '';
        return templateData.pricingHeaders[selectedPackageIndex] || '';
    }, [selectedPackageIndex, templateData]);

    const selectedPackagePriceLabel = useMemo(() => {
        if (selectedPackageIndex === null || !templateData?.footerPrices) return '';
        return templateData.footerPrices[selectedPackageIndex] || '';
    }, [selectedPackageIndex, templateData]);

    const familyVoucherCode = useMemo(() => {
        const raw = `${offer?.id || 'offer'}-${selectedPackageIndex || 0}-${voucherSenderName}-${voucherRecipientName}-${adultCount}-${familyChildCount}`;
        let hash = 0;
        for (let index = 0; index < raw.length; index += 1) {
            hash = ((hash << 5) - hash) + raw.charCodeAt(index);
            hash |= 0;
        }
        return Math.abs(hash).toString(36).toUpperCase().slice(0, 6).padEnd(6, 'X');
    }, [adultCount, familyChildCount, offer?.id, selectedPackageIndex, voucherRecipientName, voucherSenderName]);

    const resolvedVoucherPackageName = voucherPackageName || selectedPackageName || 'Do wyboru';
    const resolvedVoucherPriceLabel = voucherPriceLabel || selectedPackagePriceLabel || 'Do ustalenia';
    const resolvedVoucherSessionDate = voucherSessionDate || String(templateData?.eventDate || 'Termin do uzgodnienia');
    const resolvedVoucherSessionTime = voucherSessionTime || String(templateData?.sessionTime || templateData?.eventTime || 'Godzina do uzgodnienia');
    const resolvedVoucherLocation = voucherLocation || String(templateData?.eventLocation || 'Lokalizacja do uzgodnienia');

    const familyVoucherPdfUrl = useMemo(() => {
        if (!offerId || !familyVoucherEnabled || !selectedPackageName) return null;
        const token = getPreferredToken();
        const params = new URLSearchParams({
            senderName: voucherSenderName || (templateData?.contactName || ''),
            recipientName: voucherRecipientName || 'Rodzice',
            packageName: resolvedVoucherPackageName,
            packagePriceLabel: resolvedVoucherPriceLabel,
            hidePrice: voucherHidePrice ? '1' : '0',
            sessionDate: resolvedVoucherSessionDate,
            sessionTime: resolvedVoucherSessionTime,
            location: resolvedVoucherLocation,
            verificationCode: familyVoucherCode,
            ...(token ? { token } : {}),
        });
        return `/api/client/portal/offers/${offerId}/family-voucher?${params.toString()}`;
    }, [familyVoucherCode, familyVoucherEnabled, offerId, resolvedVoucherLocation, resolvedVoucherPackageName, resolvedVoucherPriceLabel, resolvedVoucherSessionDate, resolvedVoucherSessionTime, templateData, voucherHidePrice, voucherRecipientName, voucherSenderName, selectedPackageName]);

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

        if (isFamilySession && totalFamilyParticipants > 0) {
            selection.groupBreakdown = {
                adults: Math.max(0, adultCount),
                children: Math.max(0, familyChildCount),
                total: totalFamilyParticipants,
            };
        }

        if (isFamilySession && familyVoucherEnabled && selectedPackageName) {
            selection.familyVoucher = {
                enabled: true,
                senderName: voucherSenderName || (templateData?.contactName || ''),
                recipientName: voucherRecipientName || 'Rodzice',
                packageName: resolvedVoucherPackageName,
                packagePriceLabel: resolvedVoucherPriceLabel,
                sessionDate: resolvedVoucherSessionDate,
                sessionTime: resolvedVoucherSessionTime,
                location: resolvedVoucherLocation,
                hidePrice: voucherHidePrice,
                verificationCode: familyVoucherCode,
            };
        }

        return selection;
    };

    const handleAction = async (action: string) => {
        try {
            const token = getPreferredToken();
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
                } else if (isFamilySession && totalFamilyParticipants === 0) {
                    alert('Dla sesji rodzinnej podaj liczbę dorosłych i/lub dzieci.');
                    document.querySelector('.group-composition-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                } else if (templateData?.pricingHeaders?.length > 1 && selectedPackageIndex === null) {
                    alert('Proszę wybrać pakiet przed zaakceptowaniem oferty.');
                    document.querySelector('.offer-table')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            }

            // Validate negotiation message
            if (action === 'negotiate') {
                if (!negotiationMessage.trim()) {
                    alert('Proszę napisać wiadomość przed wysłaniem negocjacji.');
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
                
                if (action === 'negotiate') {
                    // Show success feedback for negotiation
                    alert('✓ Twoja propozycja negocjacji została wysłana do fotografa.');
                    setNegotiationMessage('');
                    setShowNegotiationForm(false);
                } else {
                    setNegotiationMessage('');
                    setShowNegotiationForm(false);
                }
            } else {
                alert('Błąd podczas wysyłania. Spróbuj ponownie.');
            }
        } catch (error) {
            console.error('Error updating offer:', error);
            alert('Błąd połączenia. Spróbuj ponownie.');
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
            const token = getPreferredToken();
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

    const isPending = offer.status === 'sent' || offer.status === 'pending' || offer.status === 'unlock_requested';
    const canAccept = isPending;
    const canReject = isPending;
    const canNegotiate = isPending && (offer.negotiation_enabled !== false);
    const isB2B = offer.type === 'b2b';

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Immersive Hero Header */}
            <header className={`${isB2B ? 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-r from-stone-900 via-amber-900 to-stone-900'} text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5 blur-xl"></div>
                <div className="absolute top-24 right-40 w-24 h-24 rounded-full bg-amber-200/10 blur-lg"></div>
                <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <Link href="/konto">
                            <button className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                                <span>←</span> Wróć do pulpitu ("Oferty i Umowy")
                            </button>
                        </Link>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold border backdrop-blur-sm ${isPending ? 'bg-sky-500/20 border-sky-300/40 text-sky-100' :
                            offer.status === 'accepted' ? 'bg-emerald-500/20 border-emerald-300/40 text-emerald-100' : 'bg-zinc-500/20 border-zinc-300/40 text-zinc-100'
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

                    <div className="flex flex-wrap gap-3 mt-8">
                        <a
                            href={pdfUrl}
                            target="_blank"
                            className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 font-semibold transition-all flex items-center gap-2 border border-white/25"
                        >
                            📄 Pobierz PDF
                        </a>
                        {offer.status === 'accepted' && (
                            <a
                                href={offer.pdf_url && offer.pdf_url.includes('_zatwierdzona')
                                    ? offer.pdf_url
                                    : offer.pdf_url
                                        ? offer.pdf_url.replace(/\.pdf$/, '_zatwierdzona.pdf')
                                        : `/api/offers/${offerId}/pdf?token=${typeof window !== 'undefined' ? (localStorage.getItem('client_token') || localStorage.getItem('user_token') || '') : ''}&accepted=true`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 bg-emerald-500/90 text-white rounded-full hover:bg-emerald-500 font-semibold transition-all flex items-center gap-2 border border-emerald-300/60"
                            >
                                📥 Pobierz zatwierdzoną ofertę
                            </a>
                        )}
                        {offer.contract && (
                            <Link href={`/strefa-klienta/umowy/${offer.contract.id}`}>
                                <button className="px-5 py-2.5 bg-amber-500/90 text-white rounded-full hover:bg-amber-500 font-semibold transition-all border border-amber-300/50">
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
                    <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-600 mb-1">
                                    {isCommunion ? 'Przewidywany koszt całkowity' : 'Łączna wartość oferty'}
                                </p>
                                <p className="text-4xl font-bold bg-gradient-to-r from-gold-600 to-amber-600 bg-clip-text text-transparent">
                                    {calculatedTotal.toLocaleString('pl-PL')} PLN
                                </p>
                                {selectedAddons.length > 0 && (
                                    <p className="text-xs text-emerald-700 mt-1 font-semibold">
                                        ✓ w tym dodatki: +{selectedAddons.reduce((s, a) => s + (a.final_price || 0), 0).toLocaleString('pl-PL')} PLN ({selectedAddons.length} {selectedAddons.length === 1 ? 'album' : 'albumy'})
                                    </p>
                                )}
                                {isCommunion && (
                                    <p className="text-xs text-slate-500 mt-1 font-bold">
                                        Wybrano łącznie: {totalChildren} dzieci
                                    </p>
                                )}
                                {isFamilySession && (
                                    <p className="text-xs text-slate-500 mt-1 font-bold">
                                        Skład grupy: {adultCount} dorosłych + {familyChildCount} dzieci (razem {totalFamilyParticipants})
                                    </p>
                                )}
                            </div>

                            <div className="hidden md:flex items-center justify-center w-28 h-28 rounded-full bg-slate-100 border border-slate-200">
                                <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Oferta</span>
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

                {isFamilySession && (
                    <div className="group-composition-card bg-white rounded-3xl shadow-xl p-6 border border-slate-200 mb-8">
                        <h3 className="text-lg font-bold text-slate-900 mb-3">Skład grupy rodzinnej</h3>
                        <p className="text-sm text-slate-600 mb-4">Podaj liczbę osób, np. 8 dorosłych i 5 dzieci.</p>
                        <div className="grid md:grid-cols-2 gap-4">
                            <label className="text-sm text-slate-700 font-semibold">
                                Dorośli
                                <input
                                    type="number"
                                    min="0"
                                    value={adultCount}
                                    onChange={(e) => setAdultCount(Math.max(0, parseInt(e.target.value) || 0))}
                                    disabled={!isPending}
                                    className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 ${!isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                />
                            </label>
                            <label className="text-sm text-slate-700 font-semibold">
                                Dzieci
                                <input
                                    type="number"
                                    min="0"
                                    value={familyChildCount}
                                    onChange={(e) => setFamilyChildCount(Math.max(0, parseInt(e.target.value) || 0))}
                                    disabled={!isPending}
                                    className={`mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 ${!isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                />
                            </label>
                        </div>
                    </div>
                )}

                {/* ACCEPTED OFFER SUMMARY CARD */}
                {offer.status === 'accepted' && offer.client_selection && offer.template_data && (
                    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 mb-12 max-w-4xl mx-auto mt-8">
                        <div className="flex items-start justify-between mb-6">
                            <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl">✓</span>
                                Podsumowanie zatwierdzonej oferty
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-6">
                            {/* Event Info */}
                            <div>
                                <p className="text-sm text-slate-600 mb-1">📅 Data wydarzenia:</p>
                                <p className="text-2xl font-bold text-slate-900">
                                    {offer.template_data.eventDate || 'Nie podano'}
                                </p>
                            </div>

                            {/* Total Price */}
                            <div>
                                <p className="text-sm text-slate-600 mb-1">💰 Kwota oferty:</p>
                                <p className="text-2xl font-bold text-emerald-700">
                                    {calculatedTotal.toLocaleString('pl-PL')} PLN
                                </p>
                                {selectedAddons.length > 0 && (
                                    <div className="mt-2 text-xs text-slate-700 space-y-0.5">
                                        <p>Pakiet: <strong>{(calculatedTotal - selectedAddons.reduce((s, a) => s + a.final_price, 0)).toLocaleString('pl-PL')} PLN</strong></p>
                                        {selectedAddons.map(a => (
                                            <p key={a.id}>+ Album „{a.album_title}": <strong className="text-emerald-700">{a.final_price.toLocaleString('pl-PL')} PLN</strong></p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Package Details */}
                        {!isCommunion && offer.client_selection.selectedPackage ? (
                            <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Wybrany pakiet</p>
                                <h3 className="text-2xl font-bold text-slate-900 mb-3 flex items-center gap-2">
                                    📦 {offer.client_selection.selectedPackage.name}
                                </h3>
                                <p className="text-lg text-slate-700 mb-4">
                                    Cena: <span className="font-bold text-green-600">{offer.client_selection.selectedPackage.price}</span>
                                </p>
                                
                                {/* Package Features from Template */}
                                {offer.template_data.pricingRows && offer.template_data.pricingRows.length > 0 && (
                                    <div className="bg-white rounded-xl p-4 mt-4 border border-slate-200">
                                        <p className="text-xs font-bold text-slate-600 mb-3">Co zawiera ten pakiet:</p>
                                        <ul className="space-y-2 text-sm text-slate-700">
                                            {offer.template_data.pricingRows.map((row: any, rowIdx: number) => {
                                                const packageIdx = offer.client_selection.selectedPackage.index;
                                                const cellValue = row.values[packageIdx];
                                                // Only show rows with meaningful values (not dashes/empty)
                                                if (cellValue && cellValue !== '–' && cellValue !== '-' && !row.isHeader) {
                                                    const labelCell = row.values[0];
                                                    return (
                                                        <li key={rowIdx} className="flex items-start gap-2">
                                                            <span className="text-green-600 font-bold mt-0.5">✓</span>
                                                            <span><strong>{labelCell}:</strong> {cellValue}</span>
                                                        </li>
                                                    );
                                                }
                                                return null;
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ) : isCommunion && offer.client_selection.splitPackageCounts ? (
                            <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Wybrane pakiety</p>
                                <p className="text-sm text-slate-700 mb-4">Liczba dzieci w poszczególnych pakietach:</p>
                                
                                <div className="grid md:grid-cols-2 gap-4">
                                    {Object.entries(offer.client_selection.splitPackageCounts).map(([idx, count]: [string, any]) => {
                                        const idxNum = parseInt(idx);
                                        if (idxNum === 0) return null; // Skip labels column
                                        const packageName = offer.template_data.pricingHeaders[idxNum];
                                        const packagePrice = offer.template_data.footerPrices[idxNum];
                                        const itemTotal = count > 0 ? count * (parseInt(packagePrice.replace(/[^0-9]/g, '')) || 0) : 0;
                                        
                                        return count > 0 ? (
                                            <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200">
                                                <p className="font-bold text-slate-900">{packageName}</p>
                                                <p className="text-sm text-slate-700 mt-1">
                                                    Dzieci: <strong>{count}</strong> × {packagePrice}
                                                </p>
                                                {itemTotal > 0 && (
                                                    <p className="text-sm font-bold text-blue-700 mt-2">
                                                        Razem: {itemTotal.toLocaleString('pl-PL')} PLN
                                                    </p>
                                                )}
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        ) : isFamilySession && offer.client_selection.groupBreakdown ? (
                            <div className="bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-2 font-bold uppercase">Skład grupy rodzinnej</p>
                                <div className="grid md:grid-cols-3 gap-3 text-sm">
                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                        Dorośli: <strong>{offer.client_selection.groupBreakdown.adults || 0}</strong>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                        Dzieci: <strong>{offer.client_selection.groupBreakdown.children || 0}</strong>
                                    </div>
                                    <div className="bg-white rounded-xl p-4 border border-slate-200">
                                        Razem: <strong>{offer.client_selection.groupBreakdown.total || 0}</strong>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Legend */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-600">
                            <p className="font-semibold text-slate-900 mb-2">ℹ️ Zarządzanie ofertą</p>
                            <ul className="space-y-1 text-xs">
                                <li>✓ Ta oferta została przyjęta i jest konfirmacją twoich wyborów</li>
                                <li>📥 Możesz pobrać zatwierdzoną ofertę w formacie PDF powyżej</li>
                                {offer.contract && <li>📋 Umowa do podpisu znajduje się w sekcji "Umowy"</li>}
                            </ul>
                        </div>
                    </div>
                )}

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

                                {/* Polecane albumy nPhoto - z mozliwoscia wyboru bezposrednio z oferty */}
                                <div style={{ margin: '24px 0' }}>
                                    <ClientOfferAddonCheckbox offerId={offer.id} onAddonsChange={setSelectedAddons} offerStatus={offer.status} />
                                </div>

                                {isFamilySession && (
                                    <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-900 mb-2">Voucher dla rodziców do wydruku</h3>
                                                <p className="text-sm text-slate-600">
                                                    Opcja tylko dla sesji rodzinnych. Po wyborze pakietu voucher aktualizuje się automatycznie i możesz go wydrukować jako prezent.
                                                </p>
                                            </div>
                                            <label className="shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={familyVoucherEnabled}
                                                    onChange={(e) => setFamilyVoucherEnabled(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <span className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 shadow-sm transition-all cursor-pointer peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white peer-checked:shadow-md">
                                                    {familyVoucherEnabled ? 'Voucher włączony' : 'Włącz voucher'}
                                                </span>
                                            </label>
                                        </div>

                                        {familyVoucherEnabled && (
                                            <>
                                                {selectedPackageIndex === null ? (
                                                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-600">
                                                        Najpierw wybierz pakiet w tabeli oferty. Wtedy voucher sam podstawi nazwę pakietu, cenę, termin i lokalizację.
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="grid md:grid-cols-2 gap-4">
                                                            <label className="text-sm font-semibold text-slate-700">
                                                                Od kogo
                                                                <input
                                                                    type="text"
                                                                    value={voucherSenderName}
                                                                    onChange={(e) => setVoucherSenderName(e.target.value)}
                                                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                                                    placeholder="Np. Pani Ola"
                                                                />
                                                            </label>
                                                            <label className="text-sm font-semibold text-slate-700">
                                                                Dla kogo
                                                                <input
                                                                    type="text"
                                                                    value={voucherRecipientName}
                                                                    onChange={(e) => setVoucherRecipientName(e.target.value)}
                                                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                                                    placeholder="Np. Rodzice"
                                                                />
                                                            </label>
                                                            <label className="text-sm font-semibold text-slate-700">
                                                                Nazwa pakietu na voucherze
                                                                <input
                                                                    type="text"
                                                                    value={voucherPackageName}
                                                                    onChange={(e) => setVoucherPackageName(e.target.value)}
                                                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                                                    placeholder={selectedPackageName || 'Np. Pakiet rodzinny'}
                                                                />
                                                            </label>
                                                            <label className="text-sm font-semibold text-slate-700">
                                                                Cena na voucherze
                                                                <input
                                                                    type="text"
                                                                    value={voucherPriceLabel}
                                                                    onChange={(e) => setVoucherPriceLabel(e.target.value)}
                                                                    disabled={voucherHidePrice}
                                                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 disabled:bg-slate-100 disabled:text-slate-400"
                                                                    placeholder={selectedPackagePriceLabel || 'Np. 1350 zł'}
                                                                />
                                                            </label>
                                                            <label className="text-sm font-semibold text-slate-700">
                                                                Data sesji
                                                                <input
                                                                    type="text"
                                                                    value={voucherSessionDate}
                                                                    onChange={(e) => setVoucherSessionDate(e.target.value)}
                                                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                                                    placeholder="Np. 24.05.2026"
                                                                />
                                                                <span className="mt-1 block text-xs font-normal text-slate-500">
                                                                    Format: `DD.MM.RRRR`, np. `24.05.2026`
                                                                </span>
                                                            </label>
                                                            <label className="text-sm font-semibold text-slate-700">
                                                                Godzina sesji
                                                                <input
                                                                    type="text"
                                                                    value={voucherSessionTime}
                                                                    onChange={(e) => setVoucherSessionTime(e.target.value)}
                                                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                                                    placeholder="Np. 17:30"
                                                                />
                                                                <span className="mt-1 block text-xs font-normal text-slate-500">
                                                                    Format: `GG:MM`, np. `17:30`
                                                                </span>
                                                            </label>
                                                            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                                                                Lokalizacja
                                                                <input
                                                                    type="text"
                                                                    value={voucherLocation}
                                                                    onChange={(e) => setVoucherLocation(e.target.value)}
                                                                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
                                                                    placeholder={String(templateData?.eventLocation || 'Lokalizacja do uzgodnienia')}
                                                                />
                                                            </label>
                                                            <label className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 md:col-span-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={voucherHidePrice}
                                                                    onChange={(e) => setVoucherHidePrice(e.target.checked)}
                                                                    className="h-5 w-5 rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                                                                />
                                                                Ukryj cenę na voucherze
                                                            </label>
                                                        </div>

                                                        <FamilyOfferVoucherPreview
                                                            senderName={voucherSenderName || (templateData?.contactName || 'Osoba zamawiająca')}
                                                            recipientName={voucherRecipientName || 'Rodzice'}
                                                            packageName={resolvedVoucherPackageName}
                                                            packagePriceLabel={`${resolvedVoucherPriceLabel}${voucherHidePrice ? '' : ' · opłata zgodnie z wybranym pakietem'}`}
                                                            hidePrice={voucherHidePrice}
                                                            sessionDate={resolvedVoucherSessionDate}
                                                            sessionTime={resolvedVoucherSessionTime}
                                                            location={resolvedVoucherLocation}
                                                            verificationCode={familyVoucherCode}
                                                            qrTarget="https://wlasniewski.pl"
                                                        />

                                                        {familyVoucherPdfUrl && (
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <a
                                                                    href={familyVoucherPdfUrl}
                                                                    download={`voucher-rodzinny-${offerId}.pdf`}
                                                                    className="px-5 py-2.5 rounded-xl bg-gold-500 text-black font-semibold hover:bg-gold-400 transition-colors"
                                                                >
                                                                    Pobierz voucher PDF
                                                                </a>
                                                                <p className="text-sm text-slate-500">
                                                                    Podgląd vouchera widzisz powyżej na żywo. PDF służy tylko do pobrania i wydruku.
                                                                </p>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </>
                                        )}
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
                    offer.negotiations && offer.negotiations.length > 0 && (() => {
                        const sorted = [...offer.negotiations].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                        return (
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                💬 Historia negocjacji ({sorted.length})
                            </h3>
                            <div className="space-y-3 max-h-96 overflow-y-auto bg-slate-50 rounded-xl p-4">
                                {sorted.map((negotiation: any, index: number) => {
                                    const isAdmin = negotiation.sender === 'admin';
                                    return (
                                    <div key={index} className={`rounded-lg p-4 max-w-[85%] shadow-sm hover:shadow-md transition-shadow ${isAdmin ? 'ml-auto bg-blue-50 border border-blue-200' : 'mr-auto bg-white border-l-4 border-blue-400'}`}>
                                        <div className="flex items-baseline justify-between mb-2">
                                            <span className={`text-xs font-bold uppercase tracking-wide ${isAdmin ? 'text-blue-700' : 'text-slate-600'}`}>
                                                {isAdmin ? '📸 Fotograf' : '👤 Twoja wiadomość'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {new Date(negotiation.created_at).toLocaleDateString('pl-PL', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                })} 
                                                <span className="ml-1">{new Date(negotiation.created_at).toLocaleTimeString('pl-PL', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}</span>
                                            </span>
                                        </div>
                                        <p className={`whitespace-pre-wrap leading-relaxed text-sm ${isAdmin ? 'text-blue-900' : 'text-slate-700'}`}>
                                            {negotiation.message}
                                        </p>
                                    </div>
                                    );
                                })}
                            </div>
                        </div>
                        );
                    })()
                }

                {/* Negotiation Form */}
                {
                    showNegotiationForm && (
                        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-slate-200">
                            <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                💬 Negocjuj ofertę
                            </h3>
                            <p className="text-slate-600 mb-6 text-sm">
                                Napisz wiadomość do fotografa z pytaniami, propozycjami zmian lub uzasadnieniem.
                            </p>

                            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-200">
                                <textarea
                                    value={negotiationMessage}
                                    onChange={(e) => setNegotiationMessage(e.target.value)}
                                    placeholder="Wpisz swoją wiadomość, pytania lub proponowane zmiany..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 text-slate-900 placeholder-slate-500 bg-white font-sans"
                                    rows={4}
                                />
                                <div className="text-xs text-slate-500 text-right">
                                    {negotiationMessage.length} znaków
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleAction('negotiate')}
                                    disabled={submitting || !negotiationMessage.trim()}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 font-semibold transition-colors flex items-center gap-2"
                                >
                                    {submitting ? '⏳ Wysyłanie...' : '✉️ Wyślij wiadomość'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowNegotiationForm(false);
                                        setNegotiationMessage('');
                                    }}
                                    className="px-8 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 font-semibold transition-colors"
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
                            </div>
                        </div>
                    )
                }

                {/* Download Buttons - Always Visible */}
                {(offer.pdf_url || offer.status === 'accepted') && (
                    <div className="bg-white rounded-2xl shadow p-6 flex flex-wrap gap-3 border border-slate-200">
                        {offer.pdf_url && (
                            <a
                                href={offer.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 font-semibold border border-slate-800 flex items-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                Pobierz ofertę
                            </a>
                        )}
                        {offer.status === 'accepted' && (
                            <a
                                href={offer.pdf_url && offer.pdf_url.includes('_zatwierdzona')
                                    ? offer.pdf_url
                                    : offer.pdf_url
                                        ? offer.pdf_url.replace(/\.pdf$/, '_zatwierdzona.pdf')
                                        : `/api/offers/${offerId}/pdf?token=${getPreferredToken()}&accepted=true`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 font-semibold border border-emerald-700 flex items-center gap-2"
                            >
                                <FileText className="w-5 h-5" />
                                📥 Pobierz zatwierdzoną ofertę
                            </a>
                        )}
                    </div>
                )}

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

                {/* Style Guide Section - "Jak się ubrać?" */}
                {(offer.status === 'accepted' || isPending) && (
                    <div className="mt-16">
                        <ClientStyleGuidePanel 
                            offerId={offer.id}
                            serviceType={offer.category || offer.template_data?.category}
                            groupSize={totalFamilyParticipants > 0 ? totalFamilyParticipants : (offer.template_data?.eventCount ? parseInt(offer.template_data.eventCount) : undefined)}
                            location={offer.template_data?.eventLocation}
                        />
                    </div>
                )}
            </main >
        </div >
    );
}
