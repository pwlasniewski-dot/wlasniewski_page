'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfferBuilder from '@/components/admin/OfferBuilder';
import OfferRecommendedAlbumsManager from '@/components/admin/OfferRecommendedAlbumsManager';
import { MessageCircle, User, Send, Shield, Archive } from 'lucide-react';

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [replyMessage, setReplyMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [replacementOfferId, setReplacementOfferId] = useState('');
    const [supersedeReason, setSupersedeReason] = useState('');
    const [superseding, setSuperseding] = useState(false);
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

    const handleSupersede = async () => {
        const replacementId = Number(replacementOfferId);
        if (!Number.isInteger(replacementId) || replacementId <= 0 || supersedeReason.trim().length < 10) {
            alert('Podaj ID prawidłowej oferty i konkretny powód (minimum 10 znaków).');
            return;
        }
        if (!window.confirm(`Oznaczyć ofertę #${id} jako zastąpioną przez ofertę #${replacementId}? Historia pozostanie zachowana.`)) return;
        setSuperseding(true);
        try {
            const token = localStorage.getItem('admin_token');
            const response = await fetch(`/api/admin/offers/${id}/supersede`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    replacement_offer_id: replacementId,
                    reason: supersedeReason.trim(),
                    expected_updated_at: offer.updated_at,
                }),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(payload.error || 'Nie udało się zastąpić oferty.');
            await fetchOffer();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Nie udało się zastąpić oferty.');
        } finally {
            setSuperseding(false);
        }
    };

    const pluralizeMessages = (count: number) => {
        if (count === 1) return '1 wiadomość';
        if (count >= 2 && count <= 4) return `${count} wiadomości`;
        return `${count} wiadomości`;
    };

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

    // Pre-fill kanonicznych pól sesji z kolumn DB (jeśli były zbackfillowane lub ustawione wcześniej)
    if (offer.session_date && !initialBuilderData.sessionDateIso) {
        initialBuilderData.sessionDateIso = new Date(offer.session_date).toISOString().slice(0, 10);
    }
    if (offer.session_time && !initialBuilderData.sessionTime) {
        initialBuilderData.sessionTime = offer.session_time;
    }
    if (offer.session_duration_min && !initialBuilderData.sessionDurationMin) {
        initialBuilderData.sessionDurationMin = offer.session_duration_min;
    }

    // Sort negotiations by created_at ascending (oldest first) for chat flow
    const sortedNegotiations = offer.negotiations
        ? [...offer.negotiations].sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        : [];

    return (
        <div className="space-y-6">
            {offer.status === 'superseded' ? (
                <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-950">
                    <div className="flex items-start gap-3">
                        <Archive className="mt-0.5 h-5 w-5 shrink-0" />
                        <div>
                            <h2 className="font-bold">Oferta historyczna — zastąpiona</h2>
                            <p className="mt-1 text-sm">
                                Klient nie widzi tej oferty. Zastąpiła ją{' '}
                                {offer.supersededBy
                                    ? `${offer.supersededBy.offerNumber || `#${offer.supersededBy.id}`} — ${offer.supersededBy.title}`
                                    : `oferta #${offer.superseded_by_offer_id}`}.
                            </p>
                            {offer.superseded_reason && <p className="mt-2 text-sm"><strong>Powód:</strong> {offer.superseded_reason}</p>}
                        </div>
                    </div>
                </section>
            ) : !offer.is_template && (
                <section className="rounded-xl border border-zinc-300 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                        <Archive className="mt-0.5 h-5 w-5 shrink-0 text-zinc-600" />
                        <div className="w-full">
                            <h2 className="font-bold text-zinc-900">Zastąp starą lub błędną ofertę</h2>
                            <p className="mt-1 text-sm text-zinc-600">Nie usuwa danych. Ukrywa starą ofertę klientowi i zachowuje pełny ślad audytowy.</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                                <input
                                    type="number"
                                    min="1"
                                    value={replacementOfferId}
                                    onChange={event => setReplacementOfferId(event.target.value)}
                                    placeholder="ID nowej oferty"
                                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                />
                                <input
                                    value={supersedeReason}
                                    onChange={event => setSupersedeReason(event.target.value)}
                                    maxLength={500}
                                    placeholder="Powód, np. błędny email — zastąpiona poprawną ofertą"
                                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleSupersede}
                                    disabled={superseding}
                                    className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {superseding ? 'Zapisuję…' : 'Oznacz jako zastąpioną'}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
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

            {/* Offer Editor */}
            <div>
                {sortedNegotiations.length > 0 && (
                    <h2 className="text-xl font-bold text-gray-900 mb-3">📝 Edycja Oferty</h2>
                )}
                <OfferBuilder
                    offerId={parseInt(id)}
                    templateId={offer?.is_template ? parseInt(id) : null}
                    templateName={offer?.is_template ? offer?.title : null}
                    initialData={initialBuilderData}
                    offerStatus={offer.status}
                />
            </div>

            {/* Rekomendowane albumy nPhoto */}
            <OfferRecommendedAlbumsManager offerId={parseInt(id)} />
        </div>
    );
}
