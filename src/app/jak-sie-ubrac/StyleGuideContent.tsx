'use client';

import React from 'react';
import { motion } from 'framer-motion';
import OutfitCollageCard from '@/components/StyleGuide/OutfitCollageCard';
import ColorPaletteCard from '@/components/StyleGuide/ColorPaletteCard';
import TipCard from '@/components/StyleGuide/TipCard';

interface StyleGuideContentProps {
    featuredPalettes: any[];
    featuredOutfits: any[];
    featuredTips: any[];
    faqs: any[];
}

export default function StyleGuideContent({
    featuredPalettes,
    featuredOutfits,
    featuredTips,
    faqs
}: StyleGuideContentProps) {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero - Clean, minimalist */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-xs tracking-[0.3em] text-slate-400 uppercase mb-6">
                            Style Guide
                        </p>
                        <h1 className="font-handwriting text-7xl md:text-9xl text-slate-700 mb-8 leading-tight">
                            Jak się ubrać?
                        </h1>
                        <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto font-light tracking-wide">
                            Profesjonalny poradnik stylizacji na sesję fotograficzną
                        </p>
                        
                        {/* Decorative divider */}
                        <div className="mt-12 flex items-center justify-center gap-4">
                            <div className="h-px w-16 bg-slate-300" />
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <div className="h-px w-16 bg-slate-300" />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Outfit Collages - kompletne zestawy z admina, w stylu Pinterestowych "What to Wear" */}
            {featuredOutfits.length > 0 ? (
                <section className="px-6">
                    {featuredOutfits.map((outfit, idx) => (
                        <React.Fragment key={outfit.id}>
                            <OutfitCollageCard outfit={outfit} />
                            {idx < featuredOutfits.length - 1 && (
                                <div className="max-w-md mx-auto flex items-center justify-center gap-4 py-8">
                                    <div className="h-px w-20 bg-slate-200" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <div className="h-px w-20 bg-slate-200" />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </section>
            ) : (
                <section className="px-6 py-16 text-center">
                    <p className="text-slate-400 font-light max-w-md mx-auto">
                        Wkrótce pojawią się tu inspiracje stylizacyjne.
                    </p>
                </section>
            )}

            {/* Color Palettes Section */}
            {featuredPalettes.length > 0 && (
                <section className="py-24 px-6 bg-slate-50/50 mt-16">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs tracking-[0.3em] text-slate-400 uppercase mb-4">
                                Inspiracje
                            </p>
                            <h2 className="font-handwriting text-5xl md:text-6xl text-slate-700 mb-4">
                                Palety Kolorów
                            </h2>
                            <p className="text-slate-500 max-w-xl mx-auto font-light">
                                Harmonijne zestawienia dla różnych pór roku i lokalizacji
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredPalettes.map((palette) => (
                                <ColorPaletteCard key={palette.id} palette={palette} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Tips Section */}
            {featuredTips.length > 0 && (
                <section className="py-24 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs tracking-[0.3em] text-slate-400 uppercase mb-4">
                                Porady
                            </p>
                            <h2 className="font-handwriting text-5xl md:text-6xl text-slate-700 mb-4">
                                Warto Wiedzieć
                            </h2>
                            <p className="text-slate-500 max-w-xl mx-auto font-light">
                                Sprawdzone wskazówki, które sprawią że będziesz wyglądać świetnie
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {featuredTips.slice(0, 4).map((tip) => (
                                <TipCard key={tip.id} tip={tip} compact={false} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ Section */}
            {faqs.length > 0 && (
                <section className="py-24 px-6 bg-slate-50/50">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-16">
                            <p className="text-xs tracking-[0.3em] text-slate-400 uppercase mb-4">
                                FAQ
                            </p>
                            <h2 className="font-handwriting text-5xl md:text-6xl text-slate-700 mb-4">
                                Najczęstsze Pytania
                            </h2>
                        </div>
                        <div className="space-y-4">
                            {faqs.map((faq) => (
                                <motion.div
                                    key={faq.id}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className="p-6 md:p-8 bg-white border border-slate-200 rounded-lg"
                                >
                                    <h3 className="text-lg font-semibold text-slate-800 mb-3">
                                        {faq.question}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Closing CTA */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="font-handwriting text-5xl md:text-7xl text-slate-700 mb-6">
                        Gotowa na sesję?
                    </h2>
                    <p className="text-slate-500 mb-8 font-light">
                        Skontaktuj się ze mną i zaplanujmy razem Twoją wymarzoną sesję
                    </p>
                    <a 
                        href="/kontakt"
                        className="inline-block px-10 py-4 bg-slate-800 text-white text-sm tracking-widest uppercase hover:bg-slate-700 transition-colors"
                    >
                        Zarezerwuj sesję
                    </a>
                </div>
            </section>
        </div>
    );
}
