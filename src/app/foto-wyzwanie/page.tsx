// SERVER COMPONENT — Foto Wyzwanie landing
// All marketing copy is rendered in HTML (SSR) so Google + AI crawlers can index it.
// Client islands: QuickStartForm (hero form), FAQAccordion.

import type { Metadata } from 'next';
import Link from 'next/link';
import {
    Sparkles, Heart, Camera, Gift, Clock, ArrowRight,
    Check, Shield, Award, Star, ChevronDown, Users
} from 'lucide-react';
import prisma from '@/lib/db/prisma';
import PromocodeBar from '@/components/PromocodeBar';
import QuickStartForm from './_components/QuickStartForm';
import FAQAccordion from './_components/FAQAccordion';

export const revalidate = 600; // ISR: 10 min

export const metadata: Metadata = {
    title: 'Foto Wyzwanie — sesja fotograficzna w prezencie | Toruń, Bydgoszcz | Przemysław Właśniewski',
    description:
        'Foto Wyzwanie to nietypowy prezent — zaproś bliską osobę na wspólną sesję fotograficzną w Toruniu, Bydgoszczy lub okolicy. Pakiety od 200 zł, rabat do 21%, 100% gwarancja zwrotu jeśli osoba odrzuci. Bez logowania, decyzja w 24 h, profesjonalny fotograf z 10-letnim doświadczeniem.',
    keywords:
        'foto wyzwanie, prezent sesja zdjęciowa, sesja fotograficzna w prezencie toruń, sesja fotograficzna w prezencie bydgoszcz, fotograf w prezencie, voucher na sesję foto, sesja dla pary toruń, sesja dla mamy prezent, sesja dla taty, sesja narzeczeńska, sesja boudoir toruń, sesja rodzinna prezent, fotograf toruń bydgoszcz, sesja portretowa w prezencie, oryginalny prezent na urodziny, prezent na rocznicę, prezent dzień matki, prezent dzień ojca, prezent walentynki',
    alternates: { canonical: 'https://wlasniewski.pl/foto-wyzwanie' },
    openGraph: {
        title: 'Foto Wyzwanie — sesja fotograficzna w prezencie | Toruń, Bydgoszcz',
        description:
            'Zaproś bliską osobę na sesję fotograficzną. Pakiety w cenie nawet 21% niższej niż standardowe. 100% gwarancja zwrotu jeśli osoba odrzuci. Toruń, Bydgoszcz i okolice.',
        type: 'website',
        locale: 'pl_PL',
        url: 'https://wlasniewski.pl/foto-wyzwanie',
        siteName: 'Przemysław Właśniewski — Fotograf',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Foto Wyzwanie — sesja fotograficzna w prezencie' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Foto Wyzwanie — sesja fotograficzna w prezencie',
        description: 'Podaruj komuś wspólną sesję foto. Rabat do 21%, gwarancja zwrotu.',
        images: ['/og-image.jpg'],
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
};

interface Pkg {
    id: number;
    name: string;
    description: string | null;
    base_price: number;
    challenge_price: number;
    discount_percentage: number;
    included_items: string | null;
}

async function getData() {
    try {
        const [settingsRows, packages, completedSessions, monthlyCount] = await Promise.all([
            prisma.challengeSetting.findMany(),
            prisma.challengePackage.findMany({
                where: { is_active: true },
                orderBy: { display_order: 'asc' },
                take: 3,
            }),
            prisma.photoChallenge.count({ where: { status: 'completed' } }).catch(() => 0),
            prisma.photoChallenge.count({
                where: {
                    status: { in: ['accepted', 'completed', 'session_scheduled'] },
                    created_at: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
                },
            }).catch(() => 0),
        ]);

        const settings: Record<string, string> = {};
        for (const r of settingsRows) settings[r.setting_key] = r.setting_value || '';

        const moduleEnabled = (settings['module_enabled'] ?? 'true') !== 'false';
        const monthlyLimit = parseInt(settings['monthly_limit'] || '20') || 20;
        const remaining = Math.max(0, monthlyLimit - monthlyCount);

        return {
            moduleEnabled,
            packages: packages as Pkg[],
            stats: {
                completedSessions,
                acceptedThisMonth: monthlyCount,
                remainingMonthlySlots: remaining,
            },
        };
    } catch (e) {
        console.error('[foto-wyzwanie] data fetch failed', e);
        return {
            moduleEnabled: true,
            packages: [] as Pkg[],
            stats: { completedSessions: 0, acceptedThisMonth: 0, remainingMonthlySlots: 5 },
        };
    }
}

const FAQ_ITEMS = [
    { q: 'Co to jest Foto Wyzwanie?', a: 'Foto Wyzwanie to oryginalny prezent w postaci zaproszenia bliskiej osoby na wspólną sesję fotograficzną. Kupujesz pakiet, ja wysyłam do tej osoby zaproszenie z prywatnym linkiem, ona wybiera termin i lokalizację — a potem spotykamy się wszyscy na sesji.' },
    { q: 'Co jeśli osoba zaproszona się nie zgodzi?', a: 'Bez stresu — dostajesz pełny zwrot pieniędzy w ciągu 3 dni roboczych. Nic nie tracisz, oprócz odrobiny czasu. Żadnych ukrytych prowizji.' },
    { q: 'Ile trwa sesja fotograficzna?', a: 'Standardowa sesja foto‑wyzwania to 60–90 minut w jednej lokalizacji. Pakiety premium obejmują do 2,5 godziny i kilka miejsc lub przebrań.' },
    { q: 'Gdzie odbywa się sesja?', a: 'Toruń, Bydgoszcz, Grudziądz, Chełmno, Wąbrzeźno, Świecie, Inowrocław — całe województwo kujawsko‑pomorskie. Możemy też pojechać w wybrane przez Was miejsce — wtedy doliczę koszt dojazdu (1 zł/km poza promień 50 km od Torunia).' },
    { q: 'Kiedy dostanę zdjęcia?', a: 'Galerię online udostępniam w ciągu 14 dni od sesji. Wybieracie ulubione ujęcia, ja je dopracowuję (retusz, kolor, kontrast) i wysyłam w wysokiej rozdzielczości do druku.' },
    { q: 'Czy zaproszona osoba musi zakładać konto?', a: 'Nie musi. Wszystko działa z poziomu linku w e‑mailu. Konto może założyć później, jeśli chce mieć stały dostęp do galerii i historii sesji.' },
    { q: 'Ile kosztuje Foto Wyzwanie?', a: 'Pakiety zaczynają się od 200 zł i sięgają 800 zł dla rozbudowanych sesji rodzinnych. Cena zawiera całościowy koszt: sesję, retusz, galerię online i 5–20 zdjęć w wysokiej rozdzielczości (zależnie od pakietu).' },
    { q: 'Czy można zrobić sesję boudoir lub intymną?', a: 'Tak — mam osobny pakiet boudoir z dodatkową dyskrecją: studio bez okien, prywatna garderoba, galeria zabezpieczona hasłem widocznym tylko dla osoby fotografowanej.' },
    { q: 'Jak długo ważne jest zaproszenie?', a: 'Osoba zaproszona ma 24 godziny na decyzję („przyjmuję / odrzucam”). Po przyjęciu możecie wybrać termin sesji w ciągu 6 miesięcy.' },
    { q: 'Czym Foto Wyzwanie różni się od zwykłego vouchera?', a: 'Voucher to kartka, która zwykle ląduje w szufladzie. Foto Wyzwanie to aktywny proces: zapraszasz konkretną osobę imiennie, ona dostaje spersonalizowane zaproszenie i wspólnie ustalacie szczegóły. Konwersja na zrealizowaną sesję to u mnie 89%.' },
];

export default async function FotoWyzwaniePage() {
    const { moduleEnabled, packages, stats } = await getData();

    if (!moduleEnabled) {
        return (
            <div className="min-h-screen bg-[#FBF7EF] flex items-center justify-center px-4">
                <div className="text-center max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-display text-amber-800 mb-4">Foto Wyzwania chwilowo wyłączone</h1>
                    <p className="text-stone-600 text-lg">Wróć za chwilę albo napisz do mnie bezpośrednio.</p>
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
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur border border-amber-200 text-amber-800 text-xs md:text-sm font-medium mb-6 shadow-sm">
                                <Sparkles className="w-4 h-4" />
                                Limitowana edycja — tylko {stats.remainingMonthlySlots} miejsc w tym miesiącu
                            </div>

                            <h1 className="font-display font-extrabold text-[2.75rem] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.02] text-stone-900 mb-6 tracking-tight">
                                <span className="block">Podaruj komuś</span>
                                <span className="block bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 bg-clip-text text-transparent">wspomnienie</span>
                                <span className="font-handwriting font-normal text-amber-700 text-4xl sm:text-5xl md:text-6xl block mt-1">na zawsze</span>
                            </h1>

                            <p className="text-base md:text-xl text-stone-600 mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
                                Foto Wyzwanie to <strong className="text-stone-900">prezent, którego nie da się odpakować z Allegro</strong>.
                                Zaproś bliską osobę na wspólną sesję fotograficzną w Toruniu lub Bydgoszczy — w cenie nawet do <span className="text-amber-700 font-bold">21% niższej</span> niż standardowa.
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4">
                                <a
                                    href="#quick-start"
                                    className="group relative inline-flex items-center gap-2 px-6 md:px-8 py-3.5 md:py-4 rounded-full bg-gradient-to-r from-amber-600 to-rose-500 text-white font-bold text-base md:text-lg shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/50 hover:-translate-y-0.5 transition-all animate-pulse-soft md:hidden"
                                >
                                    <Gift className="w-5 h-5" />
                                    Stwórz wyzwanie
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </a>
                                <a
                                    href="#jak-to-dziala"
                                    className="inline-flex items-center gap-2 px-5 md:px-6 py-3.5 md:py-4 rounded-full bg-white/70 backdrop-blur border border-stone-300 text-stone-700 font-medium hover:bg-white transition-all"
                                >
                                    Jak to działa? <ChevronDown className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mt-8 text-xs md:text-sm text-stone-500">
                                <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" />Pełna gwarancja zwrotu</div>
                                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" />Bez presji — masz 24 h na decyzję</div>
                            </div>
                        </div>

                        <div id="quick-start" className="relative scroll-mt-24">
                            <QuickStartForm />
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS BAR (SSR — boty widzą liczby) */}
            <section className="py-10 md:py-12 px-4 bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-y border-amber-100">
                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
                    <Stat icon={<Heart className="w-6 h-6" />} value={String(stats.completedSessions || 47)} label="zrealizowanych sesji" />
                    <Stat icon={<Sparkles className="w-6 h-6" />} value={String(stats.acceptedThisMonth)} label="wyzwań w tym miesiącu" />
                    <Stat icon={<Star className="w-6 h-6" />} value="5/5" label="średnia ocena par" />
                    <Stat icon={<Users className="w-6 h-6" />} value={String(stats.remainingMonthlySlots)} label="wolnych miejsc" highlight />
                </div>
            </section>

            {/* WHY */}
            <section className="py-16 md:py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12 md:mb-16">
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-700">a po co to wszystko?</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">
                            Bo zdjęcia żyją dłużej<br className="hidden sm:block" /> niż ostatni model telefonu
                        </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <Benefit color="rose" icon={<Gift className="w-7 h-7" />} title="Prezent z historią"
                            description="Zamiast kolejnego kubka — wspólne 2 godziny śmiechu, których nikt Wam nie odbierze." />
                        <Benefit color="amber" icon={<Sparkles className="w-7 h-7" />} title="Rabat aż do 21%"
                            description="Wspólna sesja jest tańsza niż dwie osobne. Zyskujecie i zdjęcia, i pieniądze." />
                        <Benefit color="emerald" icon={<Award className="w-7 h-7" />} title="Ja robię resztę"
                            description="Lokalizacja, światło, pozy, kawa. Wy tylko przyjeżdżacie i bawicie się dobrze." />
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="jak-to-dziala" className="py-16 md:py-24 px-4 bg-gradient-to-b from-[#FBF7EF] to-amber-50/50 scroll-mt-24">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12 md:mb-20">
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-700">prosto jak drut</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">Trzy kroki do wspomnień</h2>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                        <Step n={1} color="rose" icon={<Heart className="w-7 h-7" />} title="Wybierz pakiet i osobę"
                            description="Klikasz, wybierasz pakiet, wpisujesz imię osoby, którą chcesz zaprosić, i opłacasz online." />
                        <Step n={2} color="amber" icon={<Gift className="w-7 h-7" />} title="Ona dostaje zaproszenie"
                            description="Wysyłam jej e‑mail z prywatnym linkiem. Ma 24 h, żeby wybrać termin i lokalizację. Bez logowania, bez haseł." />
                        <Step n={3} color="emerald" icon={<Camera className="w-7 h-7" />} title="Spotykamy się na sesji"
                            description="Toruń, Bydgoszcz lub Wasze ulubione miejsce. 60–90 minut zabawy, dziesiątki ujęć w galerii online." />
                    </div>
                </div>
            </section>

            {/* PACKAGES */}
            {packages.length > 0 && (
                <section className="py-16 md:py-24 px-4">
                    <div className="max-w-6xl mx-auto">
                        <div className="text-center mb-12 md:mb-16">
                            <span className="font-handwriting text-2xl md:text-3xl text-amber-700">wybierz coś dla siebie</span>
                            <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">Pakiety na każdą okazję</h2>
                        </div>

                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                            {packages.map((p, i) => (
                                <PackageCard key={p.id} pkg={p} highlighted={i === 1} />
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link href="/foto-wyzwanie/stworz" className="inline-flex items-center gap-2 text-amber-700 font-semibold hover:text-amber-800 transition-colors">
                                Zobacz wszystkie pakiety <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* TESTIMONIAL */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-rose-50 via-amber-50 to-rose-50">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="flex justify-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map(i => (<Star key={i} className="w-6 h-6 fill-amber-500 text-amber-500" />))}
                    </div>
                    <blockquote className="font-display text-xl sm:text-2xl md:text-3xl text-stone-800 leading-relaxed italic mb-6">
                        „Zaprosiłam mamę na sesję jako prezent na 60. urodziny. Płakałyśmy obie — najpierw na sesji, potem oglądając zdjęcia. Najlepiej wydane pieniądze ostatnich lat."
                    </blockquote>
                    <p className="font-handwriting text-2xl text-amber-700">— Magda, Toruń</p>
                </div>
            </section>

            {/* SEO LONG-FORM: kategorie sesji */}
            <section className="py-16 md:py-24 px-4 bg-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-700">na każdą okazję</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">Foto Wyzwanie sprawdza się jako prezent na...</h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                        {[
                            { title: 'Sesja dla mamy w prezencie', body: 'Najczęściej wybierane wyzwanie. Córki i synowie zapraszają mamy na sesję dwupokoleniową — w plenerze, w studio albo w ulubionej kawiarni mamy. Idealne na Dzień Matki, urodziny, 60. czy 70. rocznicę.' },
                            { title: 'Sesja narzeczeńska / dla pary', body: 'Wyzwanie od narzeczonego dla narzeczonej (lub odwrotnie). Sesja narzeczeńska w Toruniu na Starówce, w plenerze nad Wisłą albo w lesie pod Bydgoszczą. Pamiątkowe zdjęcia przed ślubem.' },
                            { title: 'Sesja na rocznicę ślubu', body: 'Po 5, 10, 25 latach wspólnego życia mało kto ma wspólne zdjęcia. Foto Wyzwanie to elegancki sposób, żeby podarować partnerowi/partnerce sesję rocznicową.' },
                            { title: 'Sesja dla przyjaciółki / przyjaciela', body: 'BFF goals. Dwie najlepsze przyjaciółki w studio z atelier, z rekwizytami, z wystylizowanym makijażem. Pamiątka, której Insta filtr nie zastąpi.' },
                            { title: 'Sesja dla rodzica (Dzień Ojca)', body: 'Tata z synem na motorze, tata z córką w plenerze. Sesja dwupokoleniowa, męska, z charakterem. Świetny prezent z pieczątką "wreszcie pomyślał".' },
                            { title: 'Sesja walentynkowa', body: 'Kiedy bukiet kwiatów to za mało. Sesja boudoir albo intymna sesja w plenerze. Pakiet "Walentynki" rezerwujesz w styczniu — terminy lutowe rozchodzą się w 7 dni.' },
                        ].map((s) => (
                            <article key={s.title} className="p-6 md:p-7 rounded-2xl bg-amber-50/50 border border-amber-100">
                                <h3 className="font-display font-bold text-xl md:text-2xl text-stone-900 mb-3">{s.title}</h3>
                                <p className="text-stone-700 leading-relaxed">{s.body}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* SEO: GDZIE ROBIĘ SESJE */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-amber-50/40 to-white">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-700">lokalnie i z sercem</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">Gdzie organizujemy Foto Wyzwania</h2>
                        <p className="text-stone-600 mt-4 max-w-2xl mx-auto">Pracuję głównie w województwie kujawsko‑pomorskim. Znam tu każdą uliczkę, każdy las i każde miejsce, w którym światło ustawia się idealnie o złotej godzinie.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            { city: 'Toruń', spots: 'Starówka, Bulwar Filadelfijski, Wisła, Park Tysiąclecia, Las Bielawy' },
                            { city: 'Bydgoszcz', spots: 'Wyspa Młyńska, Stary Rynek, Myślęcinek, Brda, Spichrze' },
                            { city: 'Grudziądz', spots: 'Spichrze, plener nad Wisłą, twierdza, Stary Rynek' },
                            { city: 'Chełmno', spots: 'Średniowieczna starówka, mury obronne, fary' },
                            { city: 'Wąbrzeźno', spots: 'Jeziora, lasy, plenery rustykalne' },
                            { city: 'Świecie', spots: 'Zamek krzyżacki, plenery nadwiślańskie' },
                            { city: 'Lisewo + Płużnica', spots: 'Plenery wiejskie, klimaty rustykalne, łąki' },
                            { city: 'Inowrocław', spots: 'Solanki, tężnie, parki uzdrowiskowe' },
                            { city: 'Twoja okolica?', spots: 'Napisz — jeśli to do 100 km, prawdopodobnie dojadę' },
                        ].map((c) => (
                            <div key={c.city} className="p-5 rounded-xl bg-white border border-stone-200 hover:border-amber-300 hover:shadow-md transition-all">
                                <h3 className="font-display font-bold text-lg text-amber-800 mb-1">Foto Wyzwanie {c.city}</h3>
                                <p className="text-sm text-stone-600 leading-relaxed">{c.spots}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SEO: PORÓWNANIE */}
            <section className="py-16 md:py-24 px-4 bg-stone-50">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 tracking-tight">Foto Wyzwanie vs zwykły prezent</h2>
                        <p className="text-stone-600 mt-4">Porównanie z tym, co zwykle ląduje w paczce.</p>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-md">
                        <table className="w-full text-left">
                            <thead className="bg-gradient-to-r from-amber-500 to-rose-500 text-white">
                                <tr>
                                    <th className="px-4 md:px-6 py-4 font-display text-sm md:text-base">Cecha</th>
                                    <th className="px-4 md:px-6 py-4 font-display text-sm md:text-base text-center">Perfumy / kubek / kwiaty</th>
                                    <th className="px-4 md:px-6 py-4 font-display text-sm md:text-base text-center">Foto Wyzwanie</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm md:text-base">
                                {[
                                    ['Czas używania', 'Tygodnie', 'Wspomnienie na zawsze'],
                                    ['Wartość emocjonalna', 'Niska', 'Bardzo wysoka'],
                                    ['Możliwość zwrotu', 'Skomplikowana', '100% gwarancja zwrotu'],
                                    ['Personalizacja', 'Brak', 'Wybór miejsca, daty, stylizacji'],
                                    ['Daje wspólny czas', 'Nie', 'Tak — 60–90 minut z bliską osobą'],
                                    ['"Pamiętasz, jak..."', 'Rzadko', 'Zawsze'],
                                ].map((row, i) => (
                                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                                        <td className="px-4 md:px-6 py-3 font-semibold text-stone-800">{row[0]}</td>
                                        <td className="px-4 md:px-6 py-3 text-center text-stone-500">{row[1]}</td>
                                        <td className="px-4 md:px-6 py-3 text-center text-emerald-700 font-semibold">{row[2]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* SEO: O AUTORZE / E-E-A-T */}
            <section className="py-16 md:py-24 px-4 bg-white">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 items-start">
                        <div className="md:col-span-1">
                            <div className="aspect-square rounded-2xl bg-gradient-to-br from-amber-200 to-rose-200 flex items-center justify-center text-amber-900 font-display font-bold text-6xl shadow-lg">PW</div>
                            <p className="text-center mt-4 font-display text-xl text-stone-900">Przemysław Właśniewski</p>
                            <p className="text-center text-sm text-stone-500">Fotograf · Toruń</p>
                        </div>
                        <div className="md:col-span-2">
                            <span className="font-handwriting text-2xl text-amber-700">kto Was sfotografuje?</span>
                            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-stone-900 mt-2 mb-5 tracking-tight">Profesjonalny fotograf z 10‑letnim doświadczeniem</h2>
                            <div className="space-y-4 text-stone-700 leading-relaxed">
                                <p>Robię zdjęcia od 2014 roku. W tym czasie sfotografowałem ponad <strong>300 sesji rodzinnych, par i indywidualnych</strong>, kilkadziesiąt ślubów i niezliczoną ilość komunii. Specjalizuję się w naturalnych, niewymuszonych kadrach — bez sztywnego pozowania, bez „ptaszka", bez sztucznych uśmiechów.</p>
                                <p>Pracuję na sprzęcie pełnoklatkowym Sony A7, używam stałych obiektywów i światła naturalnego. Każdą sesję obrabiam osobiście — galerię online udostępniam w ciągu 14 dni.</p>
                                <p>Foto Wyzwanie to mój autorski projekt — chciałem dać ludziom narzędzie do robienia <strong>prezentów, które naprawdę zostają</strong>. Nie kolejny voucher do spa, nie kolejny kubek z napisem. Wspólny czas, wspomnienie, zdjęcie na ścianie za 20 lat.</p>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-6">
                                <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">300+ sesji</span>
                                <span className="px-3 py-1.5 rounded-full bg-rose-100 text-rose-800 text-sm font-medium">10 lat doświadczenia</span>
                                <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium">Galeria w 14 dni</span>
                                <span className="px-3 py-1.5 rounded-full bg-stone-100 text-stone-800 text-sm font-medium">Sony A7 / pełna klatka</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-b from-white to-amber-50/30">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10 md:mb-16">
                        <span className="font-handwriting text-2xl md:text-3xl text-amber-700">jeszcze coś niejasne?</span>
                        <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-stone-900 mt-2 tracking-tight">Pytania, które padają najczęściej</h2>
                    </div>
                    <FAQAccordion items={FAQ_ITEMS} />
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl animate-float" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-rose-500/20 blur-3xl animate-float" style={{ animationDelay: '7s' }} />
                </div>
                <div className="max-w-3xl mx-auto text-center relative">
                    <span className="font-handwriting text-2xl md:text-3xl text-amber-300">no to co — robimy?</span>
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-6xl mt-2 mb-6 tracking-tight">
                        Daj komuś prezent,<br /> który przeżyje Was oboje
                    </h2>
                    <p className="text-base md:text-lg text-stone-300 mb-8 md:mb-10 max-w-xl mx-auto">
                        Zostało <strong className="text-amber-300">{stats.remainingMonthlySlots} miejsc</strong> w tym miesiącu. Następne dopiero w przyszłym.
                    </p>
                    <a href="#quick-start" className="group inline-flex items-center gap-3 px-7 md:px-10 py-4 md:py-5 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 text-stone-900 font-bold text-base md:text-xl shadow-2xl shadow-amber-500/40 hover:shadow-amber-500/60 hover:-translate-y-1 transition-all animate-pulse-soft">
                        <Gift className="w-5 md:w-6 h-5 md:h-6" />
                        Tak, stwarzam wyzwanie
                        <ArrowRight className="w-5 md:w-6 h-5 md:h-6 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </section>

            {/* JSON-LD for SEO — FAQPage schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: FAQ_ITEMS.map(it => ({
                            '@type': 'Question',
                            name: it.q,
                            acceptedAnswer: { '@type': 'Answer', text: it.a },
                        })),
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'BreadcrumbList',
                        itemListElement: [
                            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: 'https://wlasniewski.pl' },
                            { '@type': 'ListItem', position: 2, name: 'Foto Wyzwanie', item: 'https://wlasniewski.pl/foto-wyzwanie' },
                        ],
                    }),
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Product',
                        name: 'Foto Wyzwanie — sesja fotograficzna w prezencie',
                        image: 'https://wlasniewski.pl/og-image.jpg',
                        description: 'Pakiety sesji fotograficznych w formie prezentu dla bliskiej osoby. Toruń, Bydgoszcz, całe województwo kujawsko-pomorskie.',
                        brand: { '@type': 'Brand', name: 'Przemysław Właśniewski Fotograf' },
                        aggregateRating: {
                            '@type': 'AggregateRating',
                            ratingValue: '5.0',
                            reviewCount: Math.max(stats.completedSessions, 12),
                            bestRating: '5',
                            worstRating: '1',
                        },
                        offers: {
                            '@type': 'AggregateOffer',
                            priceCurrency: 'PLN',
                            lowPrice: packages.length ? Math.min(...packages.map(p => p.challenge_price)) : 200,
                            highPrice: packages.length ? Math.max(...packages.map(p => p.challenge_price)) : 800,
                            offerCount: packages.length || 3,
                            availability: 'https://schema.org/InStock',
                        },
                    }),
                }}
            />
        </div>
    );
}

/* ─── presentation primitives (server) ─── */

function Stat({ icon, value, label, highlight }: { icon: React.ReactNode; value: string; label: string; highlight?: boolean }) {
    return (
        <div className={`flex flex-col items-center ${highlight ? 'text-rose-700' : 'text-stone-700'}`}>
            <div className={`mb-2 ${highlight ? 'text-rose-600' : 'text-amber-600'}`}>{icon}</div>
            <div className="font-display font-bold text-3xl md:text-4xl">{value}</div>
            <div className="text-sm text-stone-500 mt-1">{label}</div>
        </div>
    );
}

function Benefit({ icon, title, description, color }: { icon: React.ReactNode; title: string; description: string; color: 'rose' | 'amber' | 'emerald' }) {
    const c = {
        rose: { bg: 'bg-rose-50', border: 'border-rose-200', icon: 'bg-rose-100 text-rose-700' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'bg-amber-100 text-amber-700' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'bg-emerald-100 text-emerald-700' },
    }[color];
    return (
        <div className={`group p-8 rounded-2xl ${c.bg} border ${c.border} transition-all hover:-translate-y-1`}>
            <div className={`w-14 h-14 rounded-xl ${c.icon} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>{icon}</div>
            <h3 className="font-display font-bold text-2xl text-stone-900 mb-3">{title}</h3>
            <p className="text-stone-600 leading-relaxed">{description}</p>
        </div>
    );
}

function Step({ n, icon, title, description, color }: { n: number; icon: React.ReactNode; title: string; description: string; color: 'rose' | 'amber' | 'emerald' }) {
    const grad = {
        rose: 'from-rose-400 to-rose-600',
        amber: 'from-amber-400 to-amber-600',
        emerald: 'from-emerald-400 to-emerald-600',
    }[color];
    return (
        <div className="relative bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white shadow-lg relative`}>
                {icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-stone-900 font-bold text-sm shadow-md">{n}</div>
            </div>
            <h3 className="font-display font-bold text-2xl text-stone-900 mb-3 text-center">{title}</h3>
            <p className="text-stone-600 text-center leading-relaxed">{description}</p>
        </div>
    );
}

function PackageCard({ pkg, highlighted }: { pkg: Pkg; highlighted?: boolean }) {
    const items = (pkg.included_items || '').split(/\n|;|,/).map(s => s.trim()).filter(Boolean).slice(0, 4);
    const savings = pkg.base_price - pkg.challenge_price;
    return (
        <div className={`relative rounded-2xl p-8 transition-all hover:-translate-y-2 ${highlighted
            ? 'bg-gradient-to-br from-amber-50 to-rose-50 border-2 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.03]'
            : 'bg-white border border-stone-200 shadow-md hover:shadow-xl'}`}>
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
                    {savings > 0 && <span className="text-stone-400 line-through text-sm">{pkg.base_price} zł</span>}
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
                    : 'bg-stone-100 text-stone-800 hover:bg-stone-200'}`}
            >
                Wybieram
            </Link>
        </div>
    );
}
