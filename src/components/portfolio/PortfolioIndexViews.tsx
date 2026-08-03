'use client';

import Link from 'next/link';
import { ArrowRight, Camera, Images } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

export type PortfolioIndexLayout = 'chapters' | 'cinematic_contact';

type PortfolioIndexItem = {
    id?: number | string;
    slug: string;
    title: string;
    description?: string;
    coverImage?: string;
    imageCount?: number;
    category?: string;
};

type PortfolioIndexViewsProps = {
    items: PortfolioIndexItem[];
    layout: PortfolioIndexLayout;
    isSessionMode?: boolean;
    heroImage?: string;
    heroTitle?: string;
    heroSlides?: Array<{ id?: string | number; image?: string; image_desktop?: string; image_mobile?: string; title?: string; enabled?: boolean }>;
    supplementalContent?: ReactNode;
};

const CATEGORY_PRESENTATION: Record<string, { title: string; label: string; description: string }> = {
    family: { title: 'Sesja rodzinna', label: 'Bliskość', description: 'Naturalne spotkania rodzin, par i kilku pokoleń.' },
    'sesja rodzinna': { title: 'Sesja rodzinna', label: 'Bliskość', description: 'Naturalne spotkania rodzin, par i kilku pokoleń.' },
    wedding: { title: 'Ślub', label: 'Reportaż', description: 'Od przygotowań i ceremonii po przyjęcie pełne emocji.' },
    slub: { title: 'Ślub', label: 'Reportaż', description: 'Od przygotowań i ceremonii po przyjęcie pełne emocji.' },
    komunia: { title: 'Komunia', label: 'Rodzinna uroczystość', description: 'Spokojny reportaż z ceremonii i spotkania najbliższych.' },
    communion: { title: 'Komunia', label: 'Rodzinna uroczystość', description: 'Spokojny reportaż z ceremonii i spotkania najbliższych.' },
    ewent: { title: 'Urodziny i przyjęcia', label: 'Emocje', description: 'Urodziny, jubileusze i rodzinne uroczystości bez sztywnych póz.' },
    event: { title: 'Urodziny i przyjęcia', label: 'Emocje', description: 'Urodziny, jubileusze i rodzinne uroczystości bez sztywnych póz.' },
    events: { title: 'Urodziny i przyjęcia', label: 'Emocje', description: 'Urodziny, jubileusze i rodzinne uroczystości bez sztywnych póz.' },
    portret: { title: 'Portret', label: 'Charakter', description: 'Portrety osobiste i wizerunkowe z miejscem na prawdziwą osobowość.' },
    portrait: { title: 'Portret', label: 'Charakter', description: 'Portrety osobiste i wizerunkowe z miejscem na prawdziwą osobowość.' },
    plener: { title: 'Sesje w plenerze', label: 'Przestrzeń', description: 'Miasto, natura i światło, które budują atmosferę całej historii.' },
};

function presentation(item: PortfolioIndexItem) {
    const key = (item.category || item.slug || item.title).toLocaleLowerCase('pl').trim();
    const exact = CATEGORY_PRESENTATION[key];
    if (exact) return exact;

    const matchedKey = Object.keys(CATEGORY_PRESENTATION).find(candidate => key.includes(candidate));
    return matchedKey
        ? CATEGORY_PRESENTATION[matchedKey]
        : { title: item.title, label: 'Historia', description: item.description || 'Wybrane fotografie z jednej opowieści.' };
}

function itemHref(item: PortfolioIndexItem, isSessionMode: boolean) {
    if (!isSessionMode) return `/portfolio/${encodeURIComponent(item.slug)}`;
    const category = item.category ? encodeURIComponent(item.category) : 'sesja';
    return `/portfolio/${category}/${encodeURIComponent(item.slug)}`;
}

function PortfolioImage({ item, priority = false }: { item: PortfolioIndexItem; priority?: boolean }) {
    if (!item.coverImage) {
        return <div className="absolute inset-0 grid place-items-center bg-[#29251f]"><Camera className="h-12 w-12 text-white/20" /></div>;
    }

    return (
        <img
            src={item.coverImage}
            alt={`${presentation(item).title} — portfolio fotograficzne`}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            className="absolute inset-0 h-full w-full object-cover transition duration-[1400ms] ease-out group-hover:scale-[1.035]"
        />
    );
}

