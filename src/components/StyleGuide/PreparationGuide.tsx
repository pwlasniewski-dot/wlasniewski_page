'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown, Heart, Palette, PersonStanding, ShieldCheck, Shirt } from 'lucide-react';
import OutfitCollageCard from './OutfitCollageCard';
import TipCard from './TipCard';
import type {
    ClientPreparationGuideData,
    PoseGuideCard,
    PreparationGuideFaq,
    PreparationGuidePalette,
    PreparationGuidePaletteColor,
    PreparationGuideTip,
} from '@/types/preparation-guide';

type FallbackContext = {
    serviceType?: string;
    groupSize?: number;
    location?: string;
};

export default function PreparationGuide({
    data,
    fallbackContext,
}: {
    data: ClientPreparationGuideData;
    fallbackContext?: FallbackContext;
}) {
    const [section, setSection] = useState<'wardrobe' | 'poses'>('wardrobe');
    const serviceType = data.context.serviceType || fallbackContext?.serviceType;
    const location = data.context.location || fallbackContext?.location;
    const groupSize = fallbackContext?.groupSize;

    return (
        <section className="space-y-6" aria-labelledby="preparation-heading">
            <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-8">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-500">Przygotowanie do sesji</p>
                <h2 id="preparation-heading" className="text-2xl font-bold text-white sm:text-4xl">Spokojnie — poprowadzę Cię krok po kroku</h2>
                <p className="mt-3 max-w-3xl leading-relaxed text-zinc-300">
                    Przejrzyj wskazówki w swoim tempie. Nie musisz niczego uczyć się na pamięć.
                    Podczas sesji dopasujemy ubranie i ustawienia do Ciebie, miejsca i Waszego komfortu.
                </p>
                {(serviceType || location || groupSize) && (
                    <ul className="mt-5 flex flex-wrap gap-2" aria-label="Kontekst Twojej sesji">
                        {serviceType && <li className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-sm text-zinc-300">{serviceType}</li>}
                        {location && <li className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-sm text-zinc-300">{location}</li>}
                        {groupSize && groupSize > 0 && <li className="rounded-full border border-zinc-700 bg-zinc-950/60 px-3 py-1 text-sm text-zinc-300">{groupSize} osób</li>}
                    </ul>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-700 bg-zinc-950/80 p-2.5 shadow-lg shadow-black/20 sm:gap-3 sm:p-3" role="group" aria-label="Tematy przygotowania">
                <button
                    aria-pressed={section === 'wardrobe'}
                    onClick={() => setSection('wardrobe')}
                    className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-base font-black outline-none transition-all focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:min-h-16 sm:px-4 sm:text-lg ${section === 'wardrobe' ? 'border-gold-300 bg-gold-500 text-black shadow-md shadow-gold-500/20' : 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-gold-500/70 hover:bg-zinc-800 hover:text-gold-300'}`}
                >
                    <Shirt className="h-5 w-5 shrink-0" aria-hidden />
                    <span>Jak się ubrać</span>
                </button>
                <button
                    aria-pressed={section === 'poses'}
                    onClick={() => setSection('poses')}
                    className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border px-2 py-3 text-base font-black outline-none transition-all focus-visible:ring-2 focus-visible:ring-gold-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:min-h-16 sm:px-4 sm:text-lg ${section === 'poses' ? 'border-gold-300 bg-gold-500 text-black shadow-md shadow-gold-500/20' : 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:border-gold-500/70 hover:bg-zinc-800 hover:text-gold-300'}`}
                >
                    <PersonStanding className="h-5 w-5 shrink-0" aria-hidden />
                    <span>Pozy</span>
                </button>
            </div>

            {section === 'wardrobe'
                ? <WardrobeGuide data={data.wardrobe} />
                : <PoseGuide cards={data.poses.cards} cmsTips={data.poses.tips} />}
        </section>
    );
}

function WardrobeGuide({ data }: { data: ClientPreparationGuideData['wardrobe'] }) {
    const { palettes, outfits, tips, faqs, checklists } = data;

    return (
        <div className="space-y-10">
            <section>
                <SectionTitle icon={<Shirt className="h-5 w-5" />} title="Najważniejsze zasady" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {tips.map((tip: PreparationGuideTip, index) => (
                        <TipCard key={tip.id} tip={tip} imagePriority={index < 2} />
                    ))}
                </div>
            </section>

            {palettes.length > 0 && (
                <section>
                    <SectionTitle icon={<Palette className="h-5 w-5" />} title="Palety kolorów" />
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                        {palettes.map((palette) => <PaletteGuideCard key={palette.id} palette={palette} />)}
                    </div>
                </section>
            )}

            {outfits.length > 0 && (
                <section>
                    <SectionTitle icon={<Shirt className="h-5 w-5" />} title="Przykładowe zestawy" />
                    <div className="space-y-5">
                        {outfits.map((outfit) => (
                            <div key={outfit.id} className="overflow-hidden rounded-2xl bg-white py-4">
                                <OutfitCollageCard outfit={outfit} showSubtitle={false} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <SectionTitle icon={<Check className="h-5 w-5" />} title="Checklisty" />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {checklists.map((list) => (
                        <div key={list.title} className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5 sm:p-6">
                            <h4 className="mb-4 text-lg font-bold text-white">{list.title}</h4>
                            <ul className="space-y-3">
                                {list.items.map((item) => (
                                    <li key={item} className="flex gap-3 text-base leading-relaxed text-zinc-200">
                                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {faqs.length > 0 && (
                <section>
                    <SectionTitle icon={<Heart className="h-5 w-5" />} title="Najczęstsze pytania" />
                    <div className="space-y-3">
                        {faqs.map((faq: PreparationGuideFaq) => (
                            <details key={faq.id} className="group rounded-2xl border border-zinc-700 bg-zinc-900/70 p-5 sm:p-6">
                                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-gold-400">
                                    {faq.question}
                                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                                </summary>
                                <p className="pt-3 leading-relaxed text-zinc-300">{faq.answer}</p>
                            </details>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

function PoseGuide({ cards, cmsTips }: { cards: PoseGuideCard[]; cmsTips: ClientPreparationGuideData['poses']['tips'] }) {
    return (
        <div className="space-y-8">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-50">
                <div className="flex items-center gap-3 font-bold">
                    <ShieldCheck className="h-5 w-5 shrink-0" />
                    Twój komfort jest ważniejszy niż poza
                </div>
                <p className="mt-3 text-sm leading-relaxed text-emerald-100/90">
                    Wybieraj tylko wygodne i stabilne ruchy. Możesz poprosić o przerwę, krzesło,
                    podparcie albo inną wersję. Kontakt fizyczny zawsze wymaga zgody, a dziecka
                    nie zmuszamy do bezruchu, dotyku ani patrzenia w aparat.
                </p>
            </div>

            {cmsTips.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {cmsTips.map((tip) => <TipCard key={tip.id} tip={tip} compact />)}
                </div>
            )}

            <div>
                <h3 className="text-2xl font-bold text-white">30 prostych ustawień</h3>
                <p className="mt-2 text-zinc-400">Każda karta działa także bez ilustracji. Rozwiń tę, którą chcesz spokojnie przejrzeć.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {cards.map((card) => <PoseCard key={card.id} card={card} />)}
            </div>
        </div>
    );
}

function isPaletteColor(value: unknown): value is PreparationGuidePaletteColor {
    if (!value || typeof value !== 'object') return false;
    const color = value as Record<string, unknown>;
    return typeof color.name === 'string'
        && typeof color.hex === 'string'
        && /^#[0-9a-f]{6}$/i.test(color.hex);
}

function PaletteGuideCard({ palette }: { palette: PreparationGuidePalette }) {
    const colors = Array.isArray(palette.colors)
        ? palette.colors.filter(isPaletteColor)
        : [];
    const image = Array.isArray(palette.example_images)
        ? palette.example_images.find((entry) => {
            if (!entry || typeof entry !== 'object') return false;
            const src = (entry as Record<string, unknown>).src;
            return typeof src === 'string'
                && /^\/images\/client-guides\/wardrobe\/[a-z0-9-]+\.webp$/i.test(src);
        }) as Record<string, unknown> | undefined
        : undefined;
    const imageSrc = typeof image?.src === 'string' ? image.src : null;
    const imageAlt = typeof image?.alt === 'string' && image.alt.trim()
        ? image.alt.trim()
        : `${palette.name} — przykład stylizacji`;
    const imageCaption = typeof image?.caption === 'string' && image.caption.trim()
        ? image.caption.trim()
        : 'Przykład połączenia kolorów w kompletnej stylizacji.';

    return (
        <article data-palette-card className="min-w-0 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900/70 shadow-lg shadow-black/10">
            <div className="p-5 pb-4 sm:p-6 sm:pb-5">
                <h4 className="break-words text-xl font-black text-white">{palette.name}</h4>
            </div>
            {imageSrc && (
                <figure className="border-y border-zinc-700 bg-[#f7eee3]">
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <Image
                            src={imageSrc}
                            alt={imageAlt}
                            fill
                            sizes="(max-width: 639px) 100vw, (max-width: 1279px) 50vw, 33vw"
                            className="object-contain"
                        />
                    </div>
                    <figcaption className="bg-zinc-950 px-5 py-3 text-base leading-relaxed text-zinc-200 sm:px-6">
                        {imageCaption}
                    </figcaption>
                </figure>
            )}
            <div className="p-5 sm:p-6">
            {palette.description && <p className="text-base leading-relaxed text-zinc-200">{palette.description}</p>}
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {colors.map((color) => (
                    <li key={`${color.name}-${color.hex}`} className="min-w-0 rounded-xl border border-zinc-600 bg-zinc-950/70 p-4">
                        <span
                            className="mb-3 block h-12 w-full rounded-lg border border-white/30"
                            style={{ backgroundColor: color.hex }}
                            aria-hidden
                        />
                        <span className="block break-words text-base font-bold text-white">{color.name}</span>
                        <span className="mt-1 block break-all font-mono text-sm uppercase text-zinc-300">{color.hex}</span>
                    </li>
                ))}
            </ul>
            </div>
        </article>
    );
}

function PoseCard({ card }: { card: PoseGuideCard }) {
    return (
        <details className="group min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-400">
                <div className="min-w-0">
                    <span className="text-xs font-bold text-gold-500">{card.id}</span>
                    <h4 className="break-words text-lg font-bold text-white">{card.title}</h4>
                    <p className="mt-1 text-sm text-zinc-400">{card.purpose}</p>
                </div>
                <ChevronDown className="h-5 w-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="space-y-5 border-t border-zinc-800 p-5">
                {card.image && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-950">
                        <Image src={card.image} alt={card.imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain" />
                    </div>
                )}
                <div>
                    <h5 className="mb-2 text-sm font-bold text-white">Jak to zrobić</h5>
                    <ol className="space-y-2">
                        {card.steps.map((step, index) => (
                            <li key={step} className="flex gap-3 text-sm leading-relaxed text-zinc-300">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-xs font-bold text-gold-400">{index + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ol>
                </div>
                <p className="text-sm leading-relaxed text-zinc-300">{card.body}</p>
                <Info label="Inny pomysł" value={card.variant} />
                <Info label="Możesz też" value={card.mobility} />
            </div>
        </details>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return <p className="text-sm leading-relaxed text-zinc-300"><strong className="text-zinc-100">{label}: </strong>{value}</p>;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
    return <h3 className="mb-5 flex items-center gap-3 text-2xl font-black text-white sm:text-3xl">{icon}{title}</h3>;
}
