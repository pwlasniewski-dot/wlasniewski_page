'use client';

// Landing Page for Photo Challenge Module — REDESIGN
// Route: /foto-wyzwanie
// Light, warm, premium look. Typography: Cormorant Garamond + Montserrat + Great Vibes.

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    Sparkles, Heart, Camera, Gift, Clock, ArrowRight,
    Check, Shield, Award, Star, ChevronDown, Users
} from 'lucide-react';
import PromocodeBar from '@/components/PromocodeBar';

interface Settings {
    module_enabled: boolean;
    landing_headline: string;
    landing_subtitle: string;
    cta_button_text: string;
}

interface Stats {
    accepted_this_month: number;
    completed_sessions: number;
    remaining_monthly_slots?: number;
}

interface Pkg {
    id: number;
    name: string;
    description?: string | null;
    base_price: number;
    challenge_price: number;
    discount_percentage: number;
    included_items?: string | null;
    accent_color?: string | null;
}

export default function FotoWyzwaniePage() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [packages, setPackages] = useState<Pkg[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/photo-challenge/settings').then(r => r.json()),
            fetch('/api/photo-challenge/stats').then(r => r.json()),
            fetch('/api/photo-challenge/packages').then(r => r.json()),
        ])
            .then(([s, st, pk]) => {
                if (s.success) setSettings(s.settings);
                if (st.success) setStats(st.stats);
                if (pk.success) setPackages((pk.packages || []).slice(0, 3));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FBF7EF] flex items-center justify-center">
                <div className="flex items-center gap-3 text-amber-700">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    <span className="font-display text-2xl">Ładowanie...</span>
                </div>
            </div>
        );
    }

    if (!settings?.module_enabled) {
        return (
            <div className="min-h-screen bg-[#FBF7EF] flex items-center justify-center px-4">
                <div className="text-center max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-display text-amber-800 mb-4">
                        Foto Wyzwania chwilowo wyłączone
                    </h1>
                    <p className="text-stone-600 text-lg">
                        Wróć za chwilę albo napisz do mnie bezpośrednio.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FBF7EF] text-stone-800 overflow-x-hidden">
            <PromocodeBar code="WYZWANIE20" discount={20} discountType="percentage" />

            {/* HERO */}
            <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 px-4 overflow-hidden">
                <div className="absolute inset-0 -z-10 pointer-events-none">
                    <div className="absolute top-20 -left-20 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full bg-gradient-to-br from-rose-200/40 to-amber-200/30 blur-3xl animate-float" />
                    <div className="absolute top-40 -right-32 w-[350px] md:w-[600px] h-[350px] md:h-[600px] rounded-full bg-gradient-to-br from-amber-200/40 to-orange-200/30 blur-3xl animate-float" style={{ animationDelay: '5s' }} />
                    <div className="absolute bottom-0 left-1/3 w-[250px] md:w-[400px] h-[250px] md:h-[400px] rounded-full bg-gradient-to-br from-emerald-100/40 to-teal-100/30 blur-3xl animate-float" style={{ animationDelay: '10s' }} />
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                        <div className="text-center md:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-amber-200 text-amber-800 text-xs md:text-sm font-medium mb-6 shadow-sm"
                            >
                                <Sparkles className="w-4 h-4" />
                                Limitowana edycja — tylko {stats?.remaining_monthly_slots ?? 5} miejsc w tym miesiącu
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 }}
                                className="font-display font-extrabold text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] text-stone-900 mb-6 tracking-tight"
                            >
                                <span className="block">Podaruj komuś</span>
                                <span className="block bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 bg-clip-text text-transparent">
                                    wspomnienie
                                </span>
                                <span className="font-handwriting font-normal text-amber-700 text-4xl sm:text-5xl md:text-6xl block mt-1">
                                    na zawsze
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="text-base md:text-xl text-stone-600 mb-8 leading-relaxed max-w-xl mx-auto md:mx-0"
                            >
                                {settings?.landing_subtitle && settings.landing_subtitle.length > 20 ? (
                                    settings.landing_subtitle
                                ) : (
                                    <>
                                        Foto Wyzwanie to <strong className="text-stone-900">prezent, którego nie da się odpakować z Allegro</strong>.
                                        Zaproś bliską osobę na wspólną sesję — w cenie nawet do <span className="text-amber-700 font-bold">21% niższej</span> niż standardowa.
                                    </>
                                )}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4"
                            >
                                <Link
                                    href="/foto-wyzwanie/stworz"
                                    className="group relative inline-flex items-center gap-2 px-6 md:px-8 py-3.5 md:py-4 rounded-full bg-gradient-to-r from-amber-600 to-rose-500 text-white font-bold text-base md:text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all animate-pulse-soft"
                                >
                                    <Gift className="w-5 h-5" />
                                    {settings?.cta_button_text || 'Stwórz wyzwanie'}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <a
                                    href="#jak-to-dziala"
                                    className="inline-flex items-center gap-2 px-5 md:px-6 py-3.5 md:py-4 rounded-full bg-white/70 backdrop-blur border border-stone-300 text-stone-700 font-medium hover:bg-white transition-all"
                                >
                                    Jak to działa? <ChevronDown className="w-4 h-4" />
                                </a>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.8 }}
                                className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mt-8 text-xs md:text-sm text-stone-500"
                            >
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-emerald-600" />
                                    Pełna gwarancja zwrotu
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    Bez presji — masz 24 h na decyzję
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 1, delay: 0.4 }}
                            className="relative h-[460px] hidden md:block"
                        >
                            <FloatingPolaroids />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* STATS BAR */}
            <section className="py-10 md:py-12 px-4 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-y border-amber-100">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
                    <StatTile icon={<Heart className="w-6 h-6" />} value={stats?.completed_sessions ?? 47} label="zrealizowanych sesji" />
                    <StatTile icon={<Sparkles className="w-6 h-6" />} value={stats?.accepted_this_month ?? 12} label="wyzwań w tym miesiącu" />
                    <StatTile icon={<Star className="w-6 h-6" />} value={5} suffix="/5" label="średnia ocena par" decimal />
                    <StatTile icon={<Users className="w-6 h-6" />} value={stats?.remaining_monthly_slots ?? 5} label="wolnych miejsc" highlight />
                </div>
            </section>

            {/* WHY */}
            <section className="py-16 md:py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 md:mb-16"
                    >
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-700">a po co to wszystko?</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">
                            Bo zdjęcia żyją dłużej<br className="hidden sm:block" /> niż ostatni model telefonu
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <BenefitCard
                            icon={<Gift className="w-7 h-7" />}
                            title="Prezent z historią"
                            description="Zamiast kolejnego kubka — wspólne 2 godziny śmiechu, których nikt Wam nie odbierze."
                            color="rose"
                            delay={0}
                        />
                        <BenefitCard
                            icon={<Sparkles className="w-7 h-7" />}
                            title="Rabat aż do 21%"
                            description="Wspólna sesja jest tańsza niż dwie osobne. Zyskujecie i zdjęcia, i pieniądze."
                            color="amber"
                            delay={0.1}
                        />
                        <BenefitCard
                            icon={<Award className="w-7 h-7" />}
                            title="Ja robię resztę"
                            description="Lokalizacja, światło, pozy, kawa. Wy tylko przyjeżdżacie i bawicie się dobrze."
                            color="emerald"
                            delay={0.2}
                        />
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="jak-to-dziala" className="py-16 md:py-24 px-4 bg-gradient-to-b from-[#FBF7EF] to-amber-50/50 scroll-mt-24">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-12 md:mb-20"
                    >
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-700">prosto jak drut</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">
                            Trzy kroki do wspomnień
                        </h2>
                    </motion.div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 relative">
                        <StepCard
                            number={1}
                            icon={<Heart className="w-7 h-7" />}
                            title="Wybierz pakiet i osobę"
                            description="Klikasz, wybierasz pakiet, wpisujesz imię osoby, którą chcesz zaprosić, i opłacasz online."
                            color="rose"
                            delay={0}
                        />
                        <StepCard
                            number={2}
                            icon={<Gift className="w-7 h-7" />}
                            title="Ona dostaje zaproszenie"
                            description="Wysyłam jej e‑mail z prywatnym linkiem. Ma 24 h, żeby wybrać termin i lokalizację. Bez logowania, bez haseł."
                            color="amber"
                            delay={0.2}
                        />
                        <StepCard
                            number={3}
                            icon={<Camera className="w-7 h-7" />}
                            title="Spotykamy się na sesji"
                            description="Toruń, Bydgoszcz lub Wasze ulubione miejsce. 60–90 minut zabawy, dziesiątki ujęć w galerii online."
                            color="emerald"
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>

            {/* PACKAGES PREVIEW */}
            {packages.length > 0 && (
                <section className="py-16 md:py-24 px-4">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-12 md:mb-16"
                        >
                            <span className="font-handwriting text-2xl md:text-3xl text-amber-700">wybierz coś dla siebie</span>
                            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">
                                Pakiety na każdą okazję
                            </h2>
                        </motion.div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {packages.map((p, i) => (
                                <PackageCard key={p.id} pkg={p} delay={i * 0.1} highlighted={i === 1} />
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link
                                href="/foto-wyzwanie/stworz"
                                className="inline-flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800 transition-colors"
                            >
                                Zobacz wszystkie pakiety <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* TESTIMONIAL */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex justify-center gap-1 mb-6">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className="w-6 h-6 fill-amber-500 text-amber-500" />
                            ))}
                        </div>
                        <blockquote className="font-display text-xl sm:text-2xl md:text-3xl text-stone-800 leading-relaxed italic mb-6">
                            „Zaprosiłam mamę na sesję jako prezent na 60. urodziny.
                            Płakałyśmy obie — najpierw na sesji, potem oglądając zdjęcia. Najlepiej wydane pieniądze ostatnich lat."
                        </blockquote>
                        <p className="font-handwriting text-2xl text-amber-700">— Magda, Toruń</p>
                    </motion.div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24 px-4">
                <div className="max-w-3xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-10 md:mb-16"
                    >
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight">
                            Pytania, które padają najczęściej
                        </h2>
                    </motion.div>

                    <div className="space-y-3">
                        <FAQItem
                            q="Co jeśli osoba zaproszona się nie zgodzi?"
                            a="Bez stresu — dostajesz pełny zwrot pieniędzy w ciągu 3 dni roboczych. Nic nie tracisz, oprócz odrobiny czasu."
                        />
                        <FAQItem
                            q="Ile trwa sesja?"
                            a="Standardowa sesja foto‑wyzwania to 60–90 minut. Dłuższe pakiety obejmują kilka lokalizacji i przebrania."
                        />
                        <FAQItem
                            q="Gdzie odbywa się sesja?"
                            a="Toruń, Bydgoszcz i okolice. Możemy też pojechać w wybrane przez Was miejsce — wtedy doliczam koszt dojazdu."
                        />
                        <FAQItem
                            q="Kiedy dostanę zdjęcia?"
                            a="Galerię online udostępniam w ciągu 14 dni od sesji. Wybierasz ulubione ujęcia, ja je dopracowuję i wysyłam w wysokiej rozdzielczości."
                        />
                        <FAQItem
                            q="Czy zaproszona osoba musi zakładać konto?"
                            a="Nie musi. Wszystko działa z poziomu linku w e‑mailu. Konto może założyć później, jeśli chce mieć stały dostęp do galerii."
                        />
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl animate-float" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-rose-500/20 blur-3xl animate-float" style={{ animationDelay: '7s' }} />
                </div>
                <div className="max-w-3xl mx-auto text-center relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-300">no to co — robimy?</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-6xl mt-2 mb-6 tracking-tight">
                            Daj komuś prezent,<br />
                            który przeżyje Was oboje
                        </h2>
                        <p className="text-base md:text-lg text-stone-300 mb-8 md:mb-10 max-w-xl mx-auto">
                            Zostało <strong className="text-amber-300">{stats?.remaining_monthly_slots ?? 5} miejsc</strong> w tym miesiącu. Następne dopiero w przyszłym.
                        </p>
                        <Link
                            href="/foto-wyzwanie/stworz"
                            className="group inline-flex items-center gap-3 px-7 md:px-10 py-4 md:py-5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-stone-900 font-bold text-base md:text-xl shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:-translate-y-1 transition-all animate-pulse-soft"
                        >
                            <Gift className="w-5 md:w-6 h-5 md:h-6" />
                            Tak, stwarzam wyzwanie
                            <ArrowRight className="w-5 md:w-6 h-5 md:h-6 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </section>
        </div>
    );
}

