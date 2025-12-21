
import React from 'react';
import ThermalSlider from '@/components/ThermalSlider';
import DroneOrderForm from '@/components/DroneOrderForm';
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

export const metadata = {
    title: 'Usługi Dronem i Termowizja B2B - wlasniewski.pl',
    description: 'Profesjonalne inspekcje termowizyjne dronem. Przeglądy fotowoltaiki, dachów i budynków przemysłowych. Precyzja i bezpieczeństwo.',
};

export default function DronePage() {
    return (
        <div className="bg-black text-zinc-100 min-h-screen">
            {/* Hero Section */}
            <section className="relative py-24 px-6 max-w-7xl mx-auto overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-6">
                            <Zap size={12} /> Rozwiązania B2B
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
                            Zobacz to, czego <span className="text-yellow-500">niedostrzega</span> oko.
                        </h1>
                        <p className="text-zinc-400 text-lg mb-10 leading-relaxed max-w-xl">
                            Wykorzystujemy zaawansowane drony z kamerami termowizyjnymi radiometrycznymi do inspekcji technicznych, audytów energetycznych i monitorowania infrastruktury.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <a href="#kontakt" className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-8 py-4 rounded-full transition-all flex items-center gap-2 group">
                                Zamów darmową wycenę <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                            <a href="#oferta" className="bg-zinc-900 border border-white/10 hover:bg-zinc-800 text-white px-8 py-4 rounded-full transition-all">
                                Poznaj ofertę
                            </a>
                        </div>
                    </div>

                    <div className="relative">
                        <ThermalSlider
                            visualImage="https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=1200"
                            thermalImage="https://images.unsplash.com/photo-1579546678181-7f311c1d0b3e?auto=format&fit=crop&q=80&w=1200" // Placeholder for thermal
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
                    </div>
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
                            title="Fotowoltaika"
                            description="Wykrywanie hot-spotów, uszkodzonych ogniw i problemów z okablowaniem na farmach i instalacjach domowych."
                        />
                        <ServiceCard
                            icon={<Building2 />}
                            title="Inspekcje Dachów"
                            description="Bezinwazyjne sprawdzanie szczelności izolacji, wykrywanie zawilgoceń i uszkodzeń mechanicznych."
                        />
                        <ServiceCard
                            icon={<Droplets />}
                            title="Ciepłownictwo"
                            description="Lokalizacja wycieków w sieciach przesyłowych oraz analiza strat ciepła w budynkach komercyjnych."
                        />
                        <ServiceCard
                            icon={<Search />}
                            title="Przemysł"
                            description="Regularne przeglądy kominów, masztów i linii energetycznych bez konieczności wstrzymywania pracy."
                        />
                        <ServiceCard
                            icon={<Camera />}
                            title="Ortofotomapy"
                            description="Mapowanie terenu w wysokiej rozdzielczości do celów geodezyjnych i planistycznych."
                        />
                        <ServiceCard
                            icon={<ShieldCheck />}
                            title="Nadzór Budowlany"
                            description="Dokumentacja postępów prac i weryfikacja poprawności wykonania detali konstrukcyjnych."
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
                        Opisz swój projekt, a my dobierzemy odpowiedni sprzęt i przygotujemy ofertę w ciągu 24h.
                    </p>
                    <DroneOrderForm />
                </div>
            </section>
        </div>
    );
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
