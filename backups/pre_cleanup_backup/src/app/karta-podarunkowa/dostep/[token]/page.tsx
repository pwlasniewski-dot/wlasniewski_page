'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Copy, Download, Share2, Mail, Printer, Clock } from 'lucide-react';
import GiftCard from '@/components/GiftCard';

interface GiftCardData {
    id: number;
    code: string;
    value: number;
    theme: string;
    card_title: string;
    card_description: string;
    photographer_message?: string;
}

interface OrderData {
    id: number;
    gift_card: GiftCardData;
    access_token: string;
    expires_at: string;
    created_at: string;
    paid_at?: string;
    logoUrl?: string;
}

export default function AccessPage() {
    const params = useParams();
    const token = params.token as string;
    const [order, setOrder] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(0);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/gift-cards/access/${token}`);
                if (!res.ok) {
                    throw new Error(res.status === 404 ? 'Karta nie znaleziona lub wygasła' : 'Błąd dostępu');
                }
                const data = await res.json();
                setOrder(data);

                // Calculate days remaining
                const expiresAt = new Date(data.expires_at).getTime();
                const now = new Date().getTime();
                const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
                setDaysRemaining(Math.max(0, daysLeft));
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Błąd pobierania karty');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchOrder();
        }
    }, [token]);

    const copyCode = () => {
        if (order) {
            navigator.clipboard.writeText(order.gift_card.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Karta Podarunkowa',
                    text: `${order?.gift_card.card_title} - ${order?.gift_card.value} zł`,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white pt-20 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    className="text-4xl"
                >
                    ✨
                </motion.div>
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="min-h-screen bg-black text-white pt-40 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto text-center"
                >
                    <h1 className="text-3xl font-bold mb-4">⚠️ {error}</h1>
                    <p className="text-zinc-400 mb-8">
                        Link do karty wygasł lub jest nieprawidłowy. Sprawdź email potwierdzający.
                    </p>
                    <Link
                        href="/karta-podarunkowa"
                        className="inline-block px-8 py-4 bg-gold-500 text-black font-bold rounded-xl hover:bg-gold-400 transition-all"
                    >
                        Powróć do Sklepu
                    </Link>
                </motion.div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white py-20">
            <div className="max-w-6xl mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-12"
                >
                    <h1 className="text-4xl font-display font-bold mb-2">Twoja Karta Podarunkowa</h1>
                    <p className="text-zinc-400">Możesz teraz wydrukować, wysłać lub udostępnić kartę</p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 mb-12">
                    {/* Card Preview */}
                    <motion.div
                        id="printable-area"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="flex flex-col items-center justify-center p-8 bg-zinc-900/50 rounded-2xl border border-zinc-800/50"
                    >
                        <div className="w-full max-w-sm">
                            <GiftCard
                                code={order.gift_card.code}
                                value={order.gift_card.value}
                                theme={(order.gift_card.theme as any) || 'birthday'}
                                cardTitle={order.gift_card.card_title}
                                cardDescription={order.gift_card.card_description}
                                logoUrl={order.logoUrl}
                                orderId={`ORD-${order.id}`}
                            />
                        </div>
                        <div className="hidden print:block text-black text-center mt-8 space-y-2">
                            <p className="font-bold text-xl">Kod Promocyjny: {order.gift_card.code}</p>
                            <p className="border-b border-black pb-1 inline-block">Ref: ORD-{order.id}</p>
                            <p className="text-sm">Zrealizuj na: wlasniewski.pl/rezerwacja</p>
                            <p className="text-xs text-gray-500">Ważny do: {new Date(order.expires_at).toLocaleDateString()}</p>
                        </div>
                    </motion.div>

                    {/* Card Details & Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="space-y-8"
                    >
                        {/* Expiration */}
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                            <div className="flex items-center gap-3 mb-3">
                                <Clock className="w-5 h-5 text-orange-400" />
                                <h3 className="font-bold text-lg">Ważność Karty</h3>
                            </div>
                            <p className={`text-2xl font-bold ${daysRemaining > 7 ? 'text-green-400' :
                                daysRemaining > 0 ? 'text-orange-400' : 'text-red-400'
                                }`}>
                                {daysRemaining} dni
                            </p>
                            <p className="text-zinc-400 text-sm mt-2">
                                Do: {new Date(order.expires_at).toLocaleDateString('pl-PL')}
                            </p>
                        </div>

                        {/* Code */}
                        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                            <h3 className="font-bold text-lg mb-4">Kod Promocyjny</h3>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-2xl font-mono font-bold text-gold-400 tracking-wider">
                                    {order.gift_card.code}
                                </code>
                                <button
                                    onClick={copyCode}
                                    className={`p-3 rounded-lg transition-all ${copied
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                                        }`}
                                    title="Skopiuj kod"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-zinc-400 text-sm mt-3">
                                Kod ważny przez 12 miesięcy od daty zakupu
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-lg mb-4">Opcje</h3>

                            <button
                                onClick={handlePrint}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all font-bold"
                            >
                                <Printer className="w-5 h-5" />
                                Wydrukuj Kartę
                            </button>

                            <button
                                onClick={handleShare}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all font-bold"
                            >
                                <Share2 className="w-5 h-5" />
                                Udostępnij
                            </button>

                            <Link
                                href={`mailto:?subject=Karta%20Podarunkowa&body=Oto%20moja%20karta%20podarunkowa:%20${window.location.href}`}
                                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-all font-bold"
                            >
                                <Mail className="w-5 h-5" />
                                Wyślij Mailem
                            </Link>
                        </div>

                        {/* Info */}
                        <div className="bg-zinc-900/80 rounded-lg p-6 border border-zinc-800 text-zinc-300">
                            <h3 className="font-bold text-white text-lg mb-4">Jak zrealizować kartę?</h3>
                            <div className="space-y-4">
                                <p><strong>Opcja A: Samodzielna Rezerwacja</strong></p>
                                <ol className="space-y-2 list-decimal list-inside marker:text-gold-500 text-sm">
                                    <li>Skopiuj kod promocyjny.</li>
                                    <li>Przejdź do zakładki <Link href="/rezerwacja" className="text-gold-400 hover:underline">Rezerwacja</Link>.</li>
                                    <li>Wybierz termin i wpisz kod w podsumowaniu.</li>
                                </ol>

                                <p><strong>Opcja B: Prezent / Pomoc</strong></p>
                                <ul className="space-y-2 list-disc list-inside marker:text-gold-500 text-sm">
                                    <li>Możesz przekazać ten link lub wydrukowaną kartę jako prezent.</li>
                                    <li>Osoba obdarowana użyje kodu tak samo jak Ty.</li>
                                    <li><strong>Masz problem?</strong> Napisz do mnie maila z kodem karty, a ja ręcznie zarezerwuję termin dla Ciebie lub obdarowanej osoby! 📸</li>
                                </ul>
                            </div>

                            <div className="mt-6 pt-6 border-t border-zinc-700">
                                <Link
                                    href="/rezerwacja"
                                    className="block w-full py-4 text-center bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
                                >
                                    📅 Zarezerwuj Termin Online
                                </Link>
                                <p className="text-center text-xs text-zinc-500 mt-2">Ważność kodu: 12 miesięcy</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-center"
                >
                    <Link
                        href="/"
                        className="inline-block px-8 py-3 text-zinc-400 hover:text-white transition-all"
                    >
                        ← Powróć na stronę główną
                    </Link>
                </motion.div>
            </div>

            <style>{`
                @media print {
                    @page { margin: 0; size: auto; }
                    body { visibility: hidden; background: white !important; }
                    #printable-area { 
                        visibility: visible; 
                        position: absolute; 
                        left: 50%; 
                        top: 50%; 
                        transform: translate(-50%, -50%); 
                        width: 100%; 
                        max-width: 600px;
                        border: 4px solid #d4af37 !important;
                        padding: 40px !important;
                    }
                    #printable-area * { visibility: visible; }
                    
                    /* Hide everything else */
                    header, footer, nav, button, a { display: none !important; }
                }
            `}</style>
        </main>
    );
}