/* ─── COMPONENTS ─── */

function FloatingPolaroids() {
    const items = [
        { src: '/images/couples/couple1.jpg', rot: -8, x: 0, y: 0, delay: 0 },
        { src: '/images/couples/couple2.jpg', rot: 6, x: 180, y: 60, delay: 0.5 },
        { src: '/images/couples/couple3.jpg', rot: -3, x: 60, y: 220, delay: 1 },
        { src: '/images/couples/couple4.jpg', rot: 10, x: 220, y: 260, delay: 1.5 },
    ];

    return (
        <div className="relative w-full h-full">
            {items.map((it, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 40, rotate: 0 }}
                    animate={{ opacity: 1, y: 0, rotate: it.rot }}
                    transition={{ duration: 0.8, delay: it.delay, ease: 'easeOut' }}
                    whileHover={{ scale: 1.05, rotate: 0, zIndex: 50 }}
                    style={{ left: it.x, top: it.y }}
                    className="absolute w-48 h-56 bg-white rounded-md shadow-2xl p-3 cursor-pointer"
                >
                    <div
                        className="w-full h-40 bg-gradient-to-br from-amber-200 via-rose-200 to-amber-300 rounded-sm bg-cover bg-center"
                        style={{ backgroundImage: `url(${it.src})` }}
                    />
                    <div className="text-center mt-2 font-handwriting text-amber-700 text-lg">
                        wspomnienie {i + 1}
                    </div>
                </motion.div>
            ))}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="absolute top-10 right-10 text-amber-400"
            >
                <Sparkles className="w-8 h-8" />
            </motion.div>
            <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="absolute bottom-20 left-0 text-rose-400"
            >
                <Heart className="w-6 h-6" />
            </motion.div>
        </div>
    );
}

