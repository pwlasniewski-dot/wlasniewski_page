'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MoveHorizontal } from 'lucide-react';

interface ThermalHeroSlide {
    id: string;
    category?: string;
    title?: string;
    subtitle?: string;
    description?: string;
    visualMedia: string;
    thermalMedia: string;
    mediaType?: 'image' | 'video';
    labelLeft?: string;
    labelRight?: string;
    buttonText?: string;
    buttonLink?: string;
    objectPosition?: string;
    objectPositionMobile?: string;
    alignmentStatus?: 'registered' | 'side_by_side_only' | 'pending';
}

export default function ThermalHeroSlider({ slides = [] }: { slides: ThermalHeroSlide[]; interval?: number }) {
    const [index, setIndex] = useState(0);
    const [position, setPosition] = useState(50);
    if (!slides.length) return null;

    const slide = slides[index];
    const next = () => { setIndex(value => (value + 1) % slides.length); setPosition(50); };
    const previous = () => { setIndex(value => (value - 1 + slides.length) % slides.length); setPosition(50); };
    const overlayAllowed = slide.alignmentStatus === 'registered' && slide.mediaType !== 'video';
    const objectPosition = slide.objectPosition || 'center center';
    const mediaStyle = {
        '--thermal-position': objectPosition,
        '--thermal-position-mobile': slide.objectPositionMobile || objectPosition,
    } as CSSProperties;
    const mediaClassName = 'thermal-comparison-media aspect-video h-full w-full object-cover';
    const media = (src: string, alt: string) => slide.mediaType === 'video'
        ? <video className={mediaClassName} style={mediaStyle} controls muted playsInline preload="metadata" aria-label={alt}><source src={src} /></video>
        : <img src={src} alt={alt} className={mediaClassName} style={mediaStyle} />;

    return (
        <section className="bg-[#07100f] px-4 py-16 md:px-6" aria-labelledby={slide.title ? `thermal-title-${slide.id}` : undefined} aria-label={slide.title ? undefined : 'Porównanie obrazu rzeczywistego i termicznego'}>
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 max-w-3xl">
                    {slide.category && <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">{slide.category}</p>}
                    {slide.title && <h2 id={`thermal-title-${slide.id}`} className="text-3xl font-bold text-white md:text-5xl" dangerouslySetInnerHTML={{ __html: slide.title }} />}
                    {slide.subtitle && <p className="mt-4 text-lg leading-relaxed text-zinc-400">{slide.subtitle}</p>}
                </div>

                {overlayAllowed ? (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10 bg-black md:aspect-video">
                        <img src={slide.thermalMedia} alt={slide.labelRight || 'Obraz termiczny badanego obszaru'} className="thermal-comparison-media absolute inset-0 h-full w-full object-cover" style={mediaStyle} />
                        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
                            <img src={slide.visualMedia} alt={slide.labelLeft || 'Obraz rzeczywisty badanego obszaru'} className="thermal-comparison-media absolute inset-0 h-full w-full object-cover" style={mediaStyle} />
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,.8)]" style={{ left: `${position}%` }}>
                            <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/70 text-white"><MoveHorizontal size={22} /></span>
                        </div>
                        <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-2 text-xs font-bold text-white">{slide.labelLeft || 'Obraz rzeczywisty'}</span>
                        <span className="absolute right-4 top-4 rounded-full bg-black/70 px-3 py-2 text-xs font-bold text-white">{slide.labelRight || 'Termowizja'}</span>
                        <label className="absolute inset-x-4 bottom-4 z-20 rounded-xl bg-black/75 px-4 py-3 text-xs text-white backdrop-blur-sm">
                            <span className="sr-only">Położenie podziału obrazu rzeczywistego i termicznego</span>
                            <input type="range" min="0" max="100" value={position} onChange={event => setPosition(Number(event.target.value))} className="h-11 w-full cursor-ew-resize accent-emerald-300" aria-label="Porównaj obraz rzeczywisty z termowizją" aria-valuetext={`${position}% obrazu rzeczywistego`} />
                        </label>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black">{media(slide.visualMedia, slide.labelLeft || 'Obraz rzeczywisty badanego obszaru')}<figcaption className="p-3 text-sm text-zinc-300">{slide.labelLeft || 'Obraz rzeczywisty'}</figcaption></figure>
                        <figure className="overflow-hidden rounded-2xl border border-white/10 bg-black">{media(slide.thermalMedia, slide.labelRight || 'Obraz termiczny badanego obszaru')}<figcaption className="p-3 text-sm text-zinc-300">{slide.labelRight || 'Termowizja'}</figcaption></figure>
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="max-w-3xl text-sm leading-relaxed text-zinc-400" dangerouslySetInnerHTML={{ __html: slide.description || 'Porównanie ma charakter dokumentacyjny. Interpretacja zależy od warunków rejestracji i właściwości badanego obiektu.' }} />
                    <div className="flex shrink-0 items-center gap-3">
                        {slide.buttonText && <Link href={slide.buttonLink || '#wycena'} className="rounded-full bg-emerald-300 px-5 py-3 text-sm font-bold text-[#07100f]">{slide.buttonText}</Link>}
                        {slides.length > 1 && <><button type="button" onClick={previous} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white hover:bg-white/10" aria-label="Poprzednie porównanie"><ChevronLeft /></button><span className="text-xs text-zinc-500" aria-live="polite">{index + 1}/{slides.length}</span><button type="button" onClick={next} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 text-white hover:bg-white/10" aria-label="Następne porównanie"><ChevronRight /></button></>}
                    </div>
                </div>
            </div>
        </section>
    );
}
