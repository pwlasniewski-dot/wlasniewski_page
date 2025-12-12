'use client';

// Fixed syntax error and restored horizontal slider layout

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import GiftCard from '@/components/GiftCard';

interface CardData {
    id: number;
    name: string;
    description: string | null;
    price: number;
    theme: string;
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
    const [cards, setCards] = useState<CardData[]>([]);
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
                    className="fixed left-0 top-24 z-[100] w-80"
                >
                    <div className="bg-gradient-to-b from-zinc-900 to-black rounded-r-2xl shadow-2xl border border-gold-500/30 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 pt-4 pb-3 border-b border-gold-500/20 flex justify-between items-start">
                            <div>
                                <h3 className="text-white font-bold text-sm line-clamp-1">
                                    {settings.title}
                                </h3>
                                {settings.description && (
                                    <p className="text-white/60 text-xs line-clamp-2 mt-1">
                                        {settings.description}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1 text-white/50 hover:text-white transition-colors"
                                aria-label="Close promo bar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Single Card Display */}
                        <div className="p-4">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`card-${currentCard.id}`}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4"
                                >
                                    {/* Card Preview using Component */}
                                    <div className="relative w-full aspect-[1.588/1] bg-zinc-800 rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                        <div className="absolute inset-0">
                                            <GiftCard
                                                code="VOUCHER"
                                                value={currentCard.price}
                                                theme={currentCard.theme as any}
                                                cardTitle={currentCard.name}
                                                isPrint={false}
                                                cardDescription=""
                                            />
                                        </div>
                                    </div>

                                    {/* Info & CTA */}
                                    <div className="space-y-3">
                                        <div className="text-center">
                                            <h4 className="text-white font-semibold text-sm line-clamp-1">
                                                {currentCard.name}
                                            </h4>
                                            <p className="text-gold-500 font-bold text-lg">
                                                {currentCard.price} PLN
                                            </p>
                                        </div>

                                        {/* Navigation & CTA Row */}
                                        <div className="flex gap-2">
                                            {cards.length > 1 && (
                                                <>
                                                    <button onClick={handlePrevious} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                                        <ChevronLeft className="w-4 h-4 text-white" />
                                                    </button>
                                                    <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                                        <ChevronRight className="w-4 h-4 text-white" />
                                                    </button>
                                                </>
                                            )}
                                            <Link
                                                href={`/karta-podarunkowa/${currentCard.id}/kup`}
                                                className="flex-1 bg-gold-500 hover:bg-gold-400 text-black font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 transition-transform hover:scale-105"
                                            >
                                                Wybierz
                                            </Link>
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Dots */}
                        {cards.length > 1 && (
                            <div className="pb-4 flex justify-center gap-1">
                                {cards.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentCardIndex(idx)}
                                        className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentCardIndex ? 'bg-gold-500' : 'bg-zinc-700'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
