'use client';

/**
 * SYNC INTEGRITY (Zero Flower Protocol)
 * [MANUAL FOR AI ASSISTANTS]
 * 
 * 1. KAŻDA strona zarządzalna w Adminie (Slug w tabeli Page) MUSI być renderowana przez ten komponent.
 * 2. ZAKAZ hardkodowania treści jako jedynego źródła prawdy.
 * 3. Zawsze implementuj fallback do PageRenderer w page.tsx danej podstrony.
 * 4. Dodając nowy typ sekcji, pamiętaj o dodaniu go tutaj (switch) ORAZ w PageBuilder.tsx.
 */
import React from 'react';
import { PageSection } from '@/components/admin/PageBuilder';
import ParallaxSection from '@/components/ParallaxSection';
import Link from 'next/link';
import ThermalSlider from '@/components/ThermalSlider';
import Image from 'next/image';
import { Check, Star, Camera, ArrowRight } from 'lucide-react';
import PhotoChallengeBanner from '@/components/PhotoChallengeBanner';
import WhiteInfoBand from '@/components/WhiteInfoBand';
import CarouselGallery from '@/components/VisualEffects/CarouselGallery';
import MasonryGallery from '@/components/VisualEffects/MasonryGallery';
import PuzzleGallery from '@/components/VisualEffects/PuzzleGallery';
import { motion } from 'framer-motion';
import CreativeSlider from '@/components/CreativeSlider';
import TestimonialsSection from '@/components/TestimonialsSection';