function PortfolioIntro({ heroImage, heroTitle, heroSlides = [] }: Pick<PortfolioIndexViewsProps, 'heroImage' | 'heroTitle' | 'heroSlides'>) {
    const enabledSlides = heroSlides.filter(slide => slide.enabled !== false && (slide.image_desktop || slide.image));
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (enabledSlides.length < 2) return;
        const timer = window.setInterval(() => setActiveIndex(index => (index + 1) % enabledSlides.length), 6500);
        return () => window.clearInterval(timer);
    }, [enabledSlides.length]);

    const activeSlide = enabledSlides[activeIndex] || null;
    const desktopImage = activeSlide?.image_desktop || activeSlide?.image || heroImage;
    const mobileImage = activeSlide?.image_mobile || desktopImage;

    return (
        <header className="relative flex min-h-[82svh] items-end overflow-hidden bg-[#1d1a16] px-5 pb-16 pt-32 text-white sm:px-8 md:min-h-[88svh] md:pb-24 lg:px-14">
            {desktopImage && (
                <picture className="absolute inset-0 block h-full w-full">
                    {mobileImage && <source media="(max-width: 767px)" srcSet={mobileImage} />}
                    <img key={desktopImage} src={desktopImage} alt="Wybrane portfolio fotograficzne" fetchPriority="high" className="h-full w-full object-cover motion-safe:animate-[fadeIn_.8s_ease-out]" />
                </picture>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,15,12,.9)_0%,rgba(18,15,12,.42)_48%,rgba(18,15,12,.12)_78%),linear-gradient(0deg,rgba(12,10,8,.78)_0%,transparent_58%)]" />
            <div className="relative z-10 mx-auto w-full max-w-[1380px]">
                <p className="mb-5 text-[10px] font-bold uppercase tracking-[.34em] text-[#e5c98f] sm:text-xs">Portfolio · Toruń i okolice</p>
                <h1 className="max-w-5xl font-display text-[clamp(3.5rem,8vw,8.5rem)] font-normal leading-[.82] tracking-[-.055em] text-[#fffaf1]">
                    {activeSlide?.title || heroTitle || 'Historie zapisane światłem'}
                </h1>
                <p className="mt-7 max-w-2xl text-sm leading-7 text-white/72 sm:text-base md:text-lg">
                    Rodzina, ślub, portret i najważniejsze chwile — fotografowane spokojnie, naturalnie i z uwagą na to, co dzieje się pomiędzy.
                </p>
                <a href="#wybrane-historie" className="mt-8 inline-flex min-h-11 items-center gap-3 rounded-full border border-white/35 px-5 text-[10px] font-bold uppercase tracking-[.18em] text-white transition hover:border-[#e5c98f] hover:text-[#e5c98f]">
                    Zobacz wybrane historie <ArrowRight size={15} />
                </a>
                {enabledSlides.length > 1 && (
                    <div className="mt-7 flex gap-2" aria-label="Wybór zdjęcia otwierającego">
                        {enabledSlides.map((slide, index) => (
                            <button key={slide.id || index} type="button" onClick={() => setActiveIndex(index)} className={`h-1.5 rounded-full transition-all ${index === activeIndex ? 'w-8 bg-[#e5c98f]' : 'w-1.5 bg-white/45 hover:bg-white'}`} aria-label={`Pokaż slajd ${index + 1}`} />
                        ))}
                    </div>
                )}
            </div>
        </header>
    );
}

