'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Camera, ArrowRight, Check } from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';
import ParallaxSection from '@/components/ParallaxSection';
import WhiteInfoBand from '@/components/WhiteInfoBand';
import CarouselGallery from '@/components/VisualEffects/CarouselGallery';
import MasonryGallery from '@/components/VisualEffects/MasonryGallery';
import PuzzleGallery from '@/components/VisualEffects/PuzzleGallery';
import PhotoChallengeBanner from '@/components/PhotoChallengeBanner';
import CreativeSlider from '@/components/CreativeSlider';

interface PortfolioContentProps {
    categories: any[];
    sections: any[];
    fallbackHeroSlides: any[];
    showFallbackHero?: boolean;
    customHeroSlides?: any[];
    isSessionMode?: boolean;
}

export default function PortfolioContent({ categories, sections, fallbackHeroSlides, showFallbackHero = false, customHeroSlides = [], isSessionMode = false }: PortfolioContentProps) {

    // Helper to render dynamic sections (reused logic)
    const renderSection = (section: any) => {
        if (!section.enabled) return null;

        // Common text styles helper
        const getTextColorClass = (variant?: string, bgColor?: string) => {
            if (variant === 'dark') return { heading: 'text-zinc-900', body: 'text-zinc-700' };
            if (variant === 'light') return { heading: 'text-gold-400', body: 'text-zinc-300' };
            if (bgColor === 'white') return { heading: 'text-zinc-900', body: 'text-zinc-700' };
            return { heading: 'text-gold-400', body: 'text-zinc-300' };
        };

        const bgClass = section.backgroundColor === 'white' ? 'bg-white' :
            section.backgroundColor === 'zinc-800' ? 'bg-zinc-800' :
                section.backgroundColor === 'zinc-900' ? 'bg-zinc-900' : 'bg-black';

        const textColors = getTextColorClass(section.textVariant, section.backgroundColor);

        switch (section.type) {
            case 'hero_parallax': // Custom type from page builder
            case 'parallax':
                return (
                    <ParallaxSection
                        key={section.id}
                        {...section.data}
                        imageSrc={section.data.image}
                        height="min-h-[60vh] md:min-h-[80vh]"
                    />
                );

            case 'text':
            case 'about':
                return (
                    <section key={section.id} className={`py-20 px-6 ${bgClass}`}>
                        <div className="max-w-4xl mx-auto text-center">
                            {section.data.title && (
                                <h2 className={`text-3xl md:text-5xl font-display font-bold ${textColors.heading} mb-8`}>
                                    {section.data.title}
                                </h2>
                            )}
                            <div className={`prose prose-invert lg:prose-xl mx-auto ${textColors.body} whitespace-pre-wrap`}>
                                {section.data.content}
                            </div>
                        </div>
                    </section>
                );

            case 'creative_slider':
                return section.data.slides && section.data.slides.length > 0 ? (
                    <CreativeSlider
                        key={section.id}
                        slides={section.data.slides}
                        config={section.data.config}
                    />
                ) : null;

            default:
                return null;
        }
    };

    // Decide what to show at the top:
    // 1. If we have sections, show them.
    // 2. If NO sections, use the Fallback Hero Slider (Homepage Slides).
    // Note: The user said "dodaj opcje, korzystaj z załadowanych zdjęć albo jak nie jest zaznaczona to z głownej strony".
    // Interpreting this as: If no custom content (sections) is provided, fallback to Homepage Hero.

    // Check if there are any "Hero" like sections
    const hasHero = sections.some(s => s.type === 'hero_parallax' || s.type === 'parallax' || s.type === 'creative_slider');

    return (
        <main className="min-h-screen bg-black text-white selection:bg-gold-500 selection:text-black relative z-0">


            {/* Dynamic Sections (Top) */}
            {sections.length > 0 && (
                <div>
                    {sections.map(section => renderSection(section))}
                </div>
            )}

            {/* Hero Slider Logic
                1. Custom Portfolio Slides (Priority 1)
                2. Fallback Home Slider (Priority 2 - if enabled)
                3. Minimal Header (Fallback if nothing else)
            */}
            {(customHeroSlides.length > 0) ? (
                <HeroSlider slides={customHeroSlides} />
            ) : (showFallbackHero) && fallbackHeroSlides.length > 0 ? (
                <HeroSlider slides={fallbackHeroSlides} />
            ) : null}

            {/* Fallback Static Header (If no sections AND no slider shown) */}
            {sections.length === 0 && customHeroSlides.length === 0 && !showFallbackHero && (
                <section className="pt-40 pb-20 px-6 text-center">
                    <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 font-display text-white">
                        PORTFOLIO
                    </h1>
                    <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide uppercase font-sans">
                        Wybrane historie
                    </p>
                </section>
            )}

            {/* Cinematic List (The Core Portfolio) */}
            <section id="portfolio-content" className="pb-32 px-0 md:px-8 max-w-[1920px] mx-auto pt-12">
                {/* Optional divider if sections exist */}
                {sections.length > 0 && <div className="mb-16 border-t border-white/10" />}

                <div className="flex flex-col gap-0">
                    {categories.map((category, index) => (
                        <Link
                            key={category.slug}
                            href={isSessionMode ? `/portfolio/sesja/${category.slug}` : `/portfolio/${category.slug}`}
                            className="group relative block w-full overflow-hidden"
                        >
                            {/* Wrapper for aspect ratio / sizing */}
                            <div className="relative w-full">
                                {category.coverImage ? (
                                    /* Image - Full Width, Aspect Ratio Maintained */
                                    <div className="relative w-full overflow-hidden aspect-[16/9]">
                                        <img
                                            src={category.coverImage}
                                            alt={category.title}
                                            className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full h-[60vh] bg-zinc-900 flex items-center justify-center">
                                        <Camera className="w-16 h-16 text-zinc-800" />
                                    </div>
                                )}
                            </div>

                            {/* Bottom Fade & Blur Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/60 to-transparent backdrop-blur-[2px] opacity-90 transition-opacity duration-500" />

                            {/* Content - Bottom Right */}
                            <div className="absolute inset-0 flex flex-col items-end justify-end p-8 md:p-12 z-10">
                                <div className="text-right max-w-3xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
                                    {/* Image Count - Top Right of text block */}
                                    <div className="text-xs font-mono text-gold-500 mb-2 uppercase tracking-widest opacity-80">
                                        {category.imageCount} zdjęć
                                    </div>

                                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-2 font-display tracking-tight uppercase drop-shadow-lg">
                                        {category.title}
                                    </h2>

                                    <div className="flex justify-end mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                                        <span className="flex items-center gap-2 text-gold-400 text-sm md:text-base font-bold tracking-widest uppercase">
                                            Zobacz sesję <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {categories.length === 0 && (
                    <div className="text-center py-32">
                        <p className="text-zinc-500 text-xl">Ładowanie portfolio...</p>
                    </div>
                )}
            </section>

            {/* CTA Section (Always visible) */}
            <section className="py-32 bg-zinc-950 border-t border-white/10">
                <div className="mx-auto max-w-4xl text-center px-6">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 font-display">
                        Stwórzmy razem coś pięknego
                    </h2>
                    <Link
                        href="/rezerwacja"
                        className="inline-block bg-white text-black px-10 py-4 rounded-full text-lg font-bold tracking-wide hover:bg-gold-400 transition-colors duration-300 font-sans"
                    >
                        ZAREZERWUJ TERMIN
                    </Link>
                </div>
            </section>
        </main>
    );
}
