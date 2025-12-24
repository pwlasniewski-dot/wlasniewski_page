'use client';

import React from 'react';
import { motion } from 'framer-motion';
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
            {hasSections ? (
                // DYNAMIC RENDERING (Page Builder)
                <div className="space-y-0">
                    {sections.map((section: any, index: number) => (
                        <div key={section.id || index}>
                            {renderSection(section)}
                        </div>
                    ))}
                </div>
            ) : (
                // DEFAULT LAYOUT (Hardcoded fallback)
                <>
                    {/* Hero Section */}
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

                            {/* Thermal Slider */}
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

                    {/* Services Grid */}
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

                    {/* Contact Section */}
                    <section id="kontakt" className="py-24 px-6 max-w-3xl mx-auto text-center">
                        <div className="p-12 bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <Mail className="mx-auto text-yellow-500 mb-6" size={48} />
                            <h2 className="text-3xl font-bold mb-4">Potrzebujesz inspekcji?</h2>
                            <p className="text-zinc-400 mb-10 leading-relaxed">
                                Opisz swój projekt, a we dobierzemy odpowiedni sprzęt i przygotujemy ofertę w ciągu 24h.
                            </p>
                            <DroneOrderForm />
                        </div>
                    </section>
                </>
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
                <section className="py-20 px-6 max-w-4xl mx-auto prose prose-invert">
                    <div dangerouslySetInnerHTML={{ __html: section.content }} />
                </section>
            );
        case 'image_text':
            return (
                <section className="py-20 px-6 max-w-7xl mx-auto">
                    <div className={`flex flex-col ${section.layout === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
                        <div className="flex-1">
                            <img src={section.image} alt="" className="rounded-2xl shadow-2xl border border-white/10" />
                        </div>
                        <div className="flex-1 prose prose-invert">
                            <div dangerouslySetInnerHTML={{ __html: section.content }} />
                        </div>
                    </div>
                </section>
            );
        case 'gallery':
            return (
                <section className="py-20 px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {section.images?.map((img: string, i: number) => (
                            <img key={i} src={img} alt="" className="aspect-square object-cover rounded-xl border border-white/5" />
                        ))}
                    </div>
                </section>
            );
        case 'contact':
            return (
                <section id="kontakt" className="py-24 px-6 max-w-3xl mx-auto text-center">
                    <div className="p-12 bg-zinc-900/50 rounded-3xl border border-white/5 backdrop-blur-sm">
                        <Mail className="mx-auto text-yellow-500 mb-6" size={48} />
                        <h2 className="text-3xl font-bold mb-4">{section.title || 'Potrzebujesz inspekcji?'}</h2>
                        <p className="text-zinc-400 mb-10 leading-relaxed">
                            {section.subtitle || 'Opisz swój projekt, a przygotujemy ofertę w ciągu 24h.'}
                        </p>
                        <DroneOrderForm />
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
