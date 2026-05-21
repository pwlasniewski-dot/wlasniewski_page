'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, Shirt, Lightbulb, Gift, Camera, Heart } from 'lucide-react';
import ColorPaletteCard from '@/components/StyleGuide/ColorPaletteCard';
import OutfitCollageCard from '@/components/StyleGuide/OutfitCollageCard';
import TipCard from '@/components/StyleGuide/TipCard';

interface ClientStyleGuidePanelProps {
    offerId: number;
    serviceType?: string;
    groupSize?: number;
    location?: string;
}

export default function ClientStyleGuidePanel({
    offerId,
    serviceType,
    groupSize,
    location
}: ClientStyleGuidePanelProps) {
    const [styleGuide, setStyleGuide] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStyleGuide() {
            try {
                const res = await fetch(`/api/style-guide/client?offerId=${offerId}`);
                const data = await res.json();
                if (data.success) {
                    setStyleGuide(data.data);
                }
            } catch (error) {
                console.error('Error loading style guide:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStyleGuide();
    }, [offerId]);

    if (loading) {
        return (
            <div className="animate-pulse space-y-6">
                <div className="h-64 bg-zinc-900/50 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-48 bg-zinc-900/50 rounded-2xl" />
                    <div className="h-48 bg-zinc-900/50 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (!styleGuide) return null;

    const { recommended_palettes = [], recommended_outfits = [], tips = [] } = styleGuide;
    const safeGroupSize = Number.isFinite(groupSize) && Number(groupSize) > 0 ? Number(groupSize) : null;
    const safeLocation = typeof location === 'string' && location.trim() ? location.trim() : null;
    const normalizedLocation = safeLocation && !['do uzupelnienia', 'do uzupełnienia', 'do ustalenia', 'lokalizacja do uzgodnienia'].includes(safeLocation.toLowerCase())
        ? safeLocation
        : null;

    return (
        <div className="space-y-12">
            {/* Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden bg-gradient-to-br from-white via-amber-50/70 to-zinc-50 border border-amber-200/70 rounded-3xl p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
            >
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center border border-amber-200/80">
                            <Heart className="w-7 h-7 text-amber-700" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-zinc-900">
                                Jak się ubrać na sesję?
                            </h2>
                            <p className="text-zinc-600">Specjalnie dobrane dla Ciebie</p>
                        </div>
                    </div>
                    <p className="text-zinc-700 mb-6 leading-relaxed">
                        Przygotowaliśmy dla Ciebie profesjonalny poradnik stylizacji. 
                        Sprawdź palety kolorów, przykładowe zestawy i porady, które pomogą Ci 
                        wyglądać perfekcyjnie na zdjęciach. 
                        {safeGroupSize && ` Rekomendacje dostosowane dla grupy ${safeGroupSize} osób.`}
                        {normalizedLocation && ` Wskazówki uwzględniają też lokalizację sesji: ${normalizedLocation}.`}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {safeGroupSize && (
                            <span className="px-3 py-1 bg-white text-zinc-700 text-sm rounded-full border border-zinc-200">
                                {safeGroupSize} osób
                            </span>
                        )}
                    </div>
                </div>

                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/40 rounded-full blur-3xl" />
            </motion.div>

            {/* Recommended Color Palettes */}
            {recommended_palettes && recommended_palettes.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center">
                            <Palette className="w-6 h-6 text-gold-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-bold text-white">
                                Rekomendowane Palety Kolorów
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                Harmonijne zestawienia idealnie pasujące do Twojej sesji
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommended_palettes.slice(0, 3).map((palette: any) => (
                            <ColorPaletteCard key={palette.id} palette={palette} />
                        ))}
                    </div>
                </section>
            )}

            {/* Recommended Outfits */}
            {recommended_outfits && recommended_outfits.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center">
                            <Shirt className="w-6 h-6 text-gold-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-bold text-white">
                                Przykładowe Stylizacje
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                Gotowe zestawy odzieżowe dla Twojej grupy
                            </p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        {recommended_outfits.slice(0, 3).map((outfit: any) => (
                            <div key={outfit.id} className="bg-white rounded-2xl py-6">
                                <OutfitCollageCard outfit={outfit} showSubtitle={false} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Tips */}
            {tips && tips.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-gold-400/10 rounded-xl flex items-center justify-center">
                            <Lightbulb className="w-6 h-6 text-gold-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-bold text-white">
                                Przydatne Porady
                            </h3>
                            <p className="text-zinc-400 text-sm">
                                Najważniejsze wskazówki dla perfekcyjnych zdjęć
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tips.slice(0, 4).map((tip: any) => (
                            <TipCard key={tip.id} tip={tip} compact />
                        ))}
                    </div>
                </section>
            )}

            {/* Call to Action */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center p-8 bg-zinc-900/30 border border-white/10 rounded-2xl"
            >
                <Camera className="w-12 h-12 text-gold-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                    Chcesz zobaczyć więcej inspiracji?
                </h3>
                <p className="text-zinc-400 mb-6">
                    Odwiedź naszą pełną stronę z poradnikiem stylizacji
                </p>
                <a
                    href="/jak-sie-ubrac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gold-400 text-black font-semibold rounded-xl hover:bg-gold-500 transition-colors"
                >
                    Pełny Poradnik
                </a>
            </motion.div>
        </div>
    );
}
