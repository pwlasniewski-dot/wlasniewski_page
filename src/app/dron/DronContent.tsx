'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ThermalSlider from '@/components/ThermalSlider';
import DroneOrderForm from '@/components/DroneOrderForm';
import ParallaxSection from '@/components/ParallaxSection';
import {
    Zap,
    ShieldCheck,
    Search,
    Droplets,
    Building2,
    Camera,
    Mail,
    ArrowRight,
    Maximize2,
    X
} from 'lucide-react';
import PageRenderer from '@/components/PageRenderer';

interface DronContentProps {
    pageData: any;
    sections: any[];
}

function ServiceCard({ icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/5 hover:border-yellow-500/30 transition-all group">
            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-yellow-500 mb-6 group-hover:bg-yellow-500 group-hover:text-black transition-all">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
        </div>
    );
}

export default function DronContent({ pageData, sections }: DronContentProps) {
    const [selectedCert, setSelectedCert] = React.useState<any>(null);
    const hasSections = sections && sections.length > 0;

    function renderSection(section: any) {
        switch (section.type) {
            case 'hero_parallax':
                return (
                    <ParallaxSection
                        image={section.image}
                        title={section.title}
                        subtitle={section.subtitle}
                        height="min-h-[80vh]"
                    />
                );
            case 'hero':
                return (
                    <section className="relative py-32 px-4 bg-zinc-950 flex flex-col items-center justify-center text-center overflow-hidden min-h-[60vh]">
                        {section.image ? (
                            <>
                                <div
                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                                    style={{ backgroundImage: `url("${section.image}")` }}
                                />
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                            </>
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />
                        )}

                        <div className="relative z-10 max-w-4xl space-y-6">
                            {section.tag && (
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    className="inline-block px-4 py-1.5 bg-yellow-500/10 text-yellow-500 text-sm font-bold tracking-widest uppercase rounded-full border border-yellow-500/20"
                                >
                                    {section.tag}
                                </motion.span>
                            )}
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="text-5xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight"
                                dangerouslySetInnerHTML={{ __html: section.title }}
                            />

                            {section.subtitle && (
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-xl md:text-2xl text-zinc-300 font-light italic"
                                >
                                    {section.subtitle}
                                </motion.p>
                            )}

                            {section.description && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 }}
                                    className="text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto"
                                    dangerouslySetInnerHTML={{ __html: section.description }}
                                />
                            )}

                            {section.buttonText && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="pt-4"
                                >
                                    <Link
                                        href={section.buttonLink || '#'}
                                        className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-full transition-all group"
                                    >
                                        {section.buttonText}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </section>
                );
            case 'thermal_slider':
                return (
                    <section className="py-20 px-6 max-w-7xl mx-auto">
                        <ThermalSlider
                            sections={section.thermalSections}
                            title={section.title}
                            visualImage={section.image}
                            thermalImage={section.thermalImage}
                            labelLeft={section.labelLeft}
                            labelRight={section.labelRight}
                        />
                    </section>
                );
            case 'rich_text':
                return (
                    <section className="py-20 px-6 max-w-4xl mx-auto">
                        <div
                            className="prose prose-invert prose-lg max-w-none
                                prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-white
                                prose-a:text-yellow-500 hover:prose-a:text-yellow-400 transition-colors
                            "
                            dangerouslySetInnerHTML={{ __html: section.content }}
                        />
                    </section>
                );
            case 'image_text':
                return (
                    <section className="py-20 px-6 max-w-7xl mx-auto">
                        <div className={`flex flex-col ${section.layout === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
                            <div className="flex-1 w-full relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
                                <img src={section.image} alt="" className="relative rounded-2xl shadow-2xl border border-white/10 w-full object-cover aspect-video md:aspect-auto" />
                            </div>
                            <div className="flex-1">
                                <div
                                    className="prose prose-invert prose-lg max-w-none
                                        prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-white
                                        prose-a:text-yellow-500 hover:prose-a:text-yellow-400 transition-colors
                                    "
                                    dangerouslySetInnerHTML={{ __html: section.content }}
                                />
                            </div>
                        </div>
                    </section>
                );
            case 'gallery':
                return (
                    <section className="py-20 px-6 max-w-7xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {section.images?.map((img: string, i: number) => (
                                <div key={i} className="aspect-square relative group overflow-hidden rounded-xl border border-white/5">
                                    <img
                                        src={img}
                                        alt=""
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/10 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </section>
                );
            case 'contact':
                return (
                    <section id="kontakt" className="py-24 px-6 max-w-4xl mx-auto text-center">
                        <div className="p-12 bg-zinc-900/40 rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-yellow-500/5 blur-3xl rounded-full transition-all group-hover:bg-yellow-500/10" />
                            <Mail className="mx-auto text-yellow-500 mb-6 relative z-10" size={48} />
                            <h2 className="text-3xl font-bold mb-4 relative z-10">{section.title || 'Potrzebujesz inspekcji?'}</h2>
                            <p className="text-zinc-400 mb-10 leading-relaxed max-w-xl mx-auto relative z-10">
                                {section.subtitle || 'Opisz swój projekt, a przygotujemy ofertę w ciągu 24h.'}
                            </p>
                            <div className="relative z-10">
                                <DroneOrderForm />
                            </div>
                        </div>
                    </section>
                );
            case 'contact_form':
                return (
                    <section className="py-24 px-6 max-w-4xl mx-auto">
                        <div className="bg-zinc-900/40 p-10 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-yellow-500/5 blur-3xl rounded-full transition-all group-hover:bg-yellow-500/10" />
                            <div className="text-center mb-10 relative z-10">
                                <h2 className="text-3xl font-bold mb-3">{section.title || 'Skontaktuj się'}</h2>
                                <p className="text-zinc-400">{section.subtitle || 'Daj nam znać czego potrzebujesz.'}</p>
                            </div>
                            <div className="relative z-10">
                                <DroneOrderForm />
                            </div>
                        </div>
                    </section>
                );
            case 'certificates':
                return (
                    <section className="py-32 px-6 max-w-7xl mx-auto relative overflow-hidden">
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
                            {section.certificates?.map((cert: any, i: number) => (
                                <motion.div
                                    key={cert.id || i}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, duration: 0.5 }}
                                    className="group"
                                >
                                    <div className={`relative p-1 rounded-[32px] bg-gradient-to-b from-white/10 to-transparent transition-all duration-500 group-hover:from-yellow-500/40 group-hover:to-yellow-500/5 shadow-2xl h-full`}>
                                        <div className={`bg-zinc-950 rounded-[30px] h-full border border-white/5 relative overflow-hidden flex flex-col ${section.certificateSize === 'readable' ? 'p-10 md:p-16' :
                                            section.certificateSize === 'large' ? 'p-8 md:p-10' : 'p-6'
                                            }`}>
                                            {/* Inner Glow */}
                                            <div className="absolute -top-48 -right-48 w-96 h-96 bg-yellow-500/10 blur-[100px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                            {/* Main Certificate Display Area - Priority on visibility */}
                                            <div
                                                onClick={() => setSelectedCert(cert)}
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
                                                    onClick={() => setSelectedCert(cert)}
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

                        {/* Lightbox Modal */}
                        <AnimatePresence>
                            {selectedCert && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-auto"
                                >
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        onClick={() => setSelectedCert(null)}
                                        className="absolute inset-0 bg-black/95 backdrop-blur-md cursor-zoom-out"
                                    />

                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.9, opacity: 0 }}
                                        className="relative max-w-5xl w-full max-h-full bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
                                    >
                                        <button
                                            onClick={() => setSelectedCert(null)}
                                            className="absolute top-6 right-6 z-20 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors border border-white/10"
                                        >
                                            <X size={24} />
                                        </button>

                                        <div className="grid md:grid-cols-5 h-full overflow-y-auto max-h-[90vh]">
                                            <div className="md:col-span-3 bg-black flex items-center justify-center p-4 md:p-8 border-r border-white/5">
                                                {selectedCert.image ? (
                                                    <img
                                                        src={selectedCert.image}
                                                        alt={selectedCert.title}
                                                        className="max-w-full max-h-full h-auto shadow-2xl rounded-sm border border-zinc-800"
                                                    />
                                                ) : (
                                                    <ShieldCheck className="text-zinc-800" size={200} />
                                                )}
                                            </div>
                                            <div className="md:col-span-2 p-8 md:p-12 flex flex-col">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-bold uppercase tracking-widest mb-8 self-start">
                                                    Official Certification
                                                </div>
                                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
                                                    {selectedCert.title}
                                                </h2>
                                                <p className="text-zinc-500 text-xs font-semibold mb-8 uppercase tracking-[0.2em] border-b border-white/5 pb-6">
                                                    {selectedCert.subtitle || 'Verified Specialist'}
                                                </p>

                                                <div className="flex-grow">
                                                    <h4 className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-4">Opis kwalifikacji</h4>
                                                    <p className="text-zinc-400 text-sm leading-relaxed mb-8">
                                                        {selectedCert.description || 'Ten dokument potwierdza oficjalne uprawnienia do realizacji specjalistycznych operacji z wykorzystaniem systemów bezzałogowych statków powietrznych w określonych kategoriach.'}
                                                    </p>

                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                                                <ShieldCheck size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Status Walidacji</div>
                                                                <div className="text-white text-sm font-medium">Aktywny i zweryfikowany</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setSelectedCert(null)}
                                                    className="mt-12 w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-2xl transition-all shadow-lg shadow-yellow-500/10"
                                                >
                                                    Zamknij podgląd
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </section>
                );
            case 'b2b_hero':
            case 'b2b_stats':
            case 'b2b_logos':
            case 'b2b_process':
            case 'b2b_cases':
            case 'b2b_contact':
            case 'info_band':
                // Redirect to PageRenderer for B2B modules to avoid duplication
                return <PageRenderer sections={[section]} />;
            default:
                return null;
        }
    }

    return (
        <div className="bg-black text-zinc-100 min-h-screen">
            {/* 1. POWERFUL DEFAULT HERO (Shown ONLY if no custom Hero is added) */}

            {/* 2. LEGACY CONTENT (If exists) */}
            {pageData?.content && (
                <section className="py-16 px-6 max-w-4xl mx-auto">
                    <div className="w-20 h-px bg-yellow-500 mb-12 opacity-50" />
                    <div
                        className="prose prose-invert prose-lg max-w-none
                            prose-headings:text-white prose-p:text-zinc-300 prose-strong:text-white
                            prose-a:text-yellow-500 hover:prose-a:text-yellow-400 transition-colors
                        "
                        dangerouslySetInnerHTML={{ __html: pageData.content }}
                    />
                </section>
            )}

            {/* 3. DYNAMIC SECTIONS (Modules added via Page Builder) */}
            {hasSections && (
                <div className="space-y-0">
                    {sections.map((section: any, index: number) => (
                        <div key={section.id || index}>
                            {renderSection(section)}
                        </div>
                    ))}
                </div>
            )}

            {/* 3. DEFAULT SERVICES (Shown if not explicitly overridden by many modules) */}
            {!hasSections && (
                <section id="oferta" className="py-24 bg-zinc-900/30">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Eksperckie usługi inspekcyjne</h2>
                            <p className="text-zinc-500">Optymalizujemy koszty i skracamy czas przeglądów dzięki technologii UAV.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <ServiceCard
                                icon={<Zap />}
                                title="Termowizja Mavic 3 Thermal"
                                description="Profesjonalne badanie farm fotowoltaicznych, linii energetycznych i ciepłowniczych z użyciem sensora radiometrycznego."
                            />
                            <ServiceCard
                                icon={<Building2 />}
                                title="Analiza Dachów i Budynków"
                                description="Bezinwazyjne sprawdzanie szczelności izolacji, wykrywanie zawilgoceń oraz szczegółowa dokumentacja stanu technicznego."
                            />
                            <ServiceCard
                                icon={<Droplets />}
                                title="Ciepłownictwo i Energetyka"
                                description="Lokalizacja wycieków w sieciach przesyłowych oraz analiza strat ciepła w obiektach przemysłowych i biurowych."
                            />
                            <ServiceCard
                                icon={<Search />}
                                title="Nadzór i Timeline Budowy"
                                description="Regularne zdjęcia poklatkowe i dokumentacja postępu prac. Idealne do monitorowania dużych inwestycji w regionie."
                            />
                            <ServiceCard
                                icon={<Camera />}
                                title="Zdjęcia i Filmy 4K (Air 2 S)"
                                description="Wysokiej jakości ujęcia z drona dla firm, deweloperów oraz na wydarzenia okolicznościowe w Toruniu i Bydgoszczy."
                            />
                            <ServiceCard
                                icon={<ShieldCheck />}
                                title="Koła Łowieckie i Rolnictwo"
                                description="Monitoring zwierzyny, szacowanie szkód łowieckich oraz analiza upraw z wykorzystaniem termowizji."
                            />
                        </div>
                    </div>
                </section>
            )}

            {/* 4. DEFAULT CONTACT (Shown only if no contact modules are added) */}
            {!sections.some(s => s.type === 'contact' || s.type === 'contact_form') && (
                <section id="kontakt" className="py-24 px-6 max-w-3xl mx-auto text-center">
                    <div className="p-12 bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-sm shadow-2xl">
                        <Mail className="mx-auto text-yellow-500 mb-6" size={48} />
                        <h2 className="text-3xl font-bold mb-4">Potrzebujesz inspekcji?</h2>
                        <p className="text-zinc-400 mb-10 leading-relaxed">
                            Opisz swój projekt, a dobierzemy odpowiedni sprzęt i przygotujemy ofertę w ciągu 24h.
                        </p>
                        <DroneOrderForm />
                    </div>
                </section>
            )}
        </div>
    );
}
