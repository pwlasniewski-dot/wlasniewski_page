'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
    ArrowRight
} from 'lucide-react';

interface DronContentProps {
    pageData: any;
    sections: any[];
}

export default function DronContent({ pageData, sections }: DronContentProps) {
    // If we have sections from Page Builder, we might want to render them
    // Otherwise, we use the "Default" layout which the user is familiar with

    const hasSections = sections && sections.length > 0;

    return (
        <div className="bg-black text-zinc-100 min-h-screen">
            {/* 1. POWERFUL DEFAULT HERO (Always shown as base) */}
            <section className="relative py-16 px-6 max-w-7xl mx-auto overflow-hidden">
                <div className="space-y-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                            <Zap size={12} /> Rozwiązania B2B
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
                            Specjalistyczne <span className="text-yellow-500">usługi dronem</span> i termowizja.
                        </h1>
                        <p className="text-zinc-400 text-lg mb-10 leading-relaxed max-w-2xl">
                            Jako **FOTO-DRON Przemysław Właśniewski** oferuję zaawansowaną diagnostykę z powietrza. Wykorzystujemy drona **Mavic 3 Thermal** (termowizja radiometryczna) oraz **Air 2 S** do precyzyjnych zdjęć technicznych i okolicznościowych na terenie Torunia, Bydgoszczy i całego województwa.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="#kontakt" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-full transition-all flex items-center gap-2 group">
                                Zamów darmową wycenę <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href="#oferta" className="bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white px-8 py-4 rounded-full transition-all">
                                Poznaj ofertę
                            </a>
                        </div>
                    </motion.div>

                    {/* Thermal Slider (Legacy but stable anchor) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative"
                    >
                        <ThermalSlider
                            title="Galeria Badań Termowizyjnych"
                        />
                        <div className="absolute -bottom-6 -left-6 bg-zinc-900 p-6 rounded-2xl border border-white/5 shadow-2xl hidden md:block">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500/10 rounded-xl">
                                    <ShieldCheck className="text-yellow-500" size={24} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Certyfikat ULC</p>
                                    <p className="text-sm font-medium">Uprawnienia NSTS-01 / 02</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

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
                        >
                            {section.title}
                        </motion.h1>
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
        default:
            return null;
    }
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
