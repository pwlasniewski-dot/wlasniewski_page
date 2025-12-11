'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GiftCard from '@/components/GiftCard';
import { ShoppingCart, Heart, Share2, ArrowRight } from 'lucide-react';

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

const THEME_INFO = {
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

export default function GiftCardShop() {
    const [cards, setCards] = useState<GiftCardProduct[]>([]);
    const [filteredCards, setFilteredCards] = useState<GiftCardProduct[]>([]);
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const res = await fetch('/api/gift-cards/shop');
                const data = await res.json();
                setCards(data);
                setFilteredCards(data);
            } catch (error) {
                console.error('Failed to fetch gift cards');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCards();
    }, []);

    useEffect(() => {
        if (selectedTheme) {
            setFilteredCards(cards.filter(card => card.theme === selectedTheme));
        } else {
            setFilteredCards(cards);
        }
    }, [selectedTheme, cards]);

    const toggleFavorite = (id: number) => {
        setFavorites(prev => 
            prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
        );
    };

    const themes = Object.entries(THEME_INFO);

    if (isLoading) {
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
            {/* Header */}
            <section className="py-20 px-6 border-b border-zinc-800">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-display font-bold mb-6">
                            🎁 <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">Karty Podarunkowe</span>
                        </h1>
                        <p className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto">
                            Spersonalizowana karta podarunkowa na każdą okazję. Wyślij mailem, wydrukuj lub udostępnij bezpośrednio.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Theme Filter */}
            <section className="py-12 px-6 border-b border-zinc-800 bg-zinc-950">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-lg font-semibold mb-6 text-zinc-300">Filtruj po temacie:</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTheme(null)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                selectedTheme === null
                                    ? 'bg-gold-500 text-black'
                                    : 'bg-zinc-800 text-white hover:bg-zinc-700'
                            }`}
                        >
                            Wszystkie
                        </motion.button>
                        {themes.map(([key, { icon, name }]) => (
                            <motion.button
                                key={key}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTheme(key)}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 text-sm ${
                                    selectedTheme === key
                                        ? 'bg-gold-500 text-black'
                                        : 'bg-zinc-800 text-white hover:bg-zinc-700'
                                }`}
                                title={name}
                            >
                                <span>{icon}</span>
                                <span className="hidden sm:inline">{name.split(' ')[0]}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Grid of Cards */}
            <section className="py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    {filteredCards.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-xl text-zinc-400">Brak dostępnych kart dla wybranego tematu</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredCards.map((card, idx) => (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group"
                                >
                                    <div className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-gold-500/50 transition-all p-6 h-full flex flex-col">
                                        {/* Card Preview */}
                                        <div className="mb-6 rounded-xl overflow-hidden bg-black p-4 flex items-center justify-center h-64">
                                            <div className="scale-75 origin-center">
                                                <GiftCard
                                                    code={card.code}
                                                    value={card.value}
                                                    theme={card.theme as any}
                                                    cardTitle={card.card_title}
                                                    cardDescription={card.card_description}
                                                />
                                            </div>
                                        </div>

                                        {/* Theme Badge */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-2xl">
                                                {THEME_INFO[card.theme as keyof typeof THEME_INFO]?.icon}
                                            </span>
                                            <span className="text-sm text-zinc-400">
                                                {THEME_INFO[card.theme as keyof typeof THEME_INFO]?.name}
                                            </span>
                                        </div>

                                        {/* Value */}
                                        <h3 className="text-2xl font-bold text-gold-400 mb-2">
                                            {card.value} zł
                                        </h3>

                                        {/* Price */}
                                        <p className="text-zinc-300 mb-4 flex-1">
                                            <span className="text-sm text-zinc-500">Cena: </span>
                                            <span className="text-xl font-bold">{card.price} zł</span>
                                        </p>

                                        {/* Description */}
                                        {card.description && (
                                            <p className="text-sm text-zinc-400 mb-6">
                                                {card.description}
                                            </p>
                                        )}

                                        {/* Status */}
                                        {!card.available && (
                                            <div className="mb-4 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                                Brak dostępu
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="space-y-3">
                                            <Link
                                                href={`/karta-podarunkowa/${card.id}/kup`}
                                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                                Kup teraz
                                            </Link>

                                            <div className="flex gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => toggleFavorite(card.id)}
                                                    className={`flex-1 px-4 py-2 rounded-lg border transition-all font-semibold flex items-center justify-center gap-2 ${
                                                        favorites.includes(card.id)
                                                            ? 'bg-red-500/20 border-red-500 text-red-400'
                                                            : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                                    }`}
                                                >
                                                    <Heart
                                                        className="w-4 h-4"
                                                        fill={favorites.includes(card.id) ? 'currentColor' : 'none'}
                                                    />
                                                    <span className="hidden sm:inline">Polub</span>
                                                </motion.button>

                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        if (navigator.share) {
                                                            navigator.share({
                                                                title: `${THEME_INFO[card.theme as keyof typeof THEME_INFO]?.name} - Karta Podarunkowa`,
                                                                text: `Karta podarunkowa o wartości ${card.value} zł`,
                                                                url: window.location.href
                                                            });
                                                        }
                                                    }}
                                                    className="flex-1 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-600 transition-all font-semibold flex items-center justify-center gap-2"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Udostępnij</span>
                                                </motion.button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Info Section */}
            <section className="py-20 px-6 bg-zinc-950 border-t border-zinc-800">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-display font-bold mb-12 text-center">
                        Jak to działa? 🎁
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: '🛒',
                                title: 'Wybierz kartę',
                                description: 'Wybrany temat i wartość karty podarunkowej'
                            },
                            {
                                icon: '💳',
                                title: 'Zapłać',
                                description: 'Bezpieczna płatność przez Stripe lub przelew bankowy'
                            },
                            {
                                icon: '📧',
                                title: 'Udostępnij',
                                description: 'Wyślij mailem, wydrukuj lub udostępnij klientowi'
                            }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="text-center"
                            >
                                <div className="text-5xl mb-4">{item.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                <p className="text-zinc-400">{item.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
