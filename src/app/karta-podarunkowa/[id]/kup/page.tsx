'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GiftCard from '@/components/GiftCard';
import { ArrowLeft, Loader } from 'lucide-react';

interface GiftCardProduct {
    id: number;
    code: string;
    value: number;
    theme: string;
    price: number;
    description?: string;
    available: boolean;
    card_title?: string;
    card_description?: string;
}

const THEME_INFO: Record<string, { name: string; icon: string }> = {
    christmas: { name: 'Boże Narodzenie', icon: '🎄' },
    wosp: { name: 'WOŚP', icon: '💛' },
    valentines: { name: 'Walentynki', icon: '💝' },
    easter: { name: 'Wielkanoc', icon: '🐰' },
    halloween: { name: 'Halloween', icon: '👻' },
    'mothers-day': { name: 'Dzień Matki', icon: '💐' },
    'childrens-day': { name: 'Dzień Dziecka', icon: '🎈' },
    wedding: { name: 'Ślub', icon: '💒' },
    birthday: { name: 'Urodziny', icon: '🎂' }
};

export default function BuyGiftCardPage() {
    const params = useParams();
    const router = useRouter();
    const cardId = params.id as string;

    const [card, setCard] = useState<GiftCardProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const res = await fetch('/api/gift-cards/shop');
                const cards: GiftCardProduct[] = await res.json();
                const found = cards.find(c => c.id === parseInt(cardId));
                if (found) {
                    setCard(found);
                } else {
                    router.push('/karta-podarunkowa');
                }
            } catch (error) {
                console.error('Failed to fetch card');
            } finally {
                setIsLoading(false);
            }
        };

        if (cardId) {
            fetchCard();
        }
    }, [cardId, router]);

    const handleCheckout = async () => {
        if (!card) return;

        setIsProcessing(true);
        try {
            // Create checkout session
            const res = await fetch('/api/gift-cards/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: card.id,
                    price: card.price,
                    value: card.value,
                    theme: card.theme
                })
            });

            const data = await res.json();
            
            if (data.success && data.checkoutUrl) {
                // Redirect to payment gateway (Stripe, PayU, etc)
                window.location.href = data.checkoutUrl;
            } else {
                alert('Błąd przy tworzeniu sesji płatności');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Nie udało się przejść do płatności');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-black text-white pt-40">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-center min-h-96">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full"
                    />
                </div>
            </main>
        );
    }

    if (!card) {
        return (
            <main className="min-h-screen bg-black text-white pt-40">
                <div className="max-w-4xl mx-auto px-6 text-center py-20">
                    <p className="text-xl text-zinc-400 mb-6">Karta nie znaleziona</p>
                    <Link href="/karta-podarunkowa" className="text-gold-500 hover:text-gold-400">
                        Powróć do sklepu
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pt-40">
            {/* Breadcrumb */}
            <div className="max-w-7xl mx-auto px-6 mb-8">
                <Link
                    href="/karta-podarunkowa"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold-500 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Powróć do sklepu
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-20">
                <div className="grid md:grid-cols-2 gap-12 items-start">
                    {/* Left - Card Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="bg-zinc-900 rounded-2xl p-8 border border-zinc-800"
                    >
                        <div className="bg-black rounded-xl p-6 flex items-center justify-center min-h-96">
                            <GiftCard
                                code={card.code}
                                value={card.value}
                                theme={card.theme as any}
                                cardTitle={card.card_title}
                                cardDescription={card.card_description}
                            />
                        </div>
                        <p className="text-center text-sm text-zinc-500 mt-4">
                            Podgląd karty podarunkowej
                        </p>
                    </motion.div>

                    {/* Right - Details & Checkout */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-4xl">
                                    {THEME_INFO[card.theme]?.icon}
                                </span>
                                <div>
                                    <p className="text-sm text-zinc-500">Temat karty</p>
                                    <h1 className="text-3xl font-display font-bold">
                                        {THEME_INFO[card.theme]?.name}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Value & Price */}
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-6">
                            <div>
                                <p className="text-sm text-zinc-500 mb-2">Wartość karty</p>
                                <p className="text-4xl font-bold text-gold-400">
                                    {card.value} zł
                                </p>
                            </div>

                            <div className="border-t border-zinc-800 pt-6">
                                <p className="text-sm text-zinc-500 mb-2">Cena do zapłaty</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-bold">{card.price} zł</p>
                                    <p className="text-sm text-green-400">
                                        Zaoszczędzisz {card.value - card.price} zł!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {card.description && (
                            <div className="bg-zinc-950 rounded-xl p-6 border border-zinc-800">
                                <p className="text-zinc-300">{card.description}</p>
                            </div>
                        )}

                        {/* What you get */}
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                            <h3 className="font-bold text-lg mb-4">Co otrzymasz:</h3>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 font-bold mt-1">✓</span>
                                    <span>Spersonalizowaną kartę do wydruku</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 font-bold mt-1">✓</span>
                                    <span>Możliwość wysłania kartę mailem</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 font-bold mt-1">✓</span>
                                    <span>Unikalny kod promocyjny</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 font-bold mt-1">✓</span>
                                    <span>Ważna przez 12 miesięcy</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 font-bold mt-1">✓</span>
                                    <span>Możliwość udostępniania klientowi tylko po zapłacie</span>
                                </li>
                            </ul>
                        </div>

                        {/* Checkout Button */}
                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            className="w-full px-8 py-4 bg-gold-500 hover:bg-gold-400 disabled:bg-zinc-600 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2 text-lg"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Przygotowanie płatności...
                                </>
                            ) : (
                                <>
                                    Przejdź do płatności → {card.price} zł
                                </>
                            )}
                        </button>

                        {/* Security badge */}
                        <div className="text-center text-xs text-zinc-500">
                            🔒 Bezpieczna płatność z szyfrowaniem SSL
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
