import type { Metadata } from 'next';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Bell, Check, ShieldCheck } from 'lucide-react';

const canonical = 'https://wlasniewski.pl/sklep/poradnik-jak-sie-ubrac-i-pozowac';

export const metadata: Metadata = {
    title: 'Poradnik: jak się ubrać i pozować | W przygotowaniu',
    description: 'Zapowiedź praktycznego poradnika o ubiorze, kolorach i naturalnym pozowaniu do sesji zdjęciowej. Zostaw wiadomość, jeśli chcesz poznać termin premiery.',
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        url: canonical,
        title: 'Pełny poradnik: jak się ubrać i pozować',
        description: 'Praktyczne zestawy, palety, schematy pozowania i checklisty. Produkt jest w przygotowaniu.',
        images: [{ url: '/images/public-guide/family-seated-lilac.webp', width: 1122, height: 1402, alt: 'Ilustracyjny przykład rodzinnej stylizacji w zapowiedzi poradnika' }],
    },
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: 'Poradnik: jak się ubrać i pozować do sesji zdjęciowej',
    description: metadata.description,
    inLanguage: 'pl-PL',
    isPartOf: { '@id': 'https://wlasniewski.pl/#website' },
    breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Start', item: 'https://wlasniewski.pl/' },
            { '@type': 'ListItem', position: 2, name: 'Poradnik', item: canonical },
        ],
    },
};

export default function GuideProductPreviewPage() {
    return (
        <main className="min-h-screen bg-[#fbfaf7] px-5 pb-20 pt-32 text-stone-900 md:px-8 md:pt-44">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <div className="mx-auto max-w-6xl">
                <Link href="/jak-sie-ubrac" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-stone-600 underline-offset-4 hover:text-stone-950 hover:underline">
                    <ArrowLeft size={18} /> Wróć do bezpłatnego poradnika
                </Link>

                <section className="mt-7 grid overflow-hidden rounded-[2.5rem] border border-stone-200 bg-white shadow-[0_30px_100px_rgba(40,30,20,.10)] lg:grid-cols-2">
                    <div className="relative min-h-[420px] bg-[#f1e8d9] lg:min-h-[680px]">
                        <Image src="/images/public-guide/family-seated-lilac.webp" alt="Ilustracyjny przykład rodziny w skoordynowanych ubraniach, zapowiedź poradnika" fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" />
                        <span className="absolute left-5 top-5 rounded-full bg-stone-950 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">W przygotowaniu</span>
                    </div>
                    <div className="flex flex-col justify-center p-7 md:p-12">
                        <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-700">Pełna wersja poradnika</p>
                        <h1 className="mt-4 font-playfair text-4xl font-semibold leading-tight md:text-6xl">Jak się ubrać i pozować do sesji</h1>
                        <p className="mt-6 text-lg leading-8 text-stone-600">Praktyczny materiał do spokojnego przygotowania się przed zdjęciami — z większą liczbą przykładów niż w bezpłatnym artykule.</p>

                        <ul className="mt-7 space-y-4">
                            {['Zestawy dla par, rodzin, dzieci i portretów', 'Palety do miasta, natury, domu i różnych pór roku', 'Proste schematy ustawienia ciała, głowy i dłoni', 'Scenariusze sesji oraz checklisty do zapisania'].map(item => (
                                <li key={item} className="flex gap-3 leading-7"><Check className="mt-1 shrink-0 text-amber-700" size={19} />{item}</li>
                            ))}
                        </ul>

                        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                            <div className="flex gap-3"><ShieldCheck className="shrink-0 text-amber-800" size={22} /><p className="text-sm leading-6 text-stone-700"><strong>Uczciwa zapowiedź:</strong> poradnik nie jest jeszcze dostępny w sprzedaży. Cena, format i termin premiery zostaną podane po zakończeniu prac.</p></div>
                        </div>

                        <Link href="/kontakt?temat=poradnik" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-stone-950 px-7 py-3 font-semibold text-white transition hover:bg-amber-700">
                            <Bell size={18} /> Zapytaj o premierę
                        </Link>
                        <p className="mt-3 text-center text-xs leading-5 text-stone-500">Przejdziesz do formularza kontaktowego. Nie składasz zamówienia i niczego nie opłacasz.</p>
                    </div>
                </section>

                <section className="mx-auto mt-10 grid max-w-4xl gap-6 rounded-[2rem] border border-stone-200 bg-white p-6 md:grid-cols-[.75fr_1.25fr] md:items-center md:p-8">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#f5efe5]">
                        <Image src="/images/public-guide/parents-child-motion.webp" alt="Ilustracyjny przykład rodziców bawiących się z dzieckiem podczas sesji" fill sizes="(max-width: 768px) 100vw, 35vw" className="object-contain" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Przykład z poradnika</p>
                        <h2 className="mt-3 font-playfair text-3xl font-semibold">Nie tylko ustawienia — także prosty ruch</h2>
                        <p className="mt-4 leading-7 text-stone-600">Ilustracja pokazuje, jak wspólne zadanie angażuje dziecko i rozluźnia rodziców. W pełnej wersji podobne przykłady będą opisane krok po kroku.</p>
                    </div>
                </section>

                <section className="mx-auto max-w-3xl py-16 text-center">
                    <h2 className="font-playfair text-3xl font-semibold">Potrzebujesz wskazówek już teraz?</h2>
                    <p className="mt-4 leading-7 text-stone-600">Bezpłatny poradnik zawiera najważniejsze zasady ubioru, pozowania, trzy gotowe scenariusze i checklistę przed sesją.</p>
                    <Link href="/jak-sie-ubrac" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-stone-300 bg-white px-6 py-3 font-semibold hover:border-stone-900">Przeczytaj bezpłatny poradnik</Link>
                </section>
            </div>
        </main>
    );
}
