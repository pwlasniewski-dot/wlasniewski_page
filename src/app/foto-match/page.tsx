// SERVER COMPONENT — Foto-Match landing (waitlist / pre-launch).
// MVP jako podstrona wlasniewski.pl; przeniesienie na foto-match.pl =
// ustawienie ENV NEXT_PUBLIC_FOTO_MATCH_URL i deploy.

import type { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Heart, Camera, Users, Shield, Zap, Mail } from 'lucide-react';
import { getFotoMatchBaseUrl, getFotoMatchPathPrefix } from '@/lib/foto-match/base-url';
import WaitlistForm from './_components/WaitlistForm';

export const revalidate = 3600;

const BASE = getFotoMatchBaseUrl();
const PREFIX = getFotoMatchPathPrefix();
const CANONICAL = `${BASE}${PREFIX || ''}`;

export const metadata: Metadata = {
    title: 'Foto-Match — poznaj kogoś przez wspólną sesję fotograficzną | pre-launch',
    description:
        'Foto-Match to nowy sposób na poznanie ludzi — dobierasz osobę z którą zrobicie wspólną sesję fotograficzną. Realne spotkanie, profesjonalne zdjęcia, brak swipe’owania w nieskończoność. Zapisz się na waitlist.',
    keywords:
        'foto match, foto-match, sesja fotograficzna we dwoje, randka fotograficzna, poznaj kogoś sesja foto, alternatywa tinder, sesja foto z nieznajomym, wspólna sesja fotograficzna toruń, fotograf swatka',
    alternates: { canonical: CANONICAL },
    openGraph: {
        title: 'Foto-Match — poznaj kogoś przez wspólną sesję foto',
        description: 'Pre-launch. Zapisz się na waitlist i bądź w pierwszej fali użytkowników.',
        type: 'website',
        locale: 'pl_PL',
        url: CANONICAL,
        siteName: 'Foto-Match',
        images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Foto-Match — pre-launch' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Foto-Match — poznaj kogoś przez wspólną sesję foto',
        description: 'Pre-launch — zapisz się na waitlist.',
        images: ['/og-image.jpg'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
};

const FAQ = [
    {
        q: 'Co to jest Foto-Match?',
        a: 'Foto-Match to platforma, która łączy dwie osoby w celu wspólnej sesji fotograficznej z profesjonalnym fotografem. Dobieramy ludzi w oparciu o miasto, dostępność i preferencje, a sesja jest neutralnym, bezpiecznym kontekstem do realnego poznania się.',
    },
    {
        q: 'Czym to się różni od aplikacji randkowej?',
        a: 'Nie ma swipe’owania, nie ma czatów w nieskończoność. Płacisz raz, wybierasz termin i lokalizację, my dobieramy osobę i fotografa. Zamiast zdjęć z filtra — realne spotkanie i pamiątkowe zdjęcia (które trafiają do Was niezależnie od tego czy „zaiskrzyło”).',
    },
    {
        q: 'Czy to jest tylko randkowe?',
        a: 'Nie. Profile można ustawić jako „nowi znajomi”, „randka”, „networking biznesowy”. Foto-Match dobiera w obrębie tej samej intencji.',
    },
    {
        q: 'Ile to kosztuje?',
        a: 'Cena finalna ogłoszona przy starcie — zapisani na waitlist dostają dostęp z ceną early-bird. Pakiet zawiera dobór, sesję 30–60 min i obrobione zdjęcia.',
    },
    {
        q: 'Bezpieczeństwo?',
        a: 'Sesja zawsze odbywa się w obecności fotografa — to świadek i element bezpieczeństwa. Weryfikacja tożsamości przy zapisie + możliwość zgłoszenia / blokady. Lokalizacje publiczne lub półpubliczne (kawiarnia, park, plener).',
    },
    {
        q: 'Kiedy start?',
        a: 'Premiera planowana na sezon 2026 — wcześniej testy zamknięte z osobami z waitlist. Im więcej zapisanych w danym mieście, tym wcześniej tam ruszamy.',
    },
    {
        q: 'Czy mogę się wypisać?',
        a: 'Tak, w każdym mailu znajdziesz link wypisu. Twoje dane usuwamy w 7 dni po wypisie.',
    },
];

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
    description: 'Platforma łącząca ludzi przez wspólne sesje fotograficzne.',
    inLanguage: 'pl-PL',
};

export default function FotoMatchPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-pink-50">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
            />

            {/* HERO */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.15),_transparent_60%)]" />
                <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-12 sm:pt-28 sm:pb-16">
                    <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-900 mb-6">
                        <Sparkles className="w-3.5 h-3.5" /> Pre-launch · zapis na waitlist
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
                        Poznaj kogoś przez{' '}
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            wspólną sesję foto
                        </span>
                    </h1>
                    <p className="mt-6 text-lg sm:text-xl text-gray-700 max-w-3xl">
                        Zero swipe’owania. Wybierasz miasto i intencję, my dobieramy osobę i fotografa.
                        Zamiast godzin w czacie — realne 30 minut z aparatem między Wami i pamiątkowe zdjęcia
                        na koniec.
                    </p>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="order-2 md:order-1 space-y-5">
                            <Feature icon={Users} title="Dobieramy z głową" text="Algorytm + człowiek. Miasto, intencja, wspólne zainteresowania, dostępność." />
                            <Feature icon={Camera} title="Profesjonalny fotograf na miejscu" text="Sesja 30–60 min, lokalizacja publiczna, świadek całego spotkania." />
                            <Feature icon={Shield} title="Bezpieczeństwo zaszyte w produkt" text="Weryfikacja tożsamości, możliwość zgłoszenia i blokady, dane szyfrowane." />
                            <Feature icon={Heart} title="Trzy intencje, nie tylko randki" text="„Nowi znajomi”, „randka”, „networking”. Dobieramy w obrębie tej samej intencji." />
                            <Feature icon={Zap} title="Bez nieskończonego czatu" text="Płacisz raz, wybierasz termin, dostajesz dobór — i koniec." />
                        </div>

                        <div className="order-1 md:order-2 rounded-3xl bg-white shadow-2xl border border-purple-100 p-6 sm:p-8">
                            <div className="flex items-center gap-2 text-purple-700 font-semibold mb-1">
                                <Mail className="w-5 h-5" /> Zapis na waitlist
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Bądź pierwszy</h2>
                            <p className="text-sm text-gray-600 mb-5">
                                Zapisani dostaną dostęp przed publicznym startem i cenę early-bird.
                                Bez spamu — odzywamy się tylko z konkretem.
                            </p>
                            <WaitlistForm />
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="max-w-6xl mx-auto px-4 py-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10 text-center">Jak to działa</h2>
                <ol className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { n: 1, t: 'Zapisujesz się', d: 'Email + miasto + intencja. 30 sekund.' },
                        { n: 2, t: 'Dobieramy', d: 'Łączymy Cię z osobą o tej samej intencji w okolicy.' },
                        { n: 3, t: 'Sesja foto', d: 'Spotykacie się z fotografem. 30–60 min, neutralny grunt.' },
                        { n: 4, t: 'Dostajesz zdjęcia', d: 'Niezależnie od dalszego rozwoju znajomości.' },
                    ].map((s) => (
                        <li key={s.n} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
                            <div className="text-3xl font-black text-purple-600 mb-2">{s.n}</div>
                            <div className="font-bold text-gray-900 mb-1">{s.t}</div>
                            <div className="text-sm text-gray-600">{s.d}</div>
                        </li>
                    ))}
                </ol>
            </section>

            {/* FAQ */}
            <section className="max-w-3xl mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">FAQ</h2>
                <div className="space-y-4">
                    {FAQ.map((f, i) => (
                        <details key={i} className="group rounded-xl border border-gray-200 bg-white p-5 open:shadow-md">
                            <summary className="cursor-pointer list-none font-semibold text-gray-900 flex justify-between items-center">
                                <span>{f.q}</span>
                                <span className="text-purple-600 group-open:rotate-180 transition">▾</span>
                            </summary>
                            <p className="mt-3 text-gray-700 leading-relaxed">{f.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            <footer className="border-t border-gray-200 py-10 text-center text-sm text-gray-600">
                <p>© {new Date().getFullYear()} Foto-Match · projekt{' '}
                    <Link href="/" className="text-purple-600 underline">Przemysław Właśniewski</Link>
                </p>
            </footer>
        </main>
    );
}

function Feature({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
    return (
        <div className="flex gap-4">
            <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 grid place-items-center text-white shadow-md">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <div className="font-bold text-gray-900">{title}</div>
                <div className="text-sm text-gray-600">{text}</div>
            </div>
        </div>
    );
}