function StatTile({
    icon, value, label, suffix, decimal, highlight,
}: { icon: React.ReactNode; value: number; label: string; suffix?: string; decimal?: boolean; highlight?: boolean }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        let raf: number;
        const start = performance.now();
        const duration = 1200;
        const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(value * eased);
            if (p < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`flex flex-col items-center ${highlight ? 'text-rose-700' : 'text-stone-700'}`}
        >
            <div className={`mb-2 ${highlight ? 'text-rose-600' : 'text-amber-600'}`}>{icon}</div>
            <div className="font-display font-bold text-3xl md:text-4xl">
                {decimal ? display.toFixed(1) : Math.round(display)}{suffix || ''}
            </div>
            <div className="text-sm text-stone-500 mt-1">{label}</div>
        </motion.div>
    );
}

function BenefitCard({
    icon, title, description, color, delay,
}: { icon: React.ReactNode; title: string; description: string; color: 'rose' | 'amber' | 'emerald'; delay: number }) {
    const colors = {
        rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-700', accent: 'group-hover:border-rose-400' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700', accent: 'group-hover:border-amber-400' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700', accent: 'group-hover:border-emerald-400' },
    }[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            whileHover={{ y: -6 }}
            className={`group p-8 rounded-2xl ${colors.bg} border ${colors.border} ${colors.accent} transition-all`}
        >
            <div className={`w-14 h-14 rounded-xl ${colors.icon} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <h3 className="font-display font-bold text-2xl text-stone-900 mb-3">{title}</h3>
            <p className="text-stone-600 leading-relaxed">{description}</p>
        </motion.div>
    );
}

function StepCard({
    number, icon, title, description, color, delay,
}: { number: number; icon: React.ReactNode; title: string; description: string; color: 'rose' | 'amber' | 'emerald'; delay: number }) {
    const colors = {
        rose: 'from-rose-400 to-rose-600',
        amber: 'from-amber-400 to-amber-600',
        emerald: 'from-emerald-400 to-emerald-600',
    }[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
        >
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${colors} flex items-center justify-center text-white shadow-lg relative`}>
                {icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-900 font-bold text-sm shadow-md">
                    {number}
                </div>
            </div>
            <h3 className="font-display font-bold text-2xl text-stone-900 mb-3 text-center">{title}</h3>
            <p className="text-stone-600 text-center leading-relaxed">{description}</p>
        </motion.div>
    );
}

function PackageCard({ pkg, delay, highlighted }: { pkg: Pkg; delay: number; highlighted?: boolean }) {
    const items = (pkg.included_items || '').split(/\n|;|,/).map(s => s.trim()).filter(Boolean).slice(0, 4);
    const savings = pkg.base_price - pkg.challenge_price;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay }}
            className={`relative rounded-2xl p-8 transition-all hover:-translate-y-2 ${highlighted
                    ? 'bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.03]'
                    : 'bg-white border border-stone-200 shadow-md hover:shadow-xl'
                }`}
        >
            {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-xs font-bold shadow-lg">
                    NAJCZĘŚCIEJ WYBIERANY
                </div>
            )}

            <h3 className="font-display font-bold text-2xl text-stone-900 mb-2">{pkg.name}</h3>
            {pkg.description && <p className="text-stone-600 text-sm mb-5 line-clamp-2">{pkg.description}</p>}

            <div className="mb-6">
                <div className="flex items-baseline gap-2">
                    <span className="font-display font-bold text-4xl text-amber-700">{pkg.challenge_price}</span>
                    <span className="text-stone-500">zł</span>
                    {savings > 0 && (
                        <span className="text-stone-400 line-through text-sm">{pkg.base_price} zł</span>
                    )}
                </div>
                {pkg.discount_percentage > 0 && (
                    <div className="inline-block mt-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                        Oszczędzasz {pkg.discount_percentage}%
                    </div>
                )}
            </div>

            {items.length > 0 && (
                <ul className="space-y-2 mb-6">
                    {items.map((it, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{it}</span>
                        </li>
                    ))}
                </ul>
            )}

            <Link
                href="/foto-wyzwanie/stworz"
                className={`block text-center py-3 rounded-full font-semibold transition-all ${highlighted
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white hover:shadow-lg'
                        : 'bg-stone-100 text-stone-800 hover:bg-stone-200'
                    }`}
            >
                Wybieram
            </Link>
        </motion.div>
    );
}

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`rounded-xl border transition-all ${open ? 'bg-amber-50 border-amber-300' : 'bg-white border-stone-200 hover:border-amber-200'}`}>
            <button
                onClick={() => setOpen(!open)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4"
            >
                <span className={`font-semibold text-lg ${open ? 'text-amber-800' : 'text-stone-800'}`}>{q}</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={open ? 'text-amber-700' : 'text-stone-400'}
                >
                    <ChevronDown className="w-5 h-5" />
                </motion.span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <p className="px-6 pb-5 text-stone-700 leading-relaxed">{a}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
