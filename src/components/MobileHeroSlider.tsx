'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { HeroSlide } from './HeroSlider';

const desktopPlaceholder = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

interface MobileHeroSliderProps {
    slides: HeroSlide[];
    activeIndex: number;
    onSelect: (index: number) => void;
    isMobile: boolean;
    reducedMotion: boolean;
    reserveHeaderSpace: boolean;
}

/** Native scrolling keeps a horizontal photo gesture independent of page scrolling. */
export default function MobileHeroSlider({
    slides,
    activeIndex,
    onSelect,
    isMobile,
    reducedMotion,
    reserveHeaderSpace,
}: MobileHeroSliderProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const indexRef = useRef(activeIndex);
    const onSelectRef = useRef(onSelect);
    const frameRef = useRef<number | null>(null);
    const [comparisonPosition, setComparisonPosition] = useState(50);
    indexRef.current = activeIndex;
    onSelectRef.current = onSelect;

    // A CMS logo can change the header height. Reserve its actual space without
    // following the sticky header's smaller scrolled state and moving the page.
    useEffect(() => {
        if (!isMobile || !reserveHeaderSpace) return;
        const header = document.querySelector('body header');
        if (!header) return;
        const update = () => {
            if (window.scrollY > 20) return;
            rootRef.current?.style.setProperty('--hero-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(header);
        return () => observer.disconnect();
    }, [isMobile, reserveHeaderSpace]);

    // Synchronise only on a resize/breakpoint change. Scrolling to the active
    // index during a touch gesture would fight Safari's native momentum.
    useEffect(() => {
        const track = trackRef.current;
        if (!isMobile || !track) return;
        let previousWidth = 0;
        const update = () => {
            if (!track.clientWidth || track.clientWidth === previousWidth) return;
            previousWidth = track.clientWidth;
            track.scrollLeft = indexRef.current * track.clientWidth;
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(track);
        return () => observer.disconnect();
    }, [isMobile, slides.length]);

    useEffect(() => {
        setComparisonPosition(50);
    }, [activeIndex]);

    useEffect(() => () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    }, []);

    const selectFromScroll = () => {
        if (frameRef.current !== null) return;
        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            const track = trackRef.current;
            if (!track?.clientWidth) return;
            const index = Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / track.clientWidth)));
            if (index !== indexRef.current) onSelectRef.current(index);
        });
    };

    const moveTo = (index: number) => {
        const track = trackRef.current;
        if (!track) return;
        track.scrollTo({ left: index * track.clientWidth, behavior: reducedMotion ? 'instant' : 'smooth' });
    };

    const slide = slides[activeIndex];
    const buttonText = slide.buttonText || slide.button_text;
    const buttonLink = slide.buttonLink || slide.button_link || '/portfolio';
    const hasComparison = Boolean(slide.is_before_after && slide.before_image);

    return (
        <div ref={rootRef} className="bg-[#151310] text-[#fffdf8] md:hidden" data-mobile-hero>
            {reserveHeaderSpace && <div aria-hidden="true" className="h-[var(--hero-header-height,112px)]" />}
            <div
                ref={trackRef}
                className="flex h-[44svh] min-h-[230px] max-h-[430px] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                role="region"
                aria-roledescription="karuzela"
                aria-label="Zdjęcia ofert fotograficznych"
                tabIndex={slides.length > 1 ? 0 : undefined}
                onScroll={selectFromScroll}
                onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                        event.preventDefault();
                        moveTo((activeIndex + (event.key === 'ArrowRight' ? 1 : -1) + slides.length) % slides.length);
                    }
                }}
            >
                {slides.map((item, index) => {
                    const mainImage = typeof item.image === 'string' ? item.image : item.image?.file_path;
                    const image = item.image_mobile || item.image_desktop || mainImage;
                    const beforeImage = typeof item.before_image === 'string' ? item.before_image : item.before_image?.file_path;
                    return (
                        <div
                            key={item.id}
                            className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden"
                            role="group"
                            aria-roledescription="slajd"
                            aria-label={`${index + 1} z ${slides.length}`}
                        >
                            <picture>
                                <source media="(min-width: 768px)" srcSet={desktopPlaceholder} />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={image}
                                    alt=""
                                    {...({ fetchpriority: index === 0 ? 'high' : 'auto' } as React.ImgHTMLAttributes<HTMLImageElement>)}
                                    loading={index === 0 ? 'eager' : 'lazy'}
                                    decoding="async"
                                    draggable={false}
                                    className="h-full w-full select-none object-cover object-center"
                                />
                            </picture>
                            {item.is_before_after && beforeImage && (
                                <>
                                    <picture>
                                        <source media="(min-width: 768px)" srcSet={desktopPlaceholder} />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={beforeImage}
                                            alt=""
                                            loading={index === 0 ? 'eager' : 'lazy'}
                                            draggable={false}
                                            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center"
                                            style={{ clipPath: `inset(0 ${100 - (index === activeIndex ? comparisonPosition : 50)}% 0 0)` }}
                                        />
                                    </picture>
                                    <div
                                        className="pointer-events-none absolute inset-y-0 w-px bg-white/90"
                                        style={{ left: `${index === activeIndex ? comparisonPosition : 50}%` }}
                                    />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="px-5 pb-9 pt-5 sm:px-8">
                {slides.length > 1 && (
                    <div className="mb-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => moveTo((activeIndex + 1) % slides.length)}
                            className="-my-2 inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 text-xs tabular-nums tracking-[.12em] text-[#e6d4b0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ead5ab]"
                            aria-label={`Następny slajd. Slajd ${activeIndex + 1} z ${slides.length}`}
                        >
                            <span>{String(activeIndex + 1).padStart(2, '0')}</span>
                            <span className="text-white/35">/ {String(slides.length).padStart(2, '0')}</span>
                        </button>
                    </div>
                )}

                {hasComparison && (
                    <label className="mb-5 block text-xs text-white/75">
                        <span className="sr-only">Porównanie zdjęć przed i po</span>
                        <span aria-hidden="true" className="flex justify-between"><span>Przed</span><span>Po</span></span>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={comparisonPosition}
                            onChange={(event) => setComparisonPosition(Number(event.target.value))}
                            className="h-11 w-full touch-pan-y accent-[#ead5ab]"
                            aria-valuetext={`${comparisonPosition}% zdjęcia przed`}
                        />
                    </label>
                )}

                <div aria-live="polite" aria-atomic="true" className="mx-auto max-w-xl">
                    <h2
                        className="font-display !text-[clamp(1.85rem,7.8vw,2.4rem)] font-normal !leading-[1.1] tracking-[-.025em] [overflow-wrap:anywhere] [&_*]:![font-size:inherit] [&_*]:![line-height:inherit]"
                        dangerouslySetInnerHTML={{ __html: slide.title || '' }}
                    />
                    {slide.subtitle && <p className="mt-4 text-sm leading-6 text-white/85" dangerouslySetInnerHTML={{ __html: slide.subtitle }} />}
                    {slide.description && <p className="mt-3 text-sm leading-6 text-white/65" dangerouslySetInnerHTML={{ __html: slide.description }} />}
                    {buttonText && (
                        <Link
                            href={buttonLink}
                            className={`mt-6 inline-flex min-h-12 max-w-full items-center justify-center rounded-full px-6 py-3 text-center text-xs font-bold uppercase leading-5 tracking-[.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ead5ab] ${slide.buttonStyle === 'white'
                                ? 'border border-white/70 bg-white/5 text-white'
                                : slide.buttonStyle === 'transparent'
                                    ? 'border border-white/25 bg-transparent text-white'
                                    : 'border border-[#ead5ab] bg-[#ead5ab] text-[#211c16]'}`}
                        >
                            {buttonText}
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
