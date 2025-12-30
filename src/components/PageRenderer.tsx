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
import { Check, Star } from 'lucide-react';
import PhotoChallengeBanner from '@/components/PhotoChallengeBanner';
import WhiteInfoBand from '@/components/WhiteInfoBand';
import CarouselGallery from '@/components/VisualEffects/CarouselGallery';
import MasonryGallery from '@/components/VisualEffects/MasonryGallery';
import PuzzleGallery from '@/components/VisualEffects/PuzzleGallery';
import { motion, AnimatePresence } from 'framer-motion';
import CreativeSlider from '@/components/CreativeSlider';
import TestimonialsSection from '@/components/TestimonialsSection';
import ContactForm from '@/components/ContactForm';
import B2BContactForm from '@/components/B2BContactForm';
import ThermalHeroSlider from '@/components/ThermalHeroSlider';
import HeroVideoSlider from '@/components/HeroVideoSlider';
import ParallaxVideo from '@/components/ParallaxVideo';
import ThermalReportShowcase from '@/components/ThermalReportShowcase';
import { ShieldCheck, Zap, ArrowRight, Workflow, FileText, Briefcase, CheckCircle2, Maximize2, X, Camera } from 'lucide-react';

export default function PageRenderer({ sections }: { sections: PageSection[] }) {
    const [selectedCert, setSelectedCert] = React.useState<any>(null);
    const [activeCertSection, setActiveCertSection] = React.useState<any>(null);
    const [selectedCase, setSelectedCase] = React.useState<any>(null);
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
                                    className={`mx-auto max-w-4xl prose prose-invert prose-lg prose-inline-styles
                                        prose-headings:font-display prose-headings:text-white
                                        prose-p:text-zinc-300 prose-p:leading-relaxed
                                        prose-a:text-gold-400 prose-a:no-underline hover:prose-a:text-gold-300
                                        prose-strong:text-white
                                        prose-ul:text-zinc-300 prose-ol:text-zinc-300
                                        prose-li:marker:text-gold-400
                                        prose-img:rounded-xl prose-img:shadow-2xl
                                    `}
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
                                    <div className={`prose prose-invert prose-lg prose-inline-styles ${data.layout === 'right' ? 'md:order-1' : ''}`}>
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
                                {data.videoUrl ? (
                                    <div className="absolute inset-0 overflow-hidden">
                                        {data.videoType === 'direct' ? (
                                            <video
                                                src={data.videoUrl}
                                                autoPlay={data.videoAutoPlay !== false}
                                                muted={data.videoMuted !== false}
                                                loop={data.videoLoop !== false}
                                                className="w-full h-full object-cover"
                                                playsInline
                                            />
                                        ) : (
                                            <iframe
                                                src={data.videoType === 'vimeo'
                                                    ? `https://player.vimeo.com/video/${data.videoUrl.split('/').pop()}?autoplay=1&muted=1&loop=1&background=1`
                                                    : `https://www.youtube.com/embed/${(data.videoUrl.match(/[?&]v=([^&]+)/) || [null, data.videoUrl.split('/').pop()])[1]}?autoplay=1&mute=1&loop=1&playlist=${(data.videoUrl.match(/[?&]v=([^&]+)/) || [null, data.videoUrl.split('/').pop()])[1]}&controls=0&showinfo=0&rel=0`}
                                                className="absolute inset-0 w-full h-[120%] -top-[10%] pointer-events-none"
                                                frameBorder="0"
                                                allow="autoplay; fullscreen"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
                                    </div>
                                ) : data.image ? (
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
                                    <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight" dangerouslySetInnerHTML={{ __html: data.title || '' }} />
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
                            <section key={section.id} className="py-24 bg-zinc-950 overflow-hidden px-4 md:px-6">
                                <div className="max-w-[1400px] mx-auto">
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
                                            switchInterval={data.switchInterval}
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
                                subtitle={data.subtitle}
                                content={data.content}
                                items={data.infoband_items}
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

                    case 'certificates':
                        return (
                            <section key={section.id} className="py-32 px-6 max-w-7xl mx-auto relative overflow-hidden">
                                {/* Background decorations */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />

                                <div className="text-center mb-20 relative z-10">
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[11px] font-bold uppercase tracking-[0.3em] mb-6"
                                    >
                                        <ShieldCheck size={14} /> Gwarancja Ekspertyzy
                                    </motion.div>
                                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                                        Potwierdzona <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-600">profesjonalność</span>
                                    </h2>
                                </div>

                                <div className={`grid gap-10 relative z-10 ${section.certificateSize === 'readable' ? 'grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto' :
                                    section.certificateSize === 'large' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 max-w-6xl mx-auto' :
                                        section.certificateSize === 'small' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4' :
                                            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                                    }`}>
                                    {data.certificates?.map((cert: any, i: number) => (
                                        <motion.div
                                            key={cert.id || i}
                                            initial={{ opacity: 0, y: 30 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1, duration: 0.5 }}
                                            className="group"
                                        >
                                            <div className="relative p-1 rounded-[32px] bg-gradient-to-b from-white/10 to-transparent transition-all duration-500 group-hover:from-yellow-500/40 group-hover:to-yellow-500/5 shadow-2xl h-full">
                                                <div className={`bg-zinc-950 rounded-[30px] h-full border border-white/5 relative overflow-hidden flex flex-col ${section.certificateSize === 'readable' ? 'p-10 md:p-16' :
                                                    section.certificateSize === 'large' ? 'p-8 md:p-10' : 'p-6'
                                                    }`}>
                                                    {/* Inner Glow */}
                                                    <div className="absolute -top-48 -right-48 w-96 h-96 bg-yellow-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                                    {/* Main Certificate Display Area - Priority on visibility */}
                                                    <div
                                                        onClick={() => { setSelectedCert(cert); setActiveCertSection(section); }}
                                                        className={`relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 cursor-pointer group/img flex items-center justify-center p-4 shadow-inner ${section.certificateSize === 'readable' ? 'aspect-[3/4] mb-12 border-white/10' :
                                                            section.certificateSize === 'large' ? 'aspect-[3/4] mb-8' :
                                                                section.certificateSize === 'small' ? 'aspect-[3/4] mb-4' :
                                                                    'aspect-[3/4] mb-6'
                                                            }`}
                                                    >
                                                        {cert.image ? (
                                                            <img
                                                                src={cert.image}
                                                                alt={cert.title}
                                                                className="w-full h-full object-contain transition-transform duration-700 group-hover/img:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-zinc-900/50">
                                                                <ShieldCheck className="text-yellow-500/20" size={64} />
                                                                <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Podgląd niedostępny</span>
                                                            </div>
                                                        )}

                                                        {/* Overlay on hover */}
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[1px]">
                                                            <div className="bg-yellow-500 p-6 rounded-full text-black scale-90 group-hover/img:scale-100 transition-all shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                                                                <Maximize2 size={section.certificateSize === 'readable' ? 48 : 32} />
                                                            </div>
                                                            <span className="mt-6 text-white text-[12px] font-bold uppercase tracking-[0.2em] opacity-0 group-hover/img:opacity-100 transition-opacity">
                                                                Kliknij aby powiększyć
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col flex-grow relative z-10">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-[10px] text-yellow-500 font-bold uppercase tracking-widest">
                                                                Verified Credentials
                                                            </span>
                                                            <span className="text-zinc-600">•</span>
                                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase tracking-tighter">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                                                                Status: Aktywny
                                                            </div>
                                                        </div>

                                                        <h3 className={`font-bold text-white mb-2 group-hover:text-yellow-500 transition-colors line-clamp-2 ${section.certificateSize === 'readable' ? 'text-4xl' :
                                                            section.certificateSize === 'large' ? 'text-2xl' : 'text-xl'
                                                            }`}>
                                                            {cert.title}
                                                        </h3>

                                                        {cert.subtitle && (
                                                            <p className={`text-zinc-500 font-medium uppercase tracking-widest ${section.certificateSize === 'readable' ? 'text-base mb-10' :
                                                                section.certificateSize === 'large' ? 'text-xs mb-6' : 'text-[10px] mb-4'
                                                                }`}>
                                                                {cert.subtitle}
                                                            </p>
                                                        )}

                                                        <button
                                                            onClick={() => { setSelectedCert(cert); setActiveCertSection(section); }}
                                                            className={`mt-auto w-full py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl font-bold text-zinc-300 uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn ${section.certificateSize === 'readable' ? 'text-sm py-5' :
                                                                section.certificateSize === 'large' ? 'text-xs py-4' : 'text-[10px]'
                                                                }`}
                                                        >
                                                            Szczegóły uprawnień
                                                            <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </section>
                        );

                    case 'b2b_hero':
                        return (
                            <section key={section.id} className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-24 px-6">
                                {/* Background Video or Image */}
                                {data.videoUrl ? (
                                    <div className="absolute inset-0 overflow-hidden">
                                        {data.videoType === 'direct' ? (
                                            <video
                                                src={data.videoUrl}
                                                autoPlay={data.videoAutoPlay !== false}
                                                muted={data.videoMuted !== false}
                                                loop={data.videoLoop !== false}
                                                className="w-full h-full object-cover"
                                                playsInline
                                            />
                                        ) : (
                                            <iframe
                                                src={data.videoType === 'vimeo'
                                                    ? `https://player.vimeo.com/video/${data.videoUrl.split('/').pop()}?autoplay=1&muted=1&loop=1&background=1`
                                                    : `https://www.youtube.com/embed/${(data.videoUrl.match(/[?&]v=([^&]+)/) || [null, data.videoUrl.split('/').pop()])[1]}?autoplay=1&mute=1&loop=1&playlist=${(data.videoUrl.match(/[?&]v=([^&]+)/) || [null, data.videoUrl.split('/').pop()])[1]}&controls=0&showinfo=0&rel=0`}
                                                className="absolute inset-0 w-full h-[120%] -top-[10%] pointer-events-none"
                                                frameBorder="0"
                                                allow="autoplay; fullscreen"
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-black/50" />
                                    </div>
                                ) : data.image ? (
                                    <>
                                        <div
                                            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                            style={{ backgroundImage: `url("${data.image}")` }}
                                        />
                                        <div className="absolute inset-0 bg-black/50" />
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,215,0,0.05),transparent_70%)]" />
                                )}

                                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                <div className="relative max-w-5xl mx-auto text-center z-10">
                                    {data.tag && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-8"
                                        >
                                            <Zap size={12} className="fill-yellow-500/20" /> {data.tag}
                                        </motion.div>
                                    )}
                                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-[1.1] tracking-tight" dangerouslySetInnerHTML={{ __html: data.title || '' }} />
                                    <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">{data.subtitle}</p>
                                    {data.buttonText && (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
                                            <Link href={data.buttonLink || '#kontakt'} className="inline-flex items-center gap-2 bg-white text-black font-bold px-10 py-5 rounded-full hover:bg-yellow-500 transition-all group hover:scale-105 active:scale-95">
                                                {data.buttonText}
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Abstract Decoration */}
                                <div className="absolute top-1/4 -right-24 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-1/4 -left-24 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
                            </section>
                        );

                    case 'b2b_stats':
                        return (
                            <section key={section.id} className="py-24 bg-zinc-950 overflow-hidden px-4 md:px-6">
                                <div className="max-w-[1400px] mx-auto">
                                    <div className="mb-12">
                                        {data.title && <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4 text-center">{data.title}</h2>}
                                        {data.subtitle && <p className="text-zinc-400 max-w-2xl mx-auto text-center">{data.subtitle}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {data.b2b_stats?.map((stat: any, i: number) => (
                                            <motion.div key={stat.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="relative p-10 bg-zinc-900/30 border border-white/5 rounded-3xl hover:border-white/10 transition-colors group text-center">
                                                <div className="text-5xl md:text-6xl font-black text-white mb-4 tracking-tighter flex items-center justify-center gap-1 group-hover:scale-110 transition-transform duration-500">
                                                    {stat.prefix && <span className="text-yellow-500 text-3xl font-bold">{stat.prefix}</span>}
                                                    {stat.value}
                                                    {stat.suffix && <span className="text-yellow-500 text-3xl font-bold">{stat.suffix}</span>}
                                                </div>
                                                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">{stat.label}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );

                    case 'b2b_logos':
                        return (
                            <section key={section.id} className="py-16 bg-zinc-900/30 border-y border-white/5 px-4 md:px-6">
                                <div className="max-w-[1400px] mx-auto">
                                    <h4 className="text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mb-12">Zaufali nam liderzy branży</h4>
                                    <div className="flex flex-wrap justify-center gap-12 md:gap-24 items-center opacity-40 grayscale transition-all duration-700 hover:grayscale-0 hover:opacity-100">
                                        {data.b2b_logos?.map((logo: any, i: number) => (
                                            <motion.div key={logo.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="h-8 md:h-10 shrink-0">
                                                <img src={logo.image} alt={logo.name || 'Partner'} className="h-full w-auto object-contain filter invert opacity-80" />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );

                    case 'b2b_process':
                        return (
                            <section key={section.id} className="py-40 px-6 relative overflow-hidden">
                                {/* Technical Background Elements */}
                                <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                                <div className="max-w-7xl mx-auto relative z-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
                                        <div className="sticky top-32">
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8"
                                            >
                                                <Workflow size={12} className="animate-spin-slow" /> {data.subtitle || 'Ecosystem Operacyjny'}
                                            </motion.div>

                                            <h2 className="text-5xl md:text-7xl font-bold text-white mb-10 leading-[1.05] tracking-tight"
                                                dangerouslySetInnerHTML={{ __html: data.title || 'Inżynieria procesowa <span class="text-yellow-500">bez kompromisów.</span>' }}
                                            />

                                            <p className="text-zinc-400 text-lg mb-12 max-w-lg leading-relaxed">
                                                Dostarczamy dane najwyższej jakości dzięki zdefiniowanym protokołom operacyjnym i rygorystycznym standardom bezpieczeństwa.
                                            </p>

                                            <div className="grid grid-cols-2 gap-8">
                                                <motion.div
                                                    whileHover={{ y: -5 }}
                                                    className="p-8 bg-zinc-900/50 backdrop-blur-md rounded-[32px] border border-white/5 relative group"
                                                >
                                                    <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
                                                    <ShieldCheck className="text-yellow-500 mb-6" size={32} />
                                                    <p className="text-white font-black text-xs uppercase tracking-widest mb-2">{data.featureTitle || 'Standardy LUC'}</p>
                                                    <p className="text-[10px] text-zinc-500 font-bold tracking-tight uppercase">{data.featureContent || 'Pełna zgodność z EASA'}</p>
                                                </motion.div>

                                                <motion.div
                                                    whileHover={{ y: -5 }}
                                                    className="p-8 bg-zinc-900/50 backdrop-blur-md rounded-[32px] border border-white/5 relative group"
                                                >
                                                    <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
                                                    <Zap className="text-blue-400 mb-6" size={32} />
                                                    <p className="text-white font-black text-xs uppercase tracking-widest mb-2">Czas Reakcji</p>
                                                    <p className="text-[10px] text-zinc-500 font-bold tracking-tight uppercase">SLA 24h / 48h</p>
                                                </motion.div>
                                            </div>
                                        </div>

                                        <div className="space-y-8 relative">
                                            {/* Vertical Connect Line */}
                                            <div className="absolute left-[39px] top-10 bottom-10 w-px bg-gradient-to-b from-yellow-500/50 via-zinc-800 to-transparent hidden md:block" />

                                            {data.b2b_process?.map((step: any, i: number) => (
                                                <motion.div
                                                    key={step.id || i}
                                                    initial={{ opacity: 0, x: 30 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.15, duration: 0.6 }}
                                                    className="group relative pl-0 md:pl-20"
                                                >
                                                    {/* Step Number with Pulsing Indicator */}
                                                    <div className="hidden md:flex absolute left-0 top-0 w-20 items-center justify-center">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-white text-xs font-black z-10 group-hover:border-yellow-500/50 group-hover:text-yellow-500 transition-all duration-500">
                                                            {i + 1}
                                                        </div>
                                                        <div className="absolute w-14 h-14 rounded-full border border-yellow-500/0 group-hover:border-yellow-500/20 group-hover:scale-125 transition-all duration-700 pointer-events-none" />
                                                    </div>

                                                    <div className="p-10 bg-zinc-900/40 backdrop-blur-sm border border-white/5 rounded-[40px] hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-500 relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 p-8 text-8xl font-black text-white/[0.02] group-hover:text-yellow-500/[0.05] transition-colors select-none">
                                                            0{i + 1}
                                                        </div>

                                                        <div className="relative z-10">
                                                            <div className="flex items-center gap-4 mb-4 md:hidden">
                                                                <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 text-[10px] font-black">
                                                                    {i + 1}
                                                                </div>
                                                                <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Krok Procesu</div>
                                                            </div>

                                                            <h4 className="text-2xl font-bold text-white mb-4 group-hover:text-yellow-400 transition-colors">
                                                                {step.title}
                                                            </h4>
                                                            <p className="text-zinc-500 text-sm leading-relaxed max-w-md">
                                                                {step.description}
                                                            </p>

                                                            <div className="mt-8 flex items-center gap-4">
                                                                <div className="h-px w-8 bg-zinc-800" />
                                                                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                                                                    Verified Operation
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );

                    case 'b2b_cases':
                        return (
                            <section key={section.id} className="py-24 md:py-32 px-4 md:px-6 relative overflow-hidden">
                                {/* Ambient Background Particles/Flares */}
                                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />
                                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

                                <div className="max-w-[1400px] mx-auto relative z-10">
                                    <div className="mb-20">
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-6"
                                        >
                                            <Briefcase size={14} className="fill-orange-400/20" /> Case Studies
                                        </motion.div>
                                        <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-none mb-4">
                                            Przykładowe <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-200">realizacje</span>
                                        </h2>
                                        <div className="h-1 w-24 bg-gradient-to-r from-yellow-500 to-transparent rounded-full" />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                        {data.b2b_cases?.map((caseStudy: any, i: number) => (
                                            <motion.div
                                                key={caseStudy.id || i}
                                                initial={{ opacity: 0, y: 40 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                                                className="group relative h-[600px] rounded-[48px] overflow-hidden border border-white/10 bg-zinc-900"
                                            >
                                                {/* Background Image - Optimized for visibility */}
                                                {caseStudy.image ? (
                                                    <div className="absolute inset-0 transition-transform duration-[2000ms] ease-out group-hover:scale-105">
                                                        <div
                                                            className="absolute inset-0 bg-cover bg-center blur-xl opacity-20 scale-110"
                                                            style={{ backgroundImage: `url("${caseStudy.image}")` }}
                                                        />
                                                        <img
                                                            src={caseStudy.image}
                                                            alt=""
                                                            className="w-full h-full object-contain relative z-10 p-4 transition-all duration-700"
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-20" />
                                                    </div>
                                                ) : (
                                                    <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                                                        <Camera size={64} className="text-zinc-800" />
                                                    </div>
                                                )}

                                                {/* Decorative Accent Line */}
                                                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-yellow-500 via-yellow-300 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700 delay-100" />

                                                {/* Content Overlay */}
                                                <div className="absolute inset-0 p-10 md:p-14 flex flex-col justify-end z-20">
                                                    <div className="space-y-4 translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
                                                        <motion.div className="flex items-center gap-3">
                                                            <div className="w-8 h-[1px] bg-yellow-500" />
                                                            <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.4em]">
                                                                {caseStudy.client || 'Realizacja Premium'}
                                                            </p>
                                                        </motion.div>

                                                        <h3 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] tracking-tight group-hover:text-yellow-400 transition-colors">
                                                            {caseStudy.title}
                                                        </h3>

                                                        {/* Description - Revealed on hover */}
                                                        <div className="max-h-0 opacity-0 group-hover:max-h-48 group-hover:opacity-100 transition-all duration-700 overflow-hidden">
                                                            <p className="text-zinc-400 text-sm leading-relaxed mb-6 mt-4">
                                                                {caseStudy.description}
                                                            </p>
                                                            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">Case ID: #DPR-{i + 101}</span>
                                                                </div>
                                                                <button
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedCase(caseStudy); }}
                                                                    className="flex items-center gap-3 px-6 py-2.5 bg-white text-black text-xs font-black uppercase tracking-widest rounded-full hover:bg-yellow-500 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/20 group/btn"
                                                                >
                                                                    Szczegóły projektu
                                                                    <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="hidden md:flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-300">
                                                            <Zap size={10} className="text-yellow-500" /> Case ID: #{i + 1}024
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Corner Decoration */}
                                                <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-white/10 rounded-tr-2xl group-hover:border-yellow-500/40 transition-colors duration-500" />

                                                {/* Hover Glow Effect */}
                                                <div className="absolute -inset-24 bg-yellow-500/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Bottom CTA for Section */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        className="mt-20 flex flex-col items-center text-center space-y-6"
                                    >
                                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em]">Realizujemy najbardziej wymagające zlecenia</p>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-px bg-zinc-800" />
                                            <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                            <div className="w-12 h-px bg-zinc-800" />
                                        </div>
                                    </motion.div>
                                </div>
                            </section>
                        );

                    case 'thermal_hero':
                        return (
                            <ThermalHeroSlider
                                key={section.id}
                                slides={data.thermal_hero_slides || []}
                                interval={(data.switchInterval || 10) * 1000}
                            />
                        );

                    case 'hero_video':
                        return (
                            <HeroVideoSlider
                                key={section.id}
                                slides={data.slides || []}
                            />
                        );

                    case 'parallax_video':
                        return (
                            <ParallaxVideo
                                key={section.id}
                                videoUrl={data.videoUrl || ''}
                                title={data.title}
                                subtitle={data.subtitle}
                                overlayOpacity={data.overlayOpacity}
                            />
                        );

                    case 'thermal_report':
                        return (
                            <ThermalReportShowcase
                                key={section.id}
                                title={data.title}
                                subtitle={data.subtitle}
                                reports={data.thermal_reports || []}
                            />
                        );

                    case 'b2b_video':
                        const getYouTubeId = (url: string) => {
                            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                            const match = url.match(regExp);
                            return (match && match[2].length === 11) ? match[2] : url;
                        };
                        const getVimeoId = (url: string) => {
                            const regExp = /vimeo\.com\/(?:video\/)?([0-9]+)/;
                            const match = url.match(regExp);
                            return match ? match[1] : url;
                        };

                        const videoId = data.videoType === 'youtube' ? getYouTubeId(data.videoUrl || '') :
                            data.videoType === 'vimeo' ? getVimeoId(data.videoUrl || '') : '';

                        return (
                            <section key={section.id} className={`py-16 md:py-24 bg-zinc-950 ${data.sectionLayout === 'full' ? 'px-0' : 'px-4 md:px-6'}`}>
                                <div className={`${data.sectionLayout === 'full' ? 'w-full' : 'max-w-[1400px] mx-auto'}`}>
                                    {(data.title || data.subtitle) && (
                                        <div className="text-center mb-12 md:mb-16 px-6">
                                            {data.title && <h2 className="text-3xl md:text-6xl font-bold text-white mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: data.title }} />}
                                            {data.subtitle && <p className="text-zinc-500 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">{data.subtitle}</p>}
                                        </div>
                                    )}

                                    <div className={`relative aspect-video bg-black overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] ${data.sectionLayout === 'centered' ? 'rounded-2xl md:rounded-[40px] border border-white/5 mx-auto' : ''}`}>
                                        {data.videoType === 'direct' ? (
                                            <video
                                                src={data.videoUrl}
                                                autoPlay={data.videoAutoPlay}
                                                muted={data.videoMuted}
                                                loop={data.videoLoop}
                                                playsInline
                                                controls={!data.videoAutoPlay}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : data.videoType === 'vimeo' ? (
                                            <iframe
                                                src={`https://player.vimeo.com/video/${videoId}?autoplay=${data.videoAutoPlay ? 1 : 0}&muted=${data.videoMuted ? 1 : 0}&loop=${data.videoLoop ? 1 : 0}&background=${data.videoAutoPlay ? 1 : 0}`}
                                                className="absolute inset-0 w-full h-full"
                                                frameBorder="0"
                                                allow="autoplay; fullscreen; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}?autoplay=${data.videoAutoPlay ? 1 : 0}&mute=${data.videoMuted ? 1 : 0}&loop=${data.videoLoop ? 1 : 0}&playlist=${videoId}&controls=${data.videoAutoPlay ? 0 : 1}&rel=0`}
                                                className="absolute inset-0 w-full h-full"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        )}
                                    </div>
                                </div>
                            </section>
                        );

                    case 'b2b_contact':
                        return (
                            <section key={section.id} id="rfq" className="py-24 md:py-32 px-4 md:px-6">
                                <div className="max-w-[1400px] mx-auto">
                                    <div className="bg-zinc-900 border border-white/5 rounded-3xl md:rounded-[40px] overflow-hidden shadow-2xl">
                                        <div className="flex flex-col lg:flex-row">
                                            {/* Info Column */}
                                            <div className="lg:w-1/3 p-8 md:p-12 lg:p-16 bg-zinc-800/50 border-b lg:border-b-0 lg:border-r border-white/5">
                                                <h2
                                                    className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight"
                                                    dangerouslySetInnerHTML={{ __html: section.title || 'Zapytaj o <span class="text-yellow-500">ofertę B2B.</span>' }}
                                                />
                                                <p className="text-zinc-400 text-lg mb-12">
                                                    {section.subtitle || 'Nasz doradca techniczny skontaktuje się z Tobą w ciągu 4 godzin roboczych.'}
                                                </p>
                                                <div className="space-y-4">
                                                    {['Bezpośrednie wsparcie inżyniera', 'Darmowa analiza wykonalności'].map((item, i) => (
                                                        <div key={i} className="flex items-center gap-4 text-white font-medium">
                                                            <CheckCircle2 className="text-yellow-500" size={20} /> {item}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="relative z-10 w-full">
                                                <B2BContactForm />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        );

                    default:
                        return null;
                }
            })}

            {/* SHARED MODALS & LIGHTBOXES */}
            <AnimatePresence>
                {selectedCert && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-10 pointer-events-auto overflow-y-auto"
                    >
                        {/* Improved Backdrop for Mobile */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setSelectedCert(null); setActiveCertSection(null); }}
                            className="fixed inset-0 bg-black/95 backdrop-blur-md cursor-zoom-out"
                        />

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full md:max-w-5xl md:h-auto min-h-full md:min-h-0 bg-zinc-900 rounded-none md:rounded-[40px] shadow-2xl overflow-hidden border-0 md:border border-white/10 flex flex-col md:flex-row group z-10"
                        >
                            {/* ENHANCED CLOSE BUTTON */}
                            <button
                                onClick={() => setSelectedCert(null)}
                                className="absolute top-6 right-6 z-[60] p-4 bg-black/50 hover:bg-yellow-500 hover:text-black rounded-full text-white transition-all border border-white/20 backdrop-blur-xl shadow-2xl"
                                aria-label="Zamknij"
                            >
                                <X size={28} />
                            </button>

                            {/* Certificate Image Side */}
                            <div className="md:w-1/3 bg-black relative flex items-center justify-center p-8 md:p-12 border-b md:border-b-0 md:border-r border-white/5 shrink-0">
                                {selectedCert.image && (
                                    <img
                                        src={selectedCert.image}
                                        alt={selectedCert.title}
                                        className="w-full h-auto max-h-[40vh] md:max-h-none object-contain rounded-lg drop-shadow-2xl transition-transform duration-700 group-hover:scale-[1.05]"
                                    />
                                )}
                                <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-40">
                                    <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-[8px] font-black text-yellow-500 uppercase tracking-widest">
                                        {activeCertSection?.verifiedTag || "Verified Document"}
                                    </div>
                                </div>
                            </div>

                            {/* Info Side */}
                            <div className="md:w-2/3 p-8 md:p-12 flex flex-col overflow-y-auto max-h-[60vh] md:max-h-none">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-8 self-start">
                                    {activeCertSection?.certTag || "Official Certification"}
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                                    {selectedCert.title}
                                </h2>
                                <p className="text-zinc-500 text-xs font-semibold mb-8 uppercase tracking-[0.2em] border-b border-white/5 pb-6">
                                    {selectedCert.subtitle || 'Verified Specialist'}
                                </p>

                                <div className="flex-grow">
                                    <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">
                                        {activeCertSection?.descriptionLabel || "Opis kwalifikacji"}
                                    </h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                                        {selectedCert.description || 'Ten dokument potwierdza oficjalne uprawnienia do realizacji specjalistycznych operacji z wykorzystaniem systemów bezzałogowych statków powietrznych w określonych kategoriach.'}
                                    </p>
                                </div>

                                <button
                                    onClick={() => { setSelectedCert(null); setActiveCertSection(null); }}
                                    className="mt-auto w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl transition-all shadow-lg"
                                >
                                    Zamknij podgląd
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {selectedCase && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8 pointer-events-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedCase(null)}
                            className="absolute inset-0 bg-black/98 backdrop-blur-xl cursor-zoom-out"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative max-w-7xl w-[95vw] max-h-[85vh] bg-zinc-950 rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col lg:flex-row"
                        >
                            {/* CLOSE BUTTON */}
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="absolute top-8 right-8 z-50 p-3 bg-black/50 hover:bg-yellow-500 hover:text-black rounded-full text-white transition-all border border-white/10 group backdrop-blur-md"
                            >
                                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>

                            {/* Cinema Image Pane */}
                            <div className="lg:w-[65%] bg-black relative group/media overflow-hidden flex items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 min-h-[40vh] lg:min-h-0">
                                {selectedCase.image && (
                                    <div
                                        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-110"
                                        style={{ backgroundImage: `url("${selectedCase.image}")` }}
                                    />
                                )}

                                {selectedCase.image ? (
                                    <img
                                        src={selectedCase.image}
                                        alt={selectedCase.title}
                                        className="relative z-10 w-full h-full object-contain p-4 lg:p-12 transition-transform duration-1000 group-hover/media:scale-[1.02]"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Camera className="text-zinc-800" size={120} />
                                    </div>
                                )}

                                {/* Scanning Line */}
                                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-20">
                                    <motion.div
                                        initial={{ top: "-100%" }}
                                        animate={{ top: "200%" }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                        className="absolute left-0 right-0 h-1 bg-yellow-500/10 blur-sm shadow-[0_0_15px_rgba(234,179,8,0.3)]"
                                    />
                                </div>
                            </div>

                            {/* Info & Specs Pane */}
                            <div className="lg:w-[35%] bg-zinc-950 flex flex-col p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                                <div className="space-y-10">
                                    <div>
                                        <div className="text-yellow-500/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{selectedCase.client}</div>
                                        <h4 className="text-white text-2xl font-bold mb-4">Analiza przypadku</h4>
                                        <div className="text-zinc-400 text-sm leading-relaxed prose prose-invert prose-sm prose-inline-styles">
                                            <div dangerouslySetInnerHTML={{ __html: selectedCase.description || 'Pomyślnie zrealizowana misja.' }} />
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-10 border-t border-white/5">
                                        <button
                                            onClick={() => setSelectedCase(null)}
                                            className="w-full py-5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl transition-all shadow-xl hover:shadow-yellow-500/20 uppercase text-xs tracking-widest"
                                        >
                                            Zamknij przegląd projektu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

