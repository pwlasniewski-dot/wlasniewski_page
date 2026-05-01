// SERVER COMPONENT — Foto-Match landing (waitlist / pre-launch).
// MVP jako podstrona wlasniewski.pl; przeniesienie na foto-match.pl =
// ustawienie ENV NEXT_PUBLIC_FOTO_MATCH_URL i deploy.
//
// SEO: cały content jest w SSR HTML (testowane). Jedyny JS = handler submit formularza.
// Galeria, akordeon FAQ, hover-zoom — czysty CSS, żaden useEffect.

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
    Sparkles, Heart, Camera, Users, Shield, Mail, Coffee, Briefcase,
    UserPlus, MapPin, CheckCircle2, ArrowRight, Quote
} from 'lucide-react';
import { getFotoMatchBaseUrl, getFotoMatchPathPrefix } from '@/lib/foto-match/base-url';
import WaitlistForm from './_components/WaitlistForm';
import { STYLE_GALLERY, HERO_BG } from './_data/photos';

export const revalidate = 3600;

const BASE = getFotoMatchBaseUrl();
const PREFIX = getFotoMatchPathPrefix();
const CANONICAL = `${BASE}${PREFIX || ''}`;

export const metadata: Metadata = {
    title: 'Foto-Match — wspólna sesja fotograficzna zamiast aplikacji randkowej | pre-launch',
    description:
        'Foto-Match to nowy sposób poznawania ludzi. Zamiast godzin w aplikacjach randkowych — 60 minut prawdziwego spotkania ze wspólną sesją zdjęciową. Profesjonalny fotograf jako świadek, neutralna lokalizacja, pamiątkowe zdjęcia. Toruń, Bydgoszcz. Zapisz się na waitlist.',
    keywords:
        'foto match, foto-match, sesja fotograficzna we dwoje, randka fotograficzna, poznaj kogoś sesja foto, alternatywa tinder, sesja foto z nieznajomym, wspólna sesja fotograficzna toruń, fotograf swatka, blind date sesja, oryginalna randka',
    alternates: { canonical: CANONICAL },
    openGraph: {
        title: 'Foto-Match — wspólna sesja zamiast aplikacji randkowej',
        description: '60 minut prawdziwego spotkania zamiast 60 godzin w czacie. Profesjonalny fotograf, neutralna lokalizacja, pamiątkowe zdjęcia. Pre-launch — zapisz się.',
        type: 'website',
        locale: 'pl_PL',
        url: CANONICAL,
        siteName: 'Foto-Match',
        images: [{ url: HERO_BG, width: 1200, height: 630, alt: 'Foto-Match — sesja fotograficzna w plenerze' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Foto-Match — wspólna sesja zamiast aplikacji randkowej',
        description: 'Pre-launch — zapisz się na waitlist.',
        images: [HERO_BG],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
};

// ─── DANE ────────────────────────────────────────────────────────────────────

const INTENTIONS = [
    {
        icon: Heart,
        tag: 'Randka',
        title: 'Szukasz kogoś bliskiego',
        bullets: [
            'Zamiast 3 miesięcy w czacie — 60 minut realnego spotkania',
            'Bez presji „co teraz powiedzieć?" — fotograf prowadzi sesję',
            'Pamiątkowe zdjęcia zostają z Tobą niezależnie czy zaiskrzy',
        ],
        color: 'from-pink-500 to-rose-500',
    },
    {
        icon: Coffee,
        tag: 'Nowi znajomi',
        title: 'Chcesz poznać ludzi po przeprowadzce',
        bullets: [
            'Profile filtrowane po wspólnych zainteresowaniach',
            'Spotkanie w neutralnym miejscu — kawa + 60 min sesji',
            'Brak romantycznej presji — przyjaźń to też powód',
        ],
        color: 'from-purple-500 to-indigo-500',
    },
    {
        icon: Briefcase,
        tag: 'Networking',
        title: 'Budujesz relacje zawodowe',
        bullets: [
            'Dobór po branży, etapie kariery i celach',
            'LinkedIn jest jałowy — tu dostajesz realną rozmowę',
            'Bonus: świeże zdjęcie portretowe na profil zawodowy',
        ],
        color: 'from-emerald-500 to-teal-500',
    },
] as const;

const STEPS = [
    {
        n: '1',
        icon: UserPlus,
        title: 'Zapisz się',
        text: 'Email + miasto + intencja. 30 sekund. Zero kart kredytowych na waitlist.',
    },
    {
        n: '2',
        icon: Users,
        title: 'Dobieramy parę',
        text: 'Algorytm + człowiek. Filtrujemy po mieście, intencji, wieku i dostępności. Akceptujesz lub odrzucasz propozycję.',
    },
    {
        n: '3',
        icon: Camera,
        title: 'Sesja fotograficzna',
        text: 'Spotkanie z fotografem w publicznym miejscu (kawiarnia, park, plener). 30–60 minut prowadzonej sesji = naturalne wyjście do rozmowy.',
    },
    {
        n: '4',
        icon: Heart,
        title: 'Co dalej zależy od Was',
        text: 'Pamiątkowe zdjęcia trafiają do Was w 7 dni. Decyzja o kolejnym spotkaniu — Wasza, nie nasza.',
    },
] as const;

const SAFETY = [
    { icon: Shield, title: 'Weryfikacja tożsamości', text: 'Zdjęcie + dokument + selfie przy zapisie. Bez fake profili.' },
    { icon: MapPin, title: 'Tylko miejsca publiczne', text: 'Kawiarnie, restauracje, parki, bulwary. Nigdy mieszkania prywatne.' },
    { icon: Camera, title: 'Fotograf = świadek', text: 'Profesjonalny fotograf obecny od początku do końca spotkania.' },
    { icon: CheckCircle2, title: 'Zgłoszenia i blokady', text: 'Jeden klik = blokada na zawsze. Każde zgłoszenie sprawdzamy ręcznie.' },
] as const;

const FAQ = [
    {
        q: 'Czym Foto-Match różni się od Tindera, Bumble, Hinge?',
        a: 'Aplikacje randkowe optymalizują pod czas spędzony w aplikacji — im dłużej przeglądasz profile i piszesz, tym lepiej dla nich. Foto-Match optymalizuje pod realne spotkanie. Płacisz raz, dobieramy parę, idziesz na sesję. Brak czatu, brak przeglądania kart bez końca, brak nagabywania. Zamiast 60 godzin w aplikacji — 60 minut przy aparacie z drugim człowiekiem.',
    },
    {
        q: 'Czy to wyłącznie randki?',
        a: 'Nie. Wybierasz intencję: „randka" (cel romantyczny), „nowi znajomi" (przyjaźń, hobby, networking lokalny po przeprowadzce), „networking biznesowy" (founderzy, freelancerzy, branża). System dobiera tylko w obrębie tej samej intencji — nikt nie zmusza Cię do randki gdy chcesz przyjaciół.',
    },
    {
        q: 'Co jeśli druga osoba mi się nie spodoba na zdjęciu?',
        a: 'Po dobraniu pary widzisz profil i 2–3 zdjęcia drugiej osoby. Możesz odrzucić bez podawania powodu — nie traci ona pieniędzy, dostaje propozycję kolejnej osoby. To nie aukcja — to miękki wybór po obu stronach.',
    },
    {
        q: 'Co dostaję poza poznaniem osoby?',
        a: 'Profesjonalną sesję fotograficzną 30–60 min, 8–15 obrobionych zdjęć w 7 dni. Nawet jeśli z drugą osobą „nie zaiskrzy" — wychodzisz z sesją, której koszt na otwartym rynku to 400–600 zł. To realna wartość niezależna od wyniku spotkania.',
    },
    {
        q: 'Bezpieczeństwo — jak realnie wygląda?',
        a: 'Trzy warstwy: (1) weryfikacja tożsamości przy zapisie — selfie + dokument, (2) miejsca tylko publiczne, fotograf obecny przez całą sesję jako świadek, (3) jeden klik = blokada osoby na zawsze, każde zgłoszenie sprawdzamy ręcznie. Zero anonimowości — każdy uczestnik jest zweryfikowany.',
    },
    {
        q: 'Ile to kosztuje?',
        a: 'Cenę finalną ogłaszamy przy starcie. Osoby z waitlist dostają cenę „early-bird" — istotnie niższą niż docelowa. W cenie: dobór, 60-minutowa sesja, 8–15 obrobionych zdjęć. Jeśli rynkowa wartość samej sesji to 400–600 zł, target Foto-Match to znacząco mniej.',
    },
    {
        q: 'Kiedy start? W jakich miastach?',
        a: 'Premiera publiczna planowana na sezon letni 2026. Wcześniej testy zamknięte z osobami z waitlist — startujemy od miast z największą liczbą zapisanych (Toruń i Bydgoszcz mają już pozycję startową). Im więcej zapisanych z Twojego miasta, tym wcześniej tam wchodzimy.',
    },
    {
        q: 'A jeśli chcę się wypisać?',
        a: 'W każdym mailu znajdziesz link „Wypisz mnie". Twoje dane usuwamy w 7 dni od kliknięcia (możliwość zachowania jeśli korzystasz z usługi). Zero retencji „na wszelki wypadek".',
    },
] as const;

// ─── JSON-LD ─────────────────────────────────────────────────────────────────

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
};

const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Foto-Match',
    url: CANONICAL,
    description: 'Platforma łącząca ludzi przez wspólne sesje fotograficzne. Pre-launch w Toruniu i Bydgoszczy.',
    inLanguage: 'pl-PL',
    publisher: {
        '@type': 'Organization',
        name: 'Przemysław Właśniewski — Fotograf',
        url: 'https://wlasniewski.pl',
    },
};

// ─── KOMPONENT ───────────────────────────────────────────────────────────────

export default function FotoMatchPage() {
    return (
        <main className="bg-zinc-950 text-zinc-100">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
            />

            {/* ═══ HERO Z TŁEM FOTO ═══ */}
            <section className="relative min-h-[100svh] overflow-hidden">
                <div className="absolute inset-0">
                    <Image
                        src={HERO_BG}
                        alt="Sesja fotograficzna w plenerze podczas złotej godziny — Toruń"
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/60 to-zinc-950" />
                    <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/85 via-zinc-950/40 to-transparent" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-16 sm:pt-32 sm:pb-24 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center min-h-[100svh]">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 border border-amber-300/30 px-4 py-1.5 text-xs font-semibold text-amber-200 mb-6 backdrop-blur">
                            <Sparkles className="w-3.5 h-3.5" /> Pre-launch · zapisy na waitlist trwają
                        </div>
                        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight">
                            Wspólna sesja foto{' '}
                            <span className="bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                                zamiast aplikacji randkowej.
                            </span>
                        </h1>
                        <p className="mt-7 text-lg sm:text-2xl text-zinc-200 max-w-2xl leading-relaxed">
                            Zamiast 60&nbsp;godzin przeglądania profili i pisania „cześć, co tam?" —
                            <strong className="text-white"> 60&nbsp;minut realnego spotkania</strong> z drugim
                            człowiekiem, profesjonalnym fotografem i pamiątkowymi zdjęciami na koniec.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3 text-sm">
                            <Pill>✓ Profil zweryfikowany</Pill>
                            <Pill>✓ Miejsce publiczne</Pill>
                            <Pill>✓ Fotograf jako świadek</Pill>
                            <Pill>✓ Zdjęcia zostają z Tobą</Pill>
                        </div>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4">
                            <a
                                href="#waitlist"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-7 py-4 text-base font-bold text-white shadow-2xl shadow-rose-500/30 transition hover:scale-[1.02]"
                            >
                                Zapisz mnie na waitlist <ArrowRight className="w-5 h-5" />
                            </a>
                            <a
                                href="#jak-to-dziala"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
                            >
                                Jak to działa
                            </a>
                        </div>
                    </div>

                    {/* "Stack zdjęć" — żywy collage */}
                    <div className="hidden lg:block relative h-[520px]" aria-hidden="true">
                        <div className="absolute top-0 right-0 w-72 h-96 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-300">
                            <Image src={STYLE_GALLERY[2].src} alt="" fill sizes="288px" className="object-cover" />
                        </div>
                        <div className="absolute top-20 right-44 w-64 h-80 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 -rotate-6 transition-transform hover:rotate-0 hover:scale-105 duration-300">
                            <Image src={STYLE_GALLERY[4].src} alt="" fill sizes="256px" className="object-cover" />
                        </div>
                        <div className="absolute bottom-4 right-12 w-72 h-56 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 rotate-2 transition-transform hover:rotate-0 hover:scale-105 duration-300">
                            <Image src={STYLE_GALLERY[1].src} alt="" fill sizes="288px" className="object-cover" />
                        </div>
                    </div>
                </div>

                <a href="#problem" aria-label="Przewiń niżej" className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 items-center justify-center rounded-full border border-white/20 text-white/70 hover:text-white hover:border-white/50 transition">↓</a>
            </section>

            {/* ═══ PROBLEM ═══ */}
            <section id="problem" className="relative py-20 px-4 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(244,114,182,0.08),_transparent_50%)]" />
                <div className="relative max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="text-pink-400 font-semibold mb-3 text-sm tracking-wider uppercase">Co Cię tutaj sprowadziło</div>
                            <h2 className="text-3xl sm:text-5xl font-bold leading-tight mb-6">
                                Aplikacje randkowe nie chcą, żebyś znalazł osobę.
                            </h2>
                            <p className="text-lg text-zinc-300 leading-relaxed mb-4">
                                Im dłużej tam jesteś, tym lepiej dla nich. Ich biznes to retencja, nie skuteczność.
                                Twoja statystyka? Średnio <strong className="text-white">8 godzin tygodniowo</strong> na
                                czacie z osobami, które prawdopodobnie nigdy nie umówią się na żywo.
                            </p>
                            <p className="text-lg text-zinc-300 leading-relaxed">
                                Foto-Match ma odwrotny model: <strong className="text-white">płacisz raz, dobieramy
                                    osobę, idziesz na sesję.</strong> Im szybciej znajdziesz to czego szukasz, tym lepiej
                                dla nas (rekomendacje, wracający użytkownicy).
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <ProblemBox label="Średni czas w aplikacjach dziennie" value="2.4h" tone="bad" />
                            <ProblemBox label="Czat → realne spotkanie" value="3%" tone="bad" />
                            <ProblemBox label="Twój czas dla Foto-Match" value="60min" tone="good" />
                            <ProblemBox label="Realna sesja na końcu" value="100%" tone="good" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ TRZY INTENCJE ═══ */}
            <section className="py-20 px-4 bg-gradient-to-b from-zinc-950 to-zinc-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="text-pink-400 font-semibold mb-3 text-sm tracking-wider uppercase">Wybierasz po co przychodzisz</div>
                        <h2 className="text-3xl sm:text-5xl font-bold mb-4">Trzy intencje. Trzy światy.</h2>
                        <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                            System dobiera tylko w obrębie tej samej intencji. Nikt nie zaprosi Cię na randkę,
                            jeśli chcesz tylko poznać ludzi.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {INTENTIONS.map((it) => {
                            const Icon = it.icon;
                            return (
                                <div
                                    key={it.tag}
                                    className="group rounded-3xl bg-zinc-900/60 border border-white/10 p-7 transition-all hover:border-white/20 hover:bg-zinc-900 hover:-translate-y-1"
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${it.color} grid place-items-center text-white mb-5 shadow-lg`}>
                                        <Icon className="w-7 h-7" />
                                    </div>
                                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{it.tag}</div>
                                    <h3 className="text-xl font-bold mb-4">{it.title}</h3>
                                    <ul className="space-y-2.5">
                                        {it.bullets.map((b, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-zinc-300">
                                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ JAK TO DZIAŁA ═══ */}
            <section id="jak-to-dziala" className="py-20 px-4 bg-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14">
                        <div className="text-pink-400 font-semibold mb-3 text-sm tracking-wider uppercase">4 kroki</div>
                        <h2 className="text-3xl sm:text-5xl font-bold">Od zapisu do zdjęć — jak to wygląda</h2>
                    </div>

                    <div className="grid md:grid-cols-4 gap-5">
                        {STEPS.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.n} className="relative">
                                    <div className="rounded-2xl bg-zinc-950 border border-white/10 p-6 h-full">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 grid place-items-center font-black text-white shadow-lg">
                                                {s.n}
                                            </div>
                                            <Icon className="w-5 h-5 text-pink-400" />
                                        </div>
                                        <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">{s.text}</p>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-pink-500/60 z-10" aria-hidden="true" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ GALERIA STYLU ═══ */}
            <section className="py-20 px-4 bg-zinc-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-14 max-w-3xl mx-auto">
                        <div className="text-pink-400 font-semibold mb-3 text-sm tracking-wider uppercase">Tak wyglądają sesje</div>
                        <h2 className="text-3xl sm:text-5xl font-bold mb-4">Wasze zdjęcia. Nasza estetyka.</h2>
                        <p className="text-lg text-zinc-400">
                            Naturalne kadry w plenerze, złota godzina, ulice Torunia i Bydgoszczy.
                            Bez sztucznych póz — fotograf prowadzi sesję tak, żebyście rozmawiali, a nie stali na baczność.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {STYLE_GALLERY.map((p, i) => (
                            <figure
                                key={p.src}
                                className={`relative overflow-hidden rounded-2xl group ${i === 0 || i === 5 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'} ring-1 ring-white/5 hover:ring-white/30 transition-all`}
                            >
                                <Image
                                    src={p.src}
                                    alt={p.alt}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 25vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                {p.caption && (
                                    <figcaption className="absolute bottom-0 left-0 right-0 p-3 text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {p.caption}
                                    </figcaption>
                                )}
                            </figure>
                        ))}
                    </div>

                    <p className="text-xs text-zinc-500 text-center mt-8 italic max-w-3xl mx-auto leading-relaxed">
                        Zdjęcia z autorskiego portfolio fotografa{' '}
                        <Link href="/" className="text-zinc-400 hover:text-white underline">Przemysława Właśniewskiego</Link>{' '}
                        — pokazują jakość i styl sesji, jakie organizuje Foto-Match. Nie są fotografiami uczestników projektu.
                    </p>
                </div>
            </section>

            {/* ═══ BEZPIECZEŃSTWO ═══ */}
            <section className="py-20 px-4 bg-gradient-to-b from-zinc-950 to-zinc-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-14 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 text-emerald-400 font-semibold mb-3 text-sm tracking-wider uppercase">
                            <Shield className="w-4 h-4" /> Bezpieczeństwo
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-bold mb-4">Spotkanie z nieznajomą osobą — bez ryzyka</h2>
                        <p className="text-lg text-zinc-400">
                            Mówimy wprost: idziesz na spotkanie z kimś, kogo nie znasz. Dlatego bezpieczeństwo
                            jest wpisane w sam produkt, nie dodane na końcu jako regulamin.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {SAFETY.map((s) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.title} className="rounded-2xl bg-zinc-900/60 border border-emerald-500/20 p-6 text-center hover:border-emerald-500/50 transition">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/15 grid place-items-center mx-auto mb-4 text-emerald-400">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold mb-2">{s.title}</h3>
                                    <p className="text-sm text-zinc-400 leading-relaxed">{s.text}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ═══ MANIFESTO ═══ */}
            <section className="py-20 px-4 bg-zinc-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_rgba(244,114,182,0.06),_transparent_50%)]" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <Quote className="w-12 h-12 text-pink-500/40 mx-auto mb-6" aria-hidden="true" />
                    <blockquote className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                        „Ludzie nie potrzebują kolejnej aplikacji. Potrzebują pretekstu, żeby
                        wyjść z domu i zobaczyć drugiego człowieka{' '}
                        <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                            poza ekranem.
                        </span>"
                    </blockquote>
                    <cite className="block mt-6 text-sm text-zinc-500 not-italic">
                        — założyciel Foto-Match
                    </cite>
                </div>
            </section>

            {/* ═══ WAITLIST FORM ═══ */}
            <section id="waitlist" className="py-20 px-4 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black">
                <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
                    <div className="lg:sticky lg:top-24">
                        <div className="inline-flex items-center gap-2 rounded-full bg-pink-500/15 border border-pink-400/30 px-4 py-1.5 text-xs font-semibold text-pink-200 mb-5">
                            <Mail className="w-3.5 h-3.5" /> Zapis na waitlist
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-bold mb-5 leading-tight">
                            Bądź jedną z pierwszych osób.
                        </h2>
                        <p className="text-lg text-zinc-300 leading-relaxed mb-6">
                            Zapisani dostają dostęp <strong className="text-white">przed publicznym startem</strong> i{' '}
                            <strong className="text-white">cenę early-bird</strong> (sporo niższą niż docelowa).
                            Gdy w Twoim mieście uzbiera się komplet zapisanych — startujemy tam pierwsi.
                        </p>
                        <ul className="space-y-3 text-zinc-300">
                            <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Zero spamu — odzywamy się tylko z konkretem</li>
                            <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Bez karty kredytowej, bez zobowiązania</li>
                            <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Możliwość wypisu jednym kliknięciem</li>
                            <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> Wcześniejszy dostęp = lepsza dostępność partnerów</li>
                        </ul>
                    </div>

                    <div className="rounded-3xl bg-white shadow-2xl border border-white/10 p-7 sm:p-9 text-zinc-900">
                        <h3 className="text-2xl font-bold mb-1">Zapis zajmuje 30 sekund</h3>
                        <p className="text-sm text-gray-600 mb-6">Dostaniesz mail potwierdzający — kliknij link i jesteś na liście.</p>
                        <WaitlistForm />
                    </div>
                </div>
            </section>

            {/* ═══ FAQ ═══ */}
            <section className="py-20 px-4 bg-black">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="text-pink-400 font-semibold mb-3 text-sm tracking-wider uppercase">FAQ</div>
                        <h2 className="text-3xl sm:text-5xl font-bold">Pytania, które pewnie masz</h2>
                    </div>
                    <div className="space-y-3">
                        {FAQ.map((f, i) => (
                            <details
                                key={i}
                                className="group rounded-2xl border border-white/10 bg-zinc-900/50 p-5 sm:p-6 open:bg-zinc-900 open:border-pink-500/30 transition"
                            >
                                <summary className="cursor-pointer list-none font-semibold text-base sm:text-lg flex justify-between items-center gap-4">
                                    <span>{f.q}</span>
                                    <span className="text-pink-400 group-open:rotate-180 transition-transform shrink-0 w-6 h-6 grid place-items-center">▾</span>
                                </summary>
                                <p className="mt-4 text-zinc-300 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ FOOTER CTA ═══ */}
            <section className="py-16 px-4 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-500">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Następny krok jest prosty.</h2>
                    <p className="text-white/90 text-lg mb-7">Zapisz się i bądź w pierwszej fali użytkowników, gdy startujemy.</p>
                    <a
                        href="#waitlist"
                        className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-rose-600 shadow-2xl hover:scale-[1.03] transition"
                    >
                        Zapisz mnie na waitlist <ArrowRight className="w-5 h-5" />
                    </a>
                </div>
            </section>

            <footer className="border-t border-white/10 py-10 text-center text-sm text-zinc-500 bg-black">
                <p>© {new Date().getFullYear()} Foto-Match · projekt{' '}
                    <Link href="/" className="text-zinc-300 hover:text-white underline">
                        Przemysława Właśniewskiego
                    </Link>
                </p>
            </footer>
        </main>
    );
}

// ─── HELPERY ─────────────────────────────────────────────────────────────────

function Pill({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            {children}
        </span>
    );
}

function ProblemBox({ label, value, tone }: { label: string; value: string; tone: 'good' | 'bad' }) {
    const colors = tone === 'bad'
        ? 'border-red-500/30 bg-red-500/5 text-red-300'
        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    return (
        <div className={`rounded-2xl border-2 p-5 ${colors}`}>
            <div className="text-3xl sm:text-4xl font-black mb-1">{value}</div>
            <div className="text-xs sm:text-sm text-zinc-300 leading-tight">{label}</div>
        </div>
    );
}
