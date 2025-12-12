'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight, X, ChevronLeft } from 'lucide-react';
import Image from 'next/image';

interface GiftCard {
    id: number;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    image_url: string | null;
}

interface PromoSettings {
    title: string;
    description: string;
    rotation_interval: number;
}

export default function GiftCardPromoBar() {
    const [isVisible, setIsVisible] = useState(true);
    const [cards, setCards] = useState<GiftCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [settings, setSettings] = useState<PromoSettings>({
        title: 'Karty Podarunkowe',
        description: '',
        rotation_interval: 5
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPromoData = async () => {
            try {
                const res = await fetch('/api/admin/gift-card-promo');
                const data = await res.json();

                if (data.enabled && data.cards && data.cards.length > 0) {
                    setCards(data.cards);
                    setSettings(data.settings);
                    setIsVisible(true);
                } else {
                    setIsVisible(false);
                }
            } catch (error) {
                console.error('Failed to fetch gift card promo data:', error);
                setIsVisible(false);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPromoData();
    }, []);

    // Auto-rotate cards
    useEffect(() => {
        if (!isVisible || cards.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentCardIndex((prev) => (prev + 1) % cards.length);
        }, settings.rotation_interval * 1000);

        return () => clearInterval(interval);
    }, [cards.length, settings.rotation_interval, isVisible]);

    if (isLoading || !isVisible || cards.length === 0) return null;

    const currentCard = cards[currentCardIndex];

    const handlePrevious = () => {
        setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
    };

    const handleNext = () => {
        setCurrentCardIndex((prev) => (prev + 1) % cards.length);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ x: -400, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -400, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 25 }}
                    className="fixed left-0 top-1/2 -translate-y-1/2 z-40 w-80"
                >
                    <div className="bg-gradient-to-b from-zinc-900 to-black rounded-r-2xl shadow-2xl border border-gold-500/30 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 pt-4 pb-3 border-b border-gold-500/20">
                            <h3 className="text-white font-bold text-sm line-clamp-1">
                                {settings.title}
                            </h3>
                            {settings.description && (
                                <p className="text-white/60 text-xs line-clamp-2 mt-1">
                                    {settings.description}
                                </p>
                            )}
                        </div>

                        {/* Card Display */}
                        <div className="p-4">
                            <motion.div
                                key={`card-${currentCard.id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-3"
                            >
                                {/* Card Image */}
                                {currentCard.image_url && (
                                    <div className="relative w-full h-40 bg-zinc-800 rounded-lg overflow-hidden">
                                        <Image
                                            src={currentCard.image_url}
                                            alt={currentCard.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}

                                {/* Card Info */}
                                <div>
                                    <h4 className="text-white font-semibold text-sm line-clamp-2">
                                        {currentCard.name}
                                    </h4>
                                    {currentCard.description && (
                                        <p className="text-white/70 text-xs line-clamp-2 mt-1">
                                            {currentCard.description}
                                        </p>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-gold-500">
                                        {currentCard.price}
                                    </span>
                                    <span className="text-white/60 text-xs">
                                        {currentCard.currency}
                                    </span>
                                </div>

                                {/* Navigation & CTA */}
                                <div className="flex gap-2 pt-2">
                                    {cards.length > 1 && (
                                        <>
                                            <button
                                                onClick={handlePrevious}
                                                className="flex-shrink-0 p-2 hover:bg-gold-500/20 rounded-lg transition-colors"
                                                aria-label="Previous card"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-white" />
                                            </button>
                                            <button
                                                onClick={handleNext}
                                                className="flex-shrink-0 p-2 hover:bg-gold-500/20 rounded-lg transition-colors"
                                                aria-label="Next card"
                                            >
                                                <ChevronRight className="w-4 h-4 text-white" />
                                            </button>
                                        </>
                                    )}
                                    <Link
                                        href={`/karta-podarunkowa/${currentCard.id}/kup`}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold text-black text-xs transition-all hover:shadow-lg hover:scale-105 bg-gold-500 hover:bg-gold-400"
                                    >
                                        Kup
                                        <ChevronRight className="w-3 h-3" />
                                    </Link>
                                </div>

                                {/* Dots indicator */}
                                {cards.length > 1 && (
                                    <div className="flex gap-1 justify-center pt-2">
                                        {cards.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentCardIndex(idx)}
                                                className={`w-2 h-2 rounded-full transition-colors ${
                                                    idx === currentCardIndex
                                                        ? 'bg-gold-500'
                                                        : 'bg-white/30 hover:bg-white/50'
                                                }`}
                                                aria-label={`Go to card ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 p-1 text-white/50 hover:text-white transition-colors z-10"
                            aria-label="Close promo bar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
