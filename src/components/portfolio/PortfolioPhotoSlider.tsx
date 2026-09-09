'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PortfolioPhotoSlide {
    id: string | number;
    image: string;
    title: string;
    subtitle?: string;
    href?: string;
}

/** Native scrolling keeps horizontal swipes and vertical page scrolling independent. */
export default function PortfolioPhotoSlider({ slides, title, description }: {
    slides: PortfolioPhotoSlide[];
    title: string;
    description?: string | null;
}) {
    const track = useRef<HTMLDivElement>(null);
    const [index, setIndex] = useState(0);
    const photos = slides.filter(slide => Boolean(slide.image));
    const active = photos[Math.min(index, photos.length - 1)];

    const move = (direction: -1 | 1) => {
        if (!track.current || photos.length < 2) return;
        const next = Math.max(0, Math.min(photos.length - 1, index + direction));
        track.current.scrollTo({
            left: next * track.current.clientWidth,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
    };

    return (
        <section className="bg-black text-white" aria-label={title}>
            {photos.length > 0 && (
                <div
                    ref={track}
                    className="flex h-[55svh] min-h-[240px] max-h-[760px] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:h-[72svh]"
                    aria-label="Zdjęcia sesji"
                    tabIndex={0}
                    onScroll={event => {
                        const element = event.currentTarget;
                        if (element.clientWidth) setIndex(Math.round(element.scrollLeft / element.clientWidth));
                    }}
                    onKeyDown={event => {
                        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                            event.preventDefault();
                            move(event.key === 'ArrowLeft' ? -1 : 1);
                        }
                    }}
                >
                    {photos.map((slide, i) => (
                        <div key={`${slide.id}-${i}`} className="h-full w-full shrink-0 snap-center snap-always">
                            {slide.href ? (
                                <Link href={slide.href} className="block h-full w-full" aria-label={slide.title}>
                                    <img src={slide.image} alt={slide.title} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} className="h-full w-full object-contain" />
                                </Link>
                            ) : (
                                <img src={slide.image} alt={slide.title} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" draggable={false} className="h-full w-full object-contain" />
                            )}
                        </div>
                    ))}
                </div>
            )}
            <div className="mx-auto flex max-w-5xl items-start justify-between gap-5 px-5 pb-3 pt-5 md:px-8 md:py-8">
                <div className="min-w-0">
                    <h1 className="font-display text-[clamp(1.65rem,5vw,2.75rem)] font-normal leading-tight tracking-tight">{title}</h1>
                    {active?.subtitle && <p className="mt-2 text-sm text-zinc-400">{active.subtitle}</p>}
                    {active?.href && (
                        <Link href={active.href} className="mt-3 inline-flex min-h-11 items-center text-sm text-[#ead5ab] underline underline-offset-4">
                            {active.title}
                        </Link>
                    )}
                    {description && <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-zinc-400">{description}</p>}
                </div>
                {photos.length > 1 && (
                    <div className="flex shrink-0 items-center gap-1 pt-1">
                        <button type="button" aria-label="Poprzedni slajd" disabled={index === 0} onClick={() => move(-1)} className="hidden h-11 w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-25 md:flex"><ChevronLeft size={20} /></button>
                        <span className="whitespace-nowrap text-xs tabular-nums tracking-wider text-zinc-500" aria-live="polite" aria-atomic="true">{Math.min(index + 1, photos.length)} / {photos.length}</span>
                        <button type="button" aria-label="Następny slajd" disabled={index >= photos.length - 1} onClick={() => move(1)} className="hidden h-11 w-11 items-center justify-center rounded-full text-white/70 hover:bg-white/10 disabled:opacity-25 md:flex"><ChevronRight size={20} /></button>
                    </div>
                )}
            </div>
        </section>
    );
}
