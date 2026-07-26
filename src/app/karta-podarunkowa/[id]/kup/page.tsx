'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GiftCard from '@/components/GiftCard';
import { ArrowLeft, Loader, Check } from 'lucide-react';

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

export default function BuyGiftCardPage() {
    const params = useParams();
    const router = useRouter();
    const cardId = params.id as string;

    const [card, setCard] = useState<GiftCardProduct | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Customer info
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [senderName, setSenderName] = useState('');
    const [message, setMessage] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);

    useEffect(() => {
        const fetchCard = async () => {
            try {
                const res = await fetch(`/api/gift-cards/${cardId}`);
                if (!res.ok) throw new Error('Card not found');

                const data = await res.json();
                setCard(data);
            } catch (error) {
                console.error('Failed to fetch card:', error);
                router.push('/karta-podarunkowa');
            } finally {
                setIsLoading(false);
            }
        };

        if (cardId) {
            fetchCard();
        }
    }, [cardId, router]);

    const handleCheckout = async () => {
        if (!card || !customerName || !customerEmail) {
            alert('Uzupełnij wymagane pola');
            return;
        }

        if (!acceptTerms) {
            alert('Wymagana akceptacja Regulaminu');
            return;
        }

        if (!acceptPrivacy) {
            alert('Wymagana akceptacja Polityki Prywatności');
            return;
        }

        setIsProcessing(true);
        try {
            // Create checkout session
            const res = await fetch('/api/gift-cards/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cardId: card.id,
                    customerName,
                    customerEmail,
                    recipientName: recipientName || undefined,
                    recipientEmail: recipientEmail || undefined,
                    senderName: senderName || undefined,
                    message: message || undefined
                })
            });

            const data = await res.json();

            if (data.success && data.checkoutUrl) {
                // Przejście do bezpiecznej płatności PayU
                window.location.href = data.checkoutUrl;
            } else {
                alert('Błąd przy tworzeniu sesji płatności: ' + (data.details || data.error || 'Nieznany błąd'));
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
                                hideCode={true}
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
                            <p className="text-xs uppercase tracking-[0.28em] text-[#bca36f]">Karta podarunkowa</p>
                            <h1 className="mt-3 text-3xl font-display font-semibold text-stone-100">
                                {card.card_title || 'Prezent zapisany w kadrach'}
                            </h1>
                            <p className="mt-3 text-zinc-400">Wypełnij dane i przejdź do płatności PayU. Po jej potwierdzeniu karta otrzyma własny kod.</p>
                        </div>

                        {/* Value & Price */}
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-6">
                            <div>
                                <p className="text-sm text-zinc-500 mb-2">Wartość karty</p>
                                <p className="text-4xl font-bold text-gold-400">
                                    {Math.round(card.value)} zł
                                </p>
                            </div>

                            <div className="border-t border-zinc-800 pt-6">
                                <p className="text-sm text-zinc-500 mb-2">Cena do zapłaty</p>
                                <div className="flex items-baseline gap-2">
                                    <p className="text-4xl font-bold">{Math.round(card.price)} zł</p>
                                    {card.price < card.value && (
                                        <p className="text-sm text-emerald-400">
                                            Korzyść {Math.round(card.value - card.price)} zł
                                        </p>
                                    )}
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
                                    <span>Możliwość wysłania karty mailem</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 font-bold mt-1">✓</span>
                                    <span>Unikalny kod realizacji</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-green-400 font-bold mt-1">✓</span>
                                    <span>Aktywację dopiero po potwierdzeniu płatności</span>
                                </li>
                            </ul>
                        </div>

                        {/* Customer Form */}
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-4">
                            <h3 className="font-bold text-lg mb-4">Twoje dane</h3>

                            <input
                                type="text"
                                placeholder="Twoje imię"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                            />

                            <input
                                type="email"
                                placeholder="Twój email"
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                            />
                        </div>

                        {/* Recipient Form */}
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-4">
                            <h3 className="font-bold text-lg mb-4">Dane odbiorcy (opcjonalnie)</h3>

                            <input
                                type="text"
                                placeholder="Imię odbiorcy"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                            />

                            <input
                                type="email"
                                placeholder="Email odbiorcy"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                            />

                            <input
                                type="text"
                                placeholder="Od kogo (np. Twoje imię lub nazwa firmy)"
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                            />

                            <div className="relative">
                                <textarea
                                    placeholder="Wiadomość na karcie..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-gold-500"
                                    rows={3}
                                    maxLength={300}
                                />
                                <div className="absolute bottom-2 right-2 text-[10px] text-zinc-500">
                                    {message.length}/300
                                </div>
                            </div>
                        </div>

                        {/* GDPR Checkboxes */}
                        <div className="space-y-4 py-4 border-t border-zinc-800 mt-4">
                            <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                                <div className="relative flex items-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={e => setAcceptTerms(e.target.checked)}
                                        className="peer appearance-none w-6 h-6 border-2 border-zinc-500 rounded bg-zinc-900 checked:bg-gold-500 checked:border-gold-500 transition-all hover:border-gold-500/50"
                                    />
                                    <Check className="absolute top-1 left-1 w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                                </div>
                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors select-none leading-tight pt-1">
                                    Oświadczam, że znam i akceptuję <Link href="/regulamin" className="text-gold-500 hover:underline font-bold" target="_blank">Regulamin</Link> sklepu <span className="text-red-500">*</span>
                                </span>
                            </label>

                            <label className="flex items-start gap-3 cursor-pointer group p-2 hover:bg-zinc-800/50 rounded-lg transition-colors">
                                <div className="relative flex items-center mt-0.5">
                                    <input
                                        type="checkbox"
                                        checked={acceptPrivacy}
                                        onChange={e => setAcceptPrivacy(e.target.checked)}
                                        className="peer appearance-none w-6 h-6 border-2 border-zinc-500 rounded bg-zinc-900 checked:bg-gold-500 checked:border-gold-500 transition-all hover:border-gold-500/50"
                                    />
                                    <Check className="absolute top-1 left-1 w-4 h-4 text-black opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                                </div>
                                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors select-none leading-tight pt-1">
                                    Zapoznałem się z <Link href="/polityka-prywatnosci" className="text-gold-500 hover:underline font-bold" target="_blank">Polityką Prywatności</Link> i akceptuję jej postanowienia <span className="text-red-500">*</span>
                                </span>
                            </label>
                        </div>

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
                                    Przejdź do płatności → {Math.round(card.price)} zł
                                </>
                            )}
                        </button>

                        {/* Security badge */}
                        <div className="text-center text-xs text-zinc-500">
                            Bezpieczna płatność online obsługiwana przez PayU
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