function ChaptersView({ items, isSessionMode, heroImage, heroTitle, heroSlides, supplementalContent }: Omit<PortfolioIndexViewsProps, 'layout'>) {
    return (
        <main className="min-h-screen bg-[#f3efe8] text-[#28221c]">
            <PortfolioIntro heroImage={heroImage || items[0]?.coverImage} heroTitle={heroTitle} heroSlides={heroSlides} />
            <section id="wybrane-historie" className="px-4 py-20 sm:px-7 md:py-28 lg:px-10">
                <div className="mx-auto max-w-[1500px]">
                    <div className="mb-12 grid gap-7 border-b border-[#cfc2b1] pb-10 lg:grid-cols-[1fr_.75fr] lg:items-end">
                        <div>
                            <p className="mb-4 text-[10px] font-bold uppercase tracking-[.32em] text-[#94733d]">Wybrane rozdziały</p>
                            <h2 className="font-display text-5xl font-normal leading-[.9] tracking-[-.04em] md:text-7xl">Każde spotkanie ma<br /><em className="font-light text-[#8a7459]">własny rytm.</em></h2>
                        </div>
                        <p className="max-w-xl text-sm leading-7 text-[#686057] md:text-base">Nie pokazuję przypadkowego zbioru zdjęć. Każdy rozdział prowadzi do pełnych sesji, ludzi i miejsc, które zbudowały konkretną historię.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-12 md:gap-5">
                        {items.map((item, index) => {
                            const meta = presentation(item);
                            const sizeClass = index % 5 === 0
                                ? 'md:col-span-5 md:min-h-[650px]'
                                : index % 5 === 1
                                    ? 'md:col-span-7 md:min-h-[650px]'
                                    : index % 5 === 2
                                        ? 'md:col-span-12 md:min-h-[500px]'
                                        : 'md:col-span-6 md:min-h-[560px]';
                            return (
                                <Link key={`${item.id || item.slug}-${index}`} href={itemHref(item, Boolean(isSessionMode))} className={`group relative min-h-[470px] overflow-hidden bg-[#29251f] text-white ${sizeClass}`}>
                                    <PortfolioImage item={item} priority={index < 2} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/5" />
                                    <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9 lg:p-11">
                                        <div className="mb-4 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[.25em] text-[#ead5ab]"><span>{String(index + 1).padStart(2, '0')}</span><span className="h-px w-9 bg-[#ead5ab]/60" /><span>{meta.label}</span></div>
                                        <h2 className="font-display text-4xl font-normal leading-none sm:text-5xl lg:text-6xl">{meta.title}</h2>
                                        <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                                            <p className="max-w-xl text-sm leading-6 text-white/68">{meta.description}</p>
                                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[.16em] text-[#ead5ab]">Zobacz historię <ArrowRight className="ml-2 inline" size={15} /></span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
            {supplementalContent}
            <PortfolioClosing />
        </main>
    );
}

function CinematicContactView({ items, isSessionMode, heroImage, heroTitle, heroSlides, supplementalContent }: Omit<PortfolioIndexViewsProps, 'layout'>) {
    return (
        <main className="min-h-screen bg-[#11100e] text-white">
            <PortfolioIntro heroImage={heroImage || items[0]?.coverImage} heroTitle={heroTitle || 'Nie pozujemy. Opowiadamy.'} heroSlides={heroSlides} />
            <section id="wybrane-historie" className="px-3 py-16 sm:px-5 md:py-24 lg:px-7">
                <div className="mx-auto max-w-[1700px]">
                    <div className="mb-10 flex flex-col justify-between gap-6 border-y border-white/15 py-7 md:flex-row md:items-end">
                        <div><p className="mb-3 text-[10px] font-bold uppercase tracking-[.32em] text-[#d8b878]">Stykówka autora</p><h2 className="font-display text-5xl font-normal leading-none md:text-7xl">Kadry, które zostały</h2></div>
                        <p className="max-w-xl text-sm leading-7 text-white/55">Przejdź od szerokiego kadru do pełnej historii. Kategorie i sesje korzystają z tych samych zdjęć, które wybierasz w panelu Portfolio.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                        {items.map((item, index) => {
                            const meta = presentation(item);
                            const span = index % 6 === 0 || index % 6 === 4 ? 'lg:col-span-8' : 'lg:col-span-4';
                            const height = index % 3 === 0 ? 'min-h-[520px]' : 'min-h-[390px]';
                            return (
                                <Link key={`${item.id || item.slug}-${index}`} href={itemHref(item, Boolean(isSessionMode))} className={`group relative overflow-hidden bg-[#29251f] ${span} ${height}`}>
                                    <PortfolioImage item={item} priority={index < 2} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-black/15" />
                                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] backdrop-blur-md"><Images size={13} /> {item.imageCount || 0} zdjęć</div>
                                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                                        <p className="mb-3 text-[9px] font-bold uppercase tracking-[.26em] text-[#dfbf7c]">{String(index + 1).padStart(2, '0')} · {meta.label}</p>
                                        <div className="flex items-end justify-between gap-5">
                                            <div><h2 className="font-display text-4xl font-normal leading-none sm:text-5xl">{meta.title}</h2><p className="mt-3 max-w-xl text-xs leading-6 text-white/62 sm:text-sm">{meta.description}</p></div>
                                            <ArrowRight className="mb-1 shrink-0 text-[#dfbf7c] transition group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>
            {supplementalContent}
            <PortfolioClosing dark />
        </main>
    );
}

function PortfolioClosing({ dark = false }: { dark?: boolean }) {
    return (
        <section className={`border-t px-6 py-24 text-center md:py-32 ${dark ? 'border-white/10 bg-[#171512]' : 'border-[#d8cdbd] bg-[#ebe4da]'}`}>
            <p className="mb-5 text-[10px] font-bold uppercase tracking-[.32em] text-[#a27c3c]">Twoja historia może być następna</p>
            <h2 className={`mx-auto max-w-4xl font-display text-5xl font-normal leading-[.92] tracking-[-.04em] md:text-7xl ${dark ? 'text-[#fffaf1]' : 'text-[#28221c]'}`}>Stwórzmy razem coś, do czego będziecie wracać.</h2>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/rezerwacja" className={`inline-flex min-h-12 items-center justify-center rounded-full px-7 text-xs font-bold uppercase tracking-[.14em] transition ${dark ? 'bg-[#d5b26c] text-[#171512] hover:bg-white' : 'bg-[#28221c] text-white hover:bg-[#4a4036]'}`}>Sprawdź pakiety i terminy</Link>
                <Link href="/kontakt" className={`inline-flex min-h-12 items-center justify-center rounded-full border px-7 text-xs font-bold uppercase tracking-[.14em] transition ${dark ? 'border-white/25 text-white hover:border-[#d5b26c] hover:text-[#d5b26c]' : 'border-[#80715f] text-[#28221c] hover:border-[#28221c]'}`}>Porozmawiajmy</Link>
            </div>
        </section>
    );
}

export default function PortfolioIndexViews(props: PortfolioIndexViewsProps) {
    return props.layout === 'cinematic_contact'
        ? <CinematicContactView {...props} />
        : <ChaptersView {...props} />;
}
