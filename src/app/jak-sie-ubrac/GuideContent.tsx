"use client";

import React from "react";
import Link from "next/link";
import ParallaxSection from "@/components/ParallaxSection";
import { motion } from "framer-motion";
import EffectWrapper from "@/components/VisualEffects/EffectWrapper";

const ICON_MAP: any = {
    city: '🏙️',
    nature: '🌳',
    indoor: '🏛️',
    sun: '☀️',
    moon: '🌙',
    heart: '❤️',
    home: '🏠',
    briefcase: '💼'
};

interface GuideContentProps {
    pageData: any;
    parallaxSections: any[];
    contentCards: any[];
    colorPalettes: any[];
}

export default function GuideContent({ pageData, parallaxSections, contentCards, colorPalettes }: GuideContentProps) {
    return (
        <main className="min-h-screen bg-black text-white">
            {/* Hero Parallax */}
            {parallaxSections.length > 0 && parallaxSections[0]?.image && (
                <ParallaxSection
                    image={parallaxSections[0].image}
                    title={parallaxSections[0].title || "Jak się ubrać?"}
                    height="min-h-[75vh]"
                />
            )}

            <div className="mx-auto max-w-7xl px-6 py-20">
                <div className="mb-12 flex justify-between items-center">
                    <Link href="/" className="text-zinc-400 hover:text-gold-400">← Powrót</Link>
                </div>

                {/* Visual Effects Section */}
                <div className="mb-16">
                    <EffectWrapper
                        pageSlug="jak-sie-ubrac"
                        sectionName="header"
                    />
                </div>

                {/* Content Cards */}
                {contentCards.length > 0 && (
                    <div className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">Wskazówki stylizacyjne</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {contentCards.map((card, index) => (
                                <motion.div
                                    key={card.id || index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="bg-zinc-900 border border-white/5 p-8 rounded-lg hover:border-gold-400/30 transition-all"
                                >
                                    <div className="text-5xl mb-4">{ICON_MAP[card.icon] || '📷'}</div>
                                    <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                                    <p className="text-zinc-400">{card.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {pageData?.content && (
                    <div className="mb-24 prose prose-invert prose-lg max-w-none">
                        <div
                            className="text-zinc-300 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: pageData.content }}
                        />
                    </div>
                )}

                {/* Color Palettes */}
                {colorPalettes.length > 0 && (
                    <div className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold mb-4">Palety kolorów</h2>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {colorPalettes.map((palette, index) => (
                                <motion.div
                                    key={palette.id || index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.15 }}
                                    className="bg-zinc-900 border border-white/5 p-8 rounded-lg"
                                >
                                    <h3 className="text-2xl font-bold mb-3">{palette.title}</h3>
                                    <p className="text-zinc-400 text-sm mb-6">{palette.description}</p>

                                    <div className="grid grid-cols-5 gap-2 mb-4">
                                        {palette.colors.map((color: any, i: number) => (
                                            <div
                                                key={i}
                                                className="aspect-square rounded border border-white/10"
                                                style={{ backgroundColor: color.hex }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>

                                    {palette.tips && (
                                        <div className="bg-black/40 border border-white/10 p-4 rounded">
                                            <p className="text-zinc-300 text-sm">{palette.tips}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Additional Parallax Sections */}
                {parallaxSections.slice(1).map((section, index) => (
                    <div key={section.id || index} className="mb-24 -mx-6">
                        <ParallaxSection
                            image={section.image}
                            title={section.title}
                            height="min-h-[60vh]"
                        />
                    </div>
                ))}

                {/* CTA */}
                <div className="text-center bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-12 rounded">
                    <h2 className="text-4xl font-bold mb-4">Gotowy/a na sesję?</h2>
                    <Link
                        href="/rezerwacja"
                        className="inline-flex items-center gap-3 bg-gold-400 hover:bg-gold-500 text-black font-bold px-10 py-5 rounded-full text-lg"
                    >
                        Zarezerwuj termin →
                    </Link>
                </div>
            </div>
        </main>
    );
}
