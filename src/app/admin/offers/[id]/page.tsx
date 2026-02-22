'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfferBuilder from '@/components/admin/OfferBuilder';
import { MessageCircle, Calendar, User } from 'lucide-react';

export default function EditOfferPage({ params }: { params: Promise<{ id: string }> }) {
    const [offer, setOffer] = useState<any>(null);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return <div className="text-center py-8">Ładowanie...</div>;
    }

    if (!offer) {
        return <div className="text-center py-8 text-red-500">Oferta nie znaleziona</div>;
    }

    // Convert saved data to OfferBuilder data format
    // If template_data exists, use it. Otherwise fallback to base fields
    const initialBuilderData = offer.template_data || {
        title: offer.title,
        // ... other fields could be mapped if needed, 
        // but A4 Builder usually relies on template_data
    };

    return (
        <div className="space-y-6">
            {/* Negotiations Section */}
            {offer.negotiations && offer.negotiations.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg border-l-4 border-orange-500 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <MessageCircle className="w-6 h-6 text-orange-600" />
                        <h2 className="text-2xl font-bold text-gray-900">💬 Historia Negocjacji</h2>
                        <span className="ml-auto inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-semibold text-sm">
                            {offer.negotiations.length} wiadomość{offer.negotiations.length !== 1 ? 'i' : 'a'}
                        </span>
                    </div>
                    
                    <div className="space-y-4 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                        {offer.negotiations.map((negotiation: any, index: number) => (
                            <div
                                key={index}
                                className="bg-white rounded-lg p-4 border-l-4 border-orange-300 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-orange-600" />
                                        <span className="font-semibold text-gray-900">Klient</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(negotiation.created_at).toLocaleDateString('pl-PL', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                        <span className="text-gray-500">
                                            {new Date(negotiation.created_at).toLocaleTimeString('pl-PL', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                    {negotiation.message}
                                </p>
                                {negotiation.status && (
                                    <div className="mt-2 text-xs text-gray-500 italic">
                                        Status: {negotiation.status}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-900">
                            <strong>💡 Wskazówka:</strong> Klient wysłał negocjacje. Możesz edytować ofertę poniżej i wysłać ją ponownie klientowi.
                        </p>
                    </div>
                </div>
            )}

            {/* Offer Editor */}
            <div>
                {offer.negotiations && offer.negotiations.length > 0 && (
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