export default function PageRenderer({ sections }: { sections: PageSection[] }) {
    if (!sections || sections.length === 0) return null;

    return (
        <div className="flex flex-col gap-0">
            {sections.map((section) => {
                // Determine source of data (flat or nested in .data)
                // This allows PageRenderer to handle both old and new data structures
                const data = section.data || section;

                switch (section.type) {
                    case 'hero_parallax':
                        return (
                            <ParallaxSection
                                key={section.id}
                                image={data.image || ''}
                                title={data.title || ''}
                                height="min-h-[70vh]"
                            />
                        );

                    case 'rich_text':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div
                                    className="mx-auto max-w-4xl prose prose-invert prose-lg
                                        prose-headings:font-display prose-headings:text-white
                                        prose-p:text-zinc-300 prose-p:leading-relaxed
                                        prose-a:text-gold-400 prose-a:no-underline hover:prose-a:text-gold-300
                                        prose-strong:text-white
                                        prose-ul:text-zinc-300 prose-ol:text-zinc-300
                                        prose-li:marker:text-gold-400
                                        prose-img:rounded-xl prose-img:shadow-2xl
                                    "
                                    dangerouslySetInnerHTML={{ __html: data.content || '' }}
                                />
                            </section>
                        );

                    case 'image_text':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
                                    <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl ${data.layout === 'right' ? 'md:order-2' : ''}`}>
                                        {data.image && (
                                            <img
                                                src={data.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className={`prose prose-invert prose-lg ${data.layout === 'right' ? 'md:order-1' : ''}`}>
                                        {data.title && <h2 className="text-3xl md:text-4xl font-bold text-gold-400 mb-6 font-display">{data.title}</h2>}
                                        <div dangerouslySetInnerHTML={{ __html: data.content || '' }} />
                                    </div>
                                </div>
                            </section>
                        );

                    case 'gallery':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div className="mx-auto max-w-6xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {data.images?.map((img: string, idx: number) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                                                <img
                                                    src={img}
                                                    alt=""
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );

                    case 'hero':
                        return (
                            <section key={section.id} className="relative py-32 px-4 bg-zinc-950 flex flex-col items-center justify-center text-center overflow-hidden min-h-[60vh]">
                                {data.image ? (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                            style={{ backgroundImage: `url("${data.image}")` }}
                                        />
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-b from-gold-500/10 to-transparent pointer-events-none" />
                                )}

                                <div className="relative z-10 max-w-4xl space-y-6">
                                    {data.tag && (
                                        <span className="inline-block px-4 py-1.5 bg-gold-500/10 text-gold-500 text-sm font-bold tracking-widest uppercase rounded-full border border-gold-500/20">
                                            {data.tag}
                                        </span>
                                    )}
                                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
                                        {data.title}
                                    </h1>
                                    {data.subtitle && (
                                        <p className="text-xl md:text-2xl text-zinc-400 font-light">
                                            {data.subtitle}
                                        </p>
                                    )}
                                    {data.buttonText && (
                                        <div className="pt-4">
                                            <Link
                                                href={data.buttonLink || '#'}
                                                className="inline-block px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all transform hover:scale-105"
                                            >
                                                {data.buttonText}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </section>
                        );

                    case 'contact':
                        return (
                            <section key={section.id} className="py-20 px-4 bg-black">
                                <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center space-y-8">
                                    <div className="space-y-4">
                                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                                            {data.title}
                                        </h2>
                                        <p className="text-lg text-zinc-400">
                                            {data.subtitle}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link
                                            href={data.buttonLink || '/kontakt'}
                                            className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all transform hover:scale-105"
                                        >
                                            {data.buttonText || 'Skontaktuj się'}
                                        </Link>
                                    </div>
                                </div>
                            </section>
                        );

                    case 'thermal_slider':
                        return (
                            <section key={section.id} className="py-20 bg-zinc-950 overflow-hidden">
                                <div className="max-w-6xl mx-auto px-4">
                                    <div className="mb-12">
                                        {data.title && <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 text-center">{data.title}</h2>}
                                        {data.subtitle && <p className="text-zinc-400 max-w-2xl mx-auto text-center">{data.subtitle}</p>}
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-900/50 p-2">
                                        <ThermalSlider
                                            visualImage={data.image}
                                            thermalImage={data.thermalImage}
                                            labelLeft={data.labelLeft || 'Widok Standardowy'}
                                            labelRight={data.labelRight || 'Termowizja'}
                                            sections={data.thermalSections}
                                            title={data.showCategoryTitle ? data.title : undefined}
                                        />
                                    </div>
                                    {data.content && (
                                        <div
                                            className="mt-12 prose prose-invert prose-lg mx-auto"
                                            dangerouslySetInnerHTML={{ __html: data.content }}
                                        />
                                    )}
                                </div>
                            </section>
                        );

                    case 'hero_slider':
                        const HeroSlider = require('@/components/HeroSlider').default;
                        // Map slides to HeroSlide format if needed
                        const formattedSlides = (data.slides || []).map((s: any) => ({
                            id: s.id,
                            image: s.image,
                            title: s.title || '',
                            subtitle: s.subtitle || '',
                            buttonText: s.buttonText,
                            buttonLink: s.buttonLink
                        }));
                        return (
                            <section key={section.id} className="w-full">
                                <HeroSlider slides={formattedSlides} />
                            </section>
                        );

                    case 'contact_form':
                        const ContactForm = require('@/components/ContactForm').default;
                        return (
                            <section key={section.id} className="py-20 px-4 bg-black">
                                <div className="max-w-4xl mx-auto">
                                    <ContactForm />
                                </div>
                            </section>
                        );

                    // === Legacy / Homepage Types ===
                    case 'about':
                        return (
                            <section key={section.id} className="py-20 px-6 bg-black">
                                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                                    <div className={`relative overflow-hidden flex items-center justify-center ${data.imageShape === 'circle'
                                        ? 'w-64 h-64 md:w-[500px] md:h-[500px] rounded-full mx-auto'
                                        : 'h-[300px] md:h-[500px] rounded-2xl'
                                        } ${data.textPosition === 'left' ? 'md:order-2' : ''}`}>
                                        {data.image && (
                                            <Image
                                                src={data.image}
                                                alt={data.title || "O mnie"}
                                                fill
                                                className={`object-cover ${data.imageShape === 'circle' ? 'rounded-full' : ''}`}
                                            />
                                        )}
                                    </div>
                                    <div className={data.textPosition === 'left' ? 'md:order-1' : ''}>
                                        <h2 className="text-3xl md:text-4xl font-display font-bold text-gold-400 mb-6">
                                            {data.title}
                                        </h2>
                                        <div
                                            className="prose prose-invert text-zinc-300 mb-8 text-lg max-w-none"
                                            dangerouslySetInnerHTML={{ __html: data.content || '' }}
                                        />
                                    </div>
                                </div>
                            </section>
                        );

                    case 'features':
                        const isCentered = data.sectionLayout === 'centered';
                        const isLarge = data.featureSize === 'large';

                        return (
                            <section key={section.id} className="py-20 px-6 bg-black">
                                <div className={`max-w-6xl mx-auto ${isCentered
                                    ? 'flex flex-wrap justify-center gap-8'
                                    : 'grid md:grid-cols-3 gap-8'
                                    }`}>
                                    {data.features?.map((feature: any, index: number) => (
                                        feature.enabled && (
                                            <div key={index}
                                                className={`bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-gold-500/30 transition-colors flex flex-col
                                                     ${isCentered ? 'max-w-md w-full' : ''}
                                                     ${isLarge ? 'p-12' : 'p-8'}
                                                 `}
                                            >
                                                <h3 className={`font-bold text-white mb-4 ${isLarge ? 'text-2xl' : 'text-xl'}`}>{feature.title}</h3>
                                                <ul className="space-y-3 flex-1">
                                                    {feature.items.map((item: string, i: number) => (
                                                        <li key={i} className="flex items-start gap-3 text-zinc-400">
                                                            <Check className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                                                            <span className={isLarge ? 'text-lg' : ''}>{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>

                                                {(feature.buttonText && feature.buttonLink) && (
                                                    <div className="mt-8 pt-6 border-t border-zinc-800">
                                                        <Link
                                                            href={feature.buttonLink}
                                                            className="inline-flex items-center justify-center w-full px-6 py-3 bg-zinc-800 hover:bg-gold-500 hover:text-black text-white font-semibold rounded-lg transition-all group"
                                                        >
                                                            {feature.buttonText}
                                                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    ))}
                                </div>
                            </section>
                        );

                    case 'challenge_banner':
                        return (
                            <PhotoChallengeBanner
                                key={section.id}
                                title={data.title || '📸 Foto Wyzwanie'}
                                subtitle={data.subtitle || 'Pokaż Swoją Kreatywność'}
                                description={data.content || 'Podejmij wyzwanie i wygraj fantastyczne nagrody!'}
                                buttonText={data.buttonText || 'Dołącz Teraz'}
                                buttonLink={data.buttonLink || '/foto-wyzwanie'}
                                layout={data.layout || 'full-width'}
                                accentColor={data.accentColor || 'gold'}
                                animationStyle={data.animationStyle || 'fade'}
                                enableParticles={data.enableParticles !== false}
                                height={data.height || 'min-h-[70vh]'}
                            />
                        );

                    case 'parallax':
                        return (
                            <ParallaxSection
                                key={section.id}
                                {...data}
                                imageSrc={data.imageSrc || data.image} // FIX: Support both keys
                                height="min-h-[60vh] md:min-h-[80vh]"
                            />
                        );

                    case 'info_band':
                        return (
                            <WhiteInfoBand
                                key={section.id}
                                image={data.image}
                                title={data.title}
                                content={data.content}
                                imagePosition={data.position}
                            />
                        );

                    case 'testimonials':
                        return (
                            <div key={section.id} className="py-20 px-4 bg-black">
                                <div className="max-w-6xl mx-auto">
                                    {(data.title || data.subtitle) && (
                                        <div className="text-center mb-12">
                                            {data.title && <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">{data.title}</h2>}
                                            {data.subtitle && <p className="text-zinc-400 max-w-2xl mx-auto">{data.subtitle}</p>}
                                        </div>
                                    )}
                                    <TestimonialsSection />
                                </div>
                            </div>
                        );

                    case 'creative_slider':
                        return (
                            <CreativeSlider
                                key={section.id}
                                slides={data.slides || []}
                                config={data.config || { autoScroll: true, interval: 5, height: '70vh' }}
                            />
                        );

                    default:
                        return null;
                }
            })}
        </div>
    );
}
