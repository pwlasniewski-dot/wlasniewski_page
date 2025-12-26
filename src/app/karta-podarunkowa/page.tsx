'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GiftCard from '@/components/GiftCard';
import { ShoppingCart, Heart, Share2, ArrowRight } from 'lucide-react';
import PageRenderer from '@/components/PageRenderer';

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
    lowest_price_30d?: number;
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
    const [heroImage, setHeroImage] = useState<string | null>(null);
    const [heroOpacity, setHeroOpacity] = useState(0.6);
    const [pageSections, setPageSections] = useState<any[] | null>(null);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const res = await fetch('/api/gift-cards/shop');
                const data = await res.json();

                // Handle new response format { cards, settings } or fallback to array
                const cardsData = Array.isArray(data) ? data : data.cards;
                const settingsData = !Array.isArray(data) ? data.settings : null;

                setCards(cardsData || []);
                setFilteredCards(cardsData || []);

                if (settingsData?.heroImage) {
                    setHeroImage(settingsData.heroImage);
                }
                if (settingsData?.heroOpacity !== undefined) {
                    setHeroOpacity(settingsData.heroOpacity);
                }
            } catch (error) {
                console.error('Failed to fetch gift cards');
            } finally {
                setIsLoading(false);
            }
        };

        const fetchPage = async () => {
            try {
                const res = await fetch('/api/pages?slug=karta-podarunkowa');
                const data = await res.json();
                if (data.success && data.page?.sections) {
                    try {
                        const parsed = JSON.parse(data.page.sections);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setPageSections(parsed);
                        }
                    } catch (e) {
                        console.error('Failed to parse page sections');
                    }
                }
            } catch (error) {
                console.error('Failed to fetch page data');
            }
        };

        fetchCards();
        fetchPage();
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
        <main className="min-h-screen bg-black text-white">
            {/* Page Sections from Page Builder (allows adding Hero Slider etc.) */}
            {pageSections && pageSections.length > 0 ? (
                <PageRenderer sections={pageSections} />
            ) : (
                /* Hero Section with Background - Fallback if no sections in Page Builder */
                <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden">
                    {/* Background Image */}
                    {heroImage ? (
                        <>
                            <div
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[10s] hover:scale-105"
                                style={{ backgroundImage: `url(${heroImage})` }}
                            />
                            <div
                                className="absolute inset-0 bg-black transition-opacity duration-700"
                                style={{ opacity: heroOpacity }}
                            />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 via-black to-black" />
                    )}

                    <div className="relative z-10 max-w-7xl mx-auto px-6 text-center pt-20">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-px h-16 bg-gradient-to-b from-transparent via-gold-400 to-transparent mb-8" />

                            <h2 className="text-gold-400 tracking-[0.2em] text-sm uppercase mb-4 font-medium">
                                Premium Gift Cards
                            </h2>

                            <h1 className="text-5xl md:text-7xl font-display font-light text-white mb-8 tracking-wide">
                                Karty <span className="italic font-serif text-gold-200">Podarunkowe</span>
                            </h1>

                            <p className="text-lg md:text-xl text-zinc-300 max-w-xl mx-auto font-light leading-relaxed">
                                Podaruj bliskim coś więcej niż przedmiot.
                                <span className="block text-white mt-1">Podaruj niezapomniane wspomnienia.</span>
                            </p>

                            <div className="w-px h-16 bg-gradient-to-b from-gold-400 via-transparent to-transparent mt-12" />
                        </motion.div>
                    </div>
                </section>
            )}

            {/* Theme Filter */}
            <section className="py-12 px-6 border-b border-zinc-800 bg-zinc-950">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-lg font-semibold mb-6 text-zinc-300">Filtruj po temacie:</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedTheme(null)}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedTheme === null
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
                                className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 text-sm ${selectedTheme === key
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
                                        <div className="mb-6 rounded-xl overflow-hidden bg-black/40 p-4 flex items-center justify-center h-56 group-hover:bg-black/60 transition-colors">
                                            <div className="w-full max-w-[320px]">
                                                <GiftCard
                                                    code={card.code}
                                                    value={card.value}
                                                    theme={card.theme as any}
                                                    cardTitle={card.card_title}
                                                    cardDescription={card.card_description}
                                                    hideCode={true}
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

                                        {/* Price Section */}
                                        <div className="mb-6 flex-1">
                                            <div className="flex items-baseline gap-2">
                                                {card.price < card.value ? (
                                                    <>
                                                        <span className="text-sm text-gold-400 font-medium bg-gold-400/10 px-2 py-0.5 rounded">RABAT</span>
                                                        <span className="text-2xl font-bold text-white">{card.price} zł</span>
                                                        <span className="text-sm text-zinc-500 line-through">{card.value} zł</span>
                                                    </>
                                                ) : (
                                                    <span className="text-2xl font-bold text-white">{card.price} zł</span>
                                                )}
                                            </div>

                                            {card.price < card.value && (
                                                <p className="text-[10px] text-zinc-500 mt-2 italic leading-tight">
                                                    Najniższa cena z 30 dni przed obniżką: {card.lowest_price_30d || card.value} zł
                                                </p>
                                            )}
                                        </div>

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
                                                    className={`flex-1 px-4 py-2 rounded-lg border transition-all font-semibold flex items-center justify-center gap-2 ${favorites.includes(card.id)
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
