'use client';

// Landing Page for Photo Challenge Module
// Route: /foto-wyzwanie

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import SocialProofBanner from '@/components/PhotoChallenge/SocialProofBanner';
import EffectWrapper from '@/components/VisualEffects/EffectWrapper';

interface Settings {
    module_enabled: boolean;
    landing_headline: string;
    landing_subtitle: string;
    cta_button_text: string;
    social_proof_enabled: boolean;
    enable_circular_grids: boolean;
}

interface Stats {
    accepted_this_month: number;
    completed_sessions: number;
    remaining_monthly_slots?: number;
}

export default function FotoWyzwaniePage() {
    const router = useRouter();
    const [settings, setSettings] = useState<Settings | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch settings and stats
        Promise.all([
            fetch('/api/photo-challenge/settings').then(r => r.json()),
            fetch('/api/photo-challenge/stats').then(r => r.json()),
        ])
            .then(([settingsRes, statsRes]) => {
                if (settingsRes.success) {
                    setSettings(settingsRes.settings);
                }
                if (statsRes.success) {
                    setStats(statsRes.stats);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-gold-400 text-xl">Ładowanie...</div>
            </div>
        );
    }

    if (!settings?.module_enabled) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center px-4">
                <div className="text-center max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-display text-gold-400 mb-4">
                        Moduł Foto-Wyzwań
                    </h1>
                    <p className="text-gray-300 text-lg">
                        Foto-wyzwania są obecnie niedostępne. Sprawdź później!
                    </p>
                </div>
            </div>
        );
    }

    // Example couple images (replace with real images)
    const exampleImages = [
        { url: '/images/couples/couple1.jpg', alt: 'Para 1' },
        { url: '/images/couples/couple2.jpg', alt: 'Para 2' },
        { url: '/images/couples/couple3.jpg', alt: 'Para 3' },
        { url: '/images/couples/couple4.jpg', alt: 'Para 4' },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Social Proof Banner */}
            {settings?.social_proof_enabled && stats && (
                <SocialProofBanner stats={stats} />
            )}

            {/* Hero Section */}
            <section className="relative py-20 px-4 challenge-gradient">
                <div className="max-w-6xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-5xl md:text-7xl font-display font-bold text-gold-400 mb-6"
                    >
                        {settings?.landing_headline || 'Przyjmij foto-wyzwanie'}
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto"
                    >
                        {settings?.landing_subtitle || 'Zaproś kogoś na sesję i zgarnij mega rabat'}
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <Link
                            href="/foto-wyzwanie/stworz"
                            className="inline-block px-12 py-4 bg-gold-400 text-black text-lg font-bold rounded-lg hover:bg-gold-500 transition-all transform hover:scale-105 gold-glow"
                        >
                            {settings?.cta_button_text || 'Zacznij wyzwanie'}
                        </Link>
                    </motion.div>
                </div>
            </section>

            {/* Visual Effects Section */}
            <section className="py-16 px-4 bg-black">
                <div className="max-w-6xl mx-auto">
                    <EffectWrapper
                        pageSlug="foto-wyzwanie"
                        sectionName="main"
                        defaultPhotos={exampleImages}
                    />
                </div>
            </section>

            {/* How It Works */}
            <section className="py-20 px-4 bg-gradient-to-b from-black to-gold-900/10">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-gold-400 text-center mb-16">
                        Jak to działa?
                    </h2>

                    <div className="grid md:grid-cols-3 gap-8">
                        <StepCard
                            number="1"
                            title="Rzuć wyzwanie"
                            description="Wybierz pakiet, lokalizację i zaproś kogoś bliskiego na wspólną sesję zdjęciową"
                            delay={0}
                        />
                        <StepCard
                            number="2"
                            title="Druga osoba akceptuje"
                            description="Wysyłamy unikalny link - jeśli zaakceptuje w ciągu 24h, dostajecie super rabat!"
                            delay={0.2}
                        />
                        <StepCard
                            number="3"
                            title="Sesja i wspomnienia"
                            description="Umawiamy termin, robimy niesamowitą sesję, a Wy otrzymujecie piękne zdjęcia"
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-20 px-4 bg-black">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-display font-bold text-gold-400 text-center mb-12">
                        Najczęściej zadawane pytania
                    </h2>

                    <div className="space-y-6">
                        <FAQItem
                            question="Ile mam czasu na akceptację wyzwania?"
                            answer="Zazwyczaj 24 godziny, ale możesz sprawdzić dokładny czas w linku do wyzwania."
                        />
                        <FAQItem
                            question="Czy mogę wybrać własną lokalizację?"
                            answer="Tak! Możesz wybrać jedną z naszych propozycji lub podać własną lokalizację w Toruniu i okolicy."
                        />
                        <FAQItem
                            question="Ile wynosi rabat?"
                            answer="Rabaty sięgają nawet 21% w zależności od wybranego pakietu. Im większy pakiet, tym większa oszczędność!"
                        />
                        <FAQItem
                            question="Czy mogę zaprosić więcej osób?"
                            answer="Obecnie jedno wyzwanie = jedna sesja dla dwóch osób. Chcesz sesję rodzinną lub grupową? Skontaktuj się z nami bezpośrednio!"
                        />
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 px-4 challenge-gradient">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-gold-400 mb-6">
                        Gotowi na przygodę?
                    </h2>
                    <p className="text-gray-300 text-lg mb-8">
                        Nie czekaj - im szybciej, tym lepiej!
                    </p>
                    <Link
                        href="/foto-wyzwanie/stworz"
                        className="inline-block px-12 py-4 bg-gold-400 text-black text-lg font-bold rounded-lg hover:bg-gold-500 transition-all transform hover:scale-105"
                    >
                        Stwórz wyzwanie teraz
                    </Link>
                </div>
            </section>
        </div>
    );
}

function StepCard({ number, title, description, delay }: {
    number: string;
    title: string;
    description: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="text-center premium-card p-8 rounded-xl"
        >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gold-400 flex items-center justify-center">
                <span className="text-3xl font-bold text-black">{number}</span>
            </div>
            <h3 className="text-2xl font-display font-bold text-gold-400 mb-3">
                {title}
            </h3>
            <p className="text-gray-300">
                {description}
            </p>
        </motion.div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="premium-card rounded-lg overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gold-900/10 transition-colors"
            >
                <span className="text-lg font-semibold text-gold-400">{question}</span>
                <span className="text-gold-400 text-2xl">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
                <div className="px-6 pb-4">
                    <p className="text-gray-300">{answer}</p>
                </div>
            )}
        </div>
    );
}
