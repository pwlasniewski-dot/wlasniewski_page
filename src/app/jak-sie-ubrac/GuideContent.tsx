"use client";

import React from "react";
import Link from "next/link";
import ParallaxSection from "@/components/ParallaxSection";
import { motion } from "framer-motion";
import EffectWrapper from "@/components/VisualEffects/EffectWrapper";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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
                        <div className="guide-swiper-container">
                            <Swiper
                                modules={[Navigation, Pagination]}
                                spaceBetween={30}
                                slidesPerView={1}
                                navigation
                                pagination={{ clickable: true }}
                                breakpoints={{
                                    768: {
                                        slidesPerView: 2,
                                    }
                                }}
                                className="pb-12"
                            >
                                {colorPalettes.map((palette, index) => (
                                    <SwiperSlide key={palette.id || index} className="h-auto">
                                        <div className="bg-zinc-900 border border-white/5 p-8 rounded-lg h-full flex flex-col justify-start">
                                            <h3 className="text-3xl md:text-4xl font-bold mb-4 text-gold-400">{palette.title}</h3>
                                            <p className="text-zinc-300 text-lg mb-8">{palette.description}</p>

                                            <div className="grid grid-cols-5 gap-3 mb-8">
                                                {palette.colors.map((color: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className="aspect-square rounded-lg border border-white/10 shadow-lg transform hover:scale-105 transition-transform"
                                                        style={{ backgroundColor: color.hex }}
                                                        title={color.name}
                                                    />
                                                ))}
                                            </div>

                                            {palette.tips && (
                                                <div className="bg-black/40 border border-white/10 p-6 rounded-lg mt-auto">
                                                    <p className="text-zinc-200 italic text-base leading-relaxed">"{palette.tips}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                        <style jsx global>{`
                            .guide-swiper-container .swiper-button-next,
                            .guide-swiper-container .swiper-button-prev {
                                color: #fbbf24;
                            }
                            .guide-swiper-container .swiper-pagination-bullet {
                                background: #71717a;
                            }
                            .guide-swiper-container .swiper-pagination-bullet-active {
                                background: #fbbf24;
                            }
                            .guide-swiper-container .swiper-slide {
                                height: auto;
                            }
                        `}</style>
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
