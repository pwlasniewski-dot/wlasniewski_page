'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import OfferBuilder from '@/components/admin/OfferBuilder';
import { MessageCircle, Calendar, User, Send, Shield, UserCheck, Users, Package, CheckCircle2 } from 'lucide-react';

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const router = useRouter();
    const resParams: any = React.use(params);
    const id = resParams.id;

    useEffect(() => {
        if (id) {
            fetchOffer();
        }
    }, [id]);

    const fetchOffer = async () => {
        try {
            const token = localStorage.getItem('admin_token');
            if (!token) {
                router.push('/admin/login');
                return;
            }

            const response = await fetch(`/api/admin/offers/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setOffer(data.offer);
            } else if (response.status === 401) {
                window.location.href = '/admin/login';
            }
        } catch (error) {
            console.error('Error fetching offer:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || sending) return;
        setSending(true);
        try {
            const token = localStorage.getItem('admin_token');
            const res = await fetch(`/api/admin/offers/${id}/negotiate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: replyMessage.trim() }),
            });
            if (res.ok) {
                setReplyMessage('');
                fetchOffer(); // Refresh to show new message
            } else {
                alert('Błąd wysyłania wiadomości');
            }
        } catch (err) {
            console.error('Error sending reply:', err);
            alert('Błąd połączenia');
        } finally {
            setSending(false);
        }
    };

    const pluralizeMessages = (count: number) => {
        if (count === 1) return '1 wiadomość';
        if (count >= 2 && count <= 4) return `${count} wiadomości`;
        return `${count} wiadomości`;
    };

    const [splitCounts, setSplitCounts] = useState<{ [key: number]: number }>({});
    const [acceptingForClient, setAcceptingForClient] = useState(false);
    const [manualPrice, setManualPrice] = useState<number>(0);

    const templateData = offer?.template_data;
    const isCommunion = offer?.category?.toLowerCase() === 'komunia';
    const isPending = offer?.status === 'sent' || offer?.status === 'pending';

    const totalChildren = useMemo(() => {
        return Object.values(splitCounts).reduce((a: number, b: number) => a + (b as number), 0);
    }, [splitCounts]);

    const calculatedTotal = useMemo(() => {
        if (!templateData?.footerPrices) return 0;
        let total = 0;
        if (isCommunion) {
            templateData.footerPrices.forEach((priceStr: string, idx: number) => {
                if (idx === 0) return;
                const count = splitCounts[idx] || 0;
                if (count > 0) {
                    const price = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
                    total += price * count;
                }
            });
        }
        return total;
    }, [templateData, splitCounts, isCommunion]);

    if (loading) {
        return <div className="text-center py-8">Ładowanie...</div>;
    }

    if (!offer) {
        return <div className="text-center py-8 text-red-500">Oferta nie znaleziona</div>;
    }

    // Convert saved data to OfferBuilder data format
    const initialBuilderData = offer.template_data || {
        title: offer.title,
    };

    const handleAcceptForClient = async () => {
        const finalPrice = isCommunion ? calculatedTotal : manualPrice;
        if (isCommunion && totalChildren === 0) {
            alert('Wprowadź liczbę dzieci dla przynajmniej jednego pakietu.');
            return;
        }
        if (!isCommunion && finalPrice <= 0) {
            alert('Wprowadź kwotę oferty.');
            return;
        }
        const confirmMsg = isCommunion 
            ? `Czy na pewno chcesz zaakceptować ofertę za klienta?\n\nLiczba dzieci: ${totalChildren}\nKwota: ${finalPrice.toLocaleString('pl-PL')} PLN`
            : `Czy na pewno chcesz zaakceptować ofertę za klienta?\n\nKwota: ${finalPrice.toLocaleString('pl-PL')} PLN`;
        if (!confirm(confirmMsg)) {
            return;
        }
        setAcceptingForClient(true);
        try {
            const token = localStorage.getItem('admin_token');
            const clientSelection: any = {
                totalPrice: finalPrice,
                acceptedByAdmin: true,
            };
            if (isCommunion) {
                clientSelection.childCount = totalChildren;
                clientSelection.splitPackageCounts = splitCounts;
                clientSelection.packagesBreakdown = Object.entries(splitCounts).map(([idx, count]) => ({
                    name: templateData.pricingHeaders?.[parseInt(idx)] || `Pakiet ${idx}`,
                    price: templateData.footerPrices?.[parseInt(idx)] || '0',
                    count: count,
                    subtotal: (parseInt((templateData.footerPrices?.[parseInt(idx)] || '0').replace(/[^0-9]/g, '')) || 0) * (count as number)
                }));
            }
            const res = await fetch(`/api/admin/offers/${id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'accepted',
                    client_selection: clientSelection,
                }),
            });
            if (res.ok) {
                alert('✅ Oferta zaakceptowana za klienta!');
                fetchOffer();
            } else {
                const err = await res.json().catch(() => ({}));
                alert('Błąd: ' + (err.error || 'Nie udało się zaakceptować'));
            }
        } catch (err) {
            console.error(err);
            alert('Błąd połączenia');
        } finally {
            setAcceptingForClient(false);
        }
    };

    // Sort negotiations by created_at ascending (oldest first) for chat flow
    const sortedNegotiations = offer.negotiations
        ? [...offer.negotiations].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        : [];

    return (
        <div className="space-y-6">
            {/* Negotiations Chat Section */}
            {sortedNegotiations.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg border-l-4 border-orange-500 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageCircle className="w-6 h-6 text-orange-600" />
                        <h2 className="text-2xl font-bold text-gray-900">💬 Negocjacje</h2>
                        <span className="ml-auto inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold text-sm">
                            {pluralizeMessages(sortedNegotiations.length)}
                        </span>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto bg-gray-50 rounded-lg p-4">
                        {sortedNegotiations.map((negotiation: any, index: number) => {
                            const isAdmin = negotiation.sender === 'admin';
                            return (
                                <div
                                    key={index}
                                    className={`rounded-lg p-4 max-w-[85%] ${isAdmin
                                        ? 'ml-auto bg-blue-50 border border-blue-200'
                                        : 'mr-auto bg-white border-l-4 border-orange-300 shadow-sm'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {isAdmin ? (
                                                <>
                                                    <Shield className="w-4 h-4 text-blue-600" />
                                                    <span className="font-semibold text-blue-800 text-sm">Ty (Admin)</span>
                                                </>
                                            ) : (
                                                <>
                                                    <User className="w-4 h-4 text-orange-600" />
                                                    <span className="font-semibold text-gray-900 text-sm">Klient</span>
                                                </>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(negotiation.created_at).toLocaleDateString('pl-PL', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}{' '}
                                            {new Date(negotiation.created_at).toLocaleTimeString('pl-PL', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <p className={`whitespace-pre-wrap leading-relaxed text-sm ${isAdmin ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {negotiation.message}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Reply Form */}
                    <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <label className="text-sm font-bold text-gray-700 mb-2 block">Odpowiedz klientowi:</label>
                        <div className="flex gap-3">
                            <textarea
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                placeholder="Napisz odpowiedź..."
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500 text-sm resize-none"
                                rows={2}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendReply();
                                    }
                                }}
                            />
                            <button
                                onClick={handleSendReply}
                                disabled={sending || !replyMessage.trim()}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition-colors flex items-center gap-2 self-end"
                            >
                                <Send className="w-4 h-4" />
                                {sending ? 'Wysyłam...' : 'Wyślij'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Enter wysyła, Shift+Enter nowa linia. Klient dostanie email z Twoją odpowiedzią.</p>
                    </div>
                </div>
            )}

            {/* Accept for Client Section */}
            {isPending && (
                <div className="bg-white rounded-lg shadow-lg border-l-4 border-green-500 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <UserCheck className="w-6 h-6 text-green-600" />
                        <h2 className="text-xl font-bold text-gray-900">Wypełnij za klienta</h2>
                        <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                            Status: {offer.status}
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        {isCommunion 
                            ? 'Wprowadź liczbę dzieci dla każdego pakietu i zaakceptuj ofertę w imieniu klienta.'
                            : 'Wprowadź kwotę i zaakceptuj ofertę w imieniu klienta.'}
                    </p>

                    {isCommunion && templateData ? (
                        <>
                            <div className="grid gap-3 mb-6">
                                {templateData.pricingHeaders?.map((header: string, idx: number) => {
                                    if (idx === 0) return null;
                                    const price = templateData.footerPrices?.[idx] || '—';
                                    const count = splitCounts[idx] || 0;
                                    return (
                                        <div key={idx} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-blue-600" />
                                                    <span className="font-semibold text-gray-900">{header}</span>
                                                </div>
                                                <span className="text-sm text-gray-500">Cena: {price}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSplitCounts(p => ({ ...p, [idx]: Math.max(0, (p[idx] || 0) - 1) }))}
                                                    className="w-8 h-8 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-lg flex items-center justify-center"
                                                >−</button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={count}
                                                    onChange={(e) => setSplitCounts(p => ({ ...p, [idx]: Math.max(0, parseInt(e.target.value) || 0) }))}
                                                    className="w-16 text-center border border-gray-300 rounded-lg py-1 text-gray-900 font-bold"
                                                />
                                                <button
                                                    onClick={() => setSplitCounts(p => ({ ...p, [idx]: (p[idx] || 0) + 1 }))}
                                                    className="w-8 h-8 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg flex items-center justify-center"
                                                >+</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {totalChildren > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-green-600" />
                                            <span className="font-bold text-green-900">Łącznie dzieci: {totalChildren}</span>
                                        </div>
                                        <span className="text-lg font-bold text-green-700">{calculatedTotal.toLocaleString('pl-PL')} PLN</span>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Kwota oferty (PLN)</label>
                            <input
                                type="number"
                                min="0"
                                value={manualPrice || ''}
                                onChange={(e) => setManualPrice(Math.max(0, parseInt(e.target.value) || 0))}
                                placeholder="np. 2500"
                                className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-bold text-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleAcceptForClient}
                        disabled={acceptingForClient || (isCommunion ? totalChildren === 0 : manualPrice <= 0)}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        {acceptingForClient ? 'Akceptowanie...' : 'Akceptuj ofertę za klienta'}
                    </button>
                </div>
            )}

            {/* Offer Editor */}
            <div>
                {sortedNegotiations.length > 0 && (
                    <h2 className="text-xl font-bold text-gray-900 mb-3">📝 Edycja Oferty</h2>
                )}
                <OfferBuilder
                    offerId={parseInt(id)}
                    initialData={initialBuilderData}
                    offerStatus={offer.status}
                />
            </div>
        </div>
    );
}
