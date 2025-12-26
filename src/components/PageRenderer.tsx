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

export default function PageRenderer({ sections }: { sections: PageSection[] }) {
    if (!sections || sections.length === 0) return null;

    return (
        <div className="flex flex-col gap-0">
            {sections.map((section) => {
                switch (section.type) {
                    case 'hero_parallax':
                        return (
                            <ParallaxSection
                                key={section.id}
                                image={section.image || ''}
                                title={section.title || ''}
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
                                    dangerouslySetInnerHTML={{ __html: section.content || '' }}
                                />
                            </section>
                        );

                    case 'image_text':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
                                    <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl ${section.layout === 'right' ? 'md:order-2' : ''}`}>
                                        {section.image && (
                                            <img
                                                src={section.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className={`prose prose-invert prose-lg ${section.layout === 'right' ? 'md:order-1' : ''}`}>
                                        <div dangerouslySetInnerHTML={{ __html: section.content || '' }} />
                                    </div>
                                </div>
                            </section>
                        );

                    case 'gallery':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div className="mx-auto max-w-6xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {section.images?.map((img, idx) => (
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
                                {section.image ? (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                            style={{ backgroundImage: `url("${section.image}")` }}
                                        />
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-b from-gold-500/10 to-transparent pointer-events-none" />
                                )}

                                <div className="relative z-10 max-w-4xl space-y-6">
                                    {section.tag && (
                                        <span className="inline-block px-4 py-1.5 bg-gold-500/10 text-gold-500 text-sm font-bold tracking-widest uppercase rounded-full border border-gold-500/20">
                                            {section.tag}
                                        </span>
                                    )}
                                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
                                        {section.title}
                                    </h1>
                                    {section.subtitle && (
                                        <p className="text-xl md:text-2xl text-zinc-400 font-light">
                                            {section.subtitle}
                                        </p>
                                    )}
                                    {section.buttonText && (
                                        <div className="pt-4">
                                            <Link
                                                href={section.buttonLink || '#'}
                                                className="inline-block px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all transform hover:scale-105"
                                            >
                                                {section.buttonText}
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
                                            {section.title}
                                        </h2>
                                        <p className="text-lg text-zinc-400">
                                            {section.subtitle}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <Link
                                            href={section.buttonLink || '/kontakt'}
                                            className="px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl transition-all transform hover:scale-105"
                                        >
                                            {section.buttonText || 'Skontaktuj się'}
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
                                        {section.title && <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 text-center">{section.title}</h2>}
                                        {section.subtitle && <p className="text-zinc-400 max-w-2xl mx-auto text-center">{section.subtitle}</p>}
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-zinc-900/50 p-2">
                                        <ThermalSlider
                                            visualImage={section.image}
                                            thermalImage={section.thermalImage}
                                            labelLeft={section.labelLeft || 'Widok Standardowy'}
                                            labelRight={section.labelRight || 'Termowizja'}
                                            sections={section.thermalSections}
                                            title={section.showCategoryTitle ? section.title : undefined}
                                        />
                                    </div>
                                    {section.content && (
                                        <div
                                            className="mt-12 prose prose-invert prose-lg mx-auto"
                                            dangerouslySetInnerHTML={{ __html: section.content }}
                                        />
                                    )}
                                </div>
                            </section>
                        );

                    case 'hero_slider':
                        const HeroSlider = require('@/components/HeroSlider').default;
                        // Map slides to HeroSlide format if needed
                        const formattedSlides = (section.slides || []).map(s => ({
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

                    default:
                        return null;
                }
            })}
        </div>
    );
}
