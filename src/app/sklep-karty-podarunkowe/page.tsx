'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function GiftCardShop() {
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const res = await fetch('/api/gift-cards/shop');
                const data = await res.json();
                setCards(data);
            } catch (error) {
                console.error('Failed to fetch gift cards');
            } finally {
                setLoading(false);
            }
        };

        fetchCards();
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
                                    key={card.id || idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-zinc-900 rounded-2xl overflow-hidden border border-gold-500/20 hover:border-gold-500/50 transition-all hover:shadow-2xl"
                                >
                                    <div className="p-6">
                                        <div className="text-4xl mb-4">🎁</div>
                                        <h3 className="text-2xl font-bold mb-2 text-gold-400">
                                            {card.value} PLN
                                        </h3>
                                        <p className="text-zinc-400 mb-6">
                                            {card.description || 'Karta podarunkowa'}
                                        </p>
                                        <Link
                                            href={`/karta-podarunkowa/${card.id}/kup`}
                                            className="inline-flex items-center justify-center w-full px-6 py-3 bg-gold-500 text-black font-bold rounded-lg hover:bg-gold-400 transition-colors"
                                        >
                                            Kup kartę
                                        </Link>
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
