'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GiftCard from '@/components/GiftCard';

interface GiftCardType {
    id: string;
    code: string;
    value: number;
    theme: string;
    card_title?: string;
    card_description?: string;
}

export default function GiftCardShop() {
    const [cards, setCards] = useState<GiftCardType[]>([]);
    const [loading, setLoading] = useState(true);
    const [logoUrl, setLogoUrl] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch cards
                const cardsRes = await fetch('/api/gift-cards/shop');
                const cardsData = await cardsRes.json();
                setCards(cardsData);

                // Fetch logo
                const settingsRes = await fetch('/api/settings/public');
                const settingsData = await settingsRes.json();
                if (settingsData.settings?.logo_url) {
                    setLogoUrl(settingsData.settings.logo_url);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <main className="min-h-screen bg-black text-white pt-40">
                <div className="max-w-7xl mx-auto px-6 py-20">
                    <div className="flex items-center justify-center min-h-96">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="w-12 h-12 border-4 border-gold-500/30 border-t-gold-500 rounded-full"
                        />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black text-white pt-40">
            <section className="py-20 px-6 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                            🎁 <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                                Karty Podarunkowe
                            </span>
                        </h1>
                        <p className="text-xl text-zinc-300 max-w-2xl mx-auto">
                            Podaruj sesję fotograficzną - idealny prezent na każdą okazję
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {cards.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-zinc-400 text-lg">Brak dostępnych kart</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {cards.map((card, idx) => (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="cursor-pointer group"
                                >
                                    <div className="mb-4">
                                        <GiftCard
                                            code={card.code}
                                            value={card.value}
                                            theme={card.theme as any}
                                            logoUrl={logoUrl}
                                            cardTitle={card.card_title}
                                            cardDescription={card.card_description}
                                        />
                                    </div>
                                    <div className="text-center space-y-3">
                                        <div>
                                            <p className="text-xs text-zinc-500">Kod</p>
                                            <p className="text-white font-mono font-bold text-sm">{card.code}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">Wartość</p>
                                            <p className="text-white font-bold text-lg">{card.value} zł</p>
                                        </div>
                                        <a
                                            href={`/karta-podarunkowa/${card.id}/kup`}
                                            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all"
                                        >
                                            Kup kartę
                                        </a>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
