'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SignaturePad from '@/components/SignaturePad';

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [negotiationMessage, setNegotiationMessage] = useState('');
    const [showNegotiationForm, setShowNegotiationForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showSignaturePad, setShowSignaturePad] = useState(false);

    // Interactive package selection
    const [selectedOptionalItems, setSelectedOptionalItems] = useState<Set<number>>(new Set());

    const [offerId, setOfferId] = useState<string | null>(null);

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
            const token = localStorage.getItem('client_token');
            if (!token) {
                router.push('/strefa-klienta/login');
                return;
            }

            const response = await fetch(`/api/client/portal/offers/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                setOffer(data.offer);
            } else if (response.status === 401) {
                router.push('/strefa-klienta/login');
            }
        } catch (error) {
            console.error('Error fetching offer:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate total price based on selected items
    const calculatedTotal = useMemo(() => {
        if (!offer) return 0;

        let total = 0;
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
    }, [offer, selectedOptionalItems]);

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

    const handleAction = async (action: string) => {
        try {
            const token = localStorage.getItem('client_token');
            if (!token) {
                router.push('/strefa-klienta/login');
                return;
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
                    <Link href="/strefa-klienta/dashboard">
                        <button className="px-8 py-3 bg-gold-500 text-black rounded-lg hover:bg-gold-400 font-bold transition-all">
                            ← Wróć do pulpitu
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    const canAccept = offer.status === 'sent';
    const canReject = offer.status === 'sent';
    const canNegotiate = offer.status === 'sent';
    const isB2B = offer.type === 'b2b';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Immersive Hero Header */}
            <header className={`${isB2B ? 'bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900' : 'bg-gradient-to-r from-gold-600 via-amber-600 to-gold-600'} text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="max-w-6xl mx-auto px-6 py-16 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <Link href="/strefa-klienta/dashboard">
                            <button className="text-white/80 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                                <span>←</span> Wróć do pulpitu
                            </button>
                        </Link>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${offer.status === 'sent' ? 'bg-blue-500' :
                            offer.status === 'accepted' ? 'bg-green-500' : 'bg-gray-500'
                            }`}>
                            {offer.status === 'sent' && '📨 Oczekuje na akcję'}
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
                            href={`/api/offers/${offer.id}/pdf`}
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
                                <p className="text-sm text-slate-600 mb-1">Łączna wartość oferty</p>
                                <p className="text-4xl font-bold bg-gradient-to-r from-gold-600 to-amber-600 bg-clip-text text-transparent">
                                    {calculatedTotal.toLocaleString('pl-PL')} PLN
                                </p>
                            </div>
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

                {/* Sections & P acka ges */}
                {offer.sections?.map((section: any, sectionIndex: number) => (
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
                ))}

                {/* Negotiations History */}
                {offer.negotiations && offer.negotiations.length > 0 && (
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
                )}

                {/* Negotiation Form */}
                {showNegotiationForm && (
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
                )}

                {/* Actions */}
                {(canAccept || canReject || canNegotiate) && (
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
                )}
            </main>
        </div>
    );
}
