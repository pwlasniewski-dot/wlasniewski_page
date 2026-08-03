'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import BeforeAfterSlide from './BeforeAfterSlide';

interface HeroSlide {
    id: string | number;
    title: string;
    subtitle: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    button_text?: string;
    button_link?: string;
    buttonStyle?: 'gold' | 'white' | 'transparent';
    enabled?: boolean;
    order?: number;
    textAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'bounce' | 'zoom-in';
    shader?: 'subtle' | 'cinematic' | 'deep';
    is_before_after?: boolean;
    before_image?: string | { file_path: string };
    image_mobile?: string;
    image_desktop?: string;
    // Helper for API response structure where image is object
    image: string | { file_path: string };
}

interface HeroSliderProps {
    slides?: HeroSlide[];
    documentTitle?: string;
}

// Text animation variants
const animationVariants = {
    fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.8 }
    },
    'slide-up': {
        initial: { opacity: 0, y: 60 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -60 },
        transition: { duration: 0.8 }
    },
    'slide-down': {
        initial: { opacity: 0, y: -60 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 60 },
        transition: { duration: 0.8 }
    },
    scale: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
        transition: { duration: 0.8 }
    },
    bounce: {
        initial: { opacity: 0, y: 40 },
        animate: { opacity: 1, y: [40, -10, 0] },
        exit: { opacity: 0, y: -40 },
        transition: { duration: 0.9 }
    },
    'zoom-in': {
        initial: { opacity: 0, scale: 0.5 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.5 },
        transition: { duration: 0.9 }
    }
};

export default function HeroSlider({ slides = [], interval = 6000, documentTitle = 'Fotograf Toruń — zdjęcia, do których chce się wracać' }: HeroSliderProps & { interval?: number }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [autoplay, setAutoplay] = useState(true);
    const [isMobile, setIsMobile] = useState(true);
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        const query = window.matchMedia('(max-width: 767px)');
        const update = () => setIsMobile(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    // Filter enabled slides
    const enabledSlides = slides.filter(s => s.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Autoplay
    useEffect(() => {
        if (!autoplay || enabledSlides.length <= 1 || prefersReducedMotion) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % enabledSlides.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoplay, enabledSlides.length, interval, prefersReducedMotion]);

    if (!enabledSlides || enabledSlides.length === 0) {
        return (
            <section className="home-hero relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#151310]" aria-label="Fotografia rodzinna i ślubna">
                <h1 className="sr-only">{documentTitle}</h1>
                <Image
                    src="/assets/slider/fotografia-rodzinna-grudziadz-01.webp"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover object-center md:object-[center_30%]"
                />
                <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(12,10,8,.72)_0%,rgba(12,10,8,.38)_42%,rgba(12,10,8,.08)_70%,rgba(12,10,8,.18)_100%)] max-md:bg-[linear-gradient(180deg,rgba(12,10,8,.12)_10%,rgba(12,10,8,.28)_48%,rgba(12,10,8,.9)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 z-10 h-[60%] bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/55 to-transparent" />
                <div className="relative z-20 mx-auto flex h-full w-full max-w-[1480px] items-end px-6 pb-24 sm:px-10 sm:pb-28 lg:px-16 lg:pb-24 xl:px-24">
                  <div className="max-w-[760px] text-left max-md:text-center">
                    <div className="mb-5 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[.32em] text-[#e6d4b0] max-md:justify-center sm:text-xs"><span className="h-px w-10 bg-[#d7b978]"/>Przemysław Właśniewski · fotografia</div>
                    <h2 className="font-display text-[clamp(2.8rem,6.2vw,6.7rem)] font-normal leading-[.86] tracking-[-.045em] text-[#fffdf8] drop-shadow-2xl">
                        Fotograf Toruń — zdjęcia, do których chce się wracać
                    </h2>
                    <p className="mt-6 max-w-2xl text-sm font-medium leading-7 text-white/85 drop-shadow-lg max-md:mx-auto sm:text-base md:text-lg">
                        Sesje rodzinne, śluby i uroczystości. Sprawdź pakiety oraz wolne terminy.
                    </p>
                    <Link
                        href="/rezerwacja?source=hero-fallback&amp;service=Sesja"
                        className="mt-8 inline-flex min-h-12 items-center rounded-full border border-[#ead5ab] bg-[#ead5ab] px-7 py-3 text-xs font-bold uppercase tracking-[.16em] text-[#211c16] shadow-xl transition-all hover:border-white hover:bg-white sm:px-8"
                    >
                        Zobacz pakiety i terminy
                    </Link>
                  </div>
                </div>
                <div className="absolute bottom-7 right-7 z-30 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[.28em] text-white/65 lg:flex">przewiń <ArrowDown size={15} strokeWidth={1.4}/></div>
            </section>
        );
    }

    const slide = enabledSlides[currentSlide];
    const mainImage = typeof slide.image === 'string' ? slide.image : slide.image?.file_path;
    const desktopImage = slide.image_desktop || mainImage;
    const mobileImage = slide.image_mobile || desktopImage;
    const textAnim = (slide.textAnimation || 'slide-up') as keyof typeof animationVariants;
    const variant = animationVariants[textAnim] || animationVariants['slide-up'];
    const shaderPresets = {
        subtle: {
            veil: 'bg-black/5',
            gradient: 'from-black/60 via-black/20 to-transparent'
        },
        cinematic: {
            veil: 'bg-black/10',
            gradient: 'from-black/80 via-black/35 to-transparent'
        },
        deep: {
            veil: 'bg-black/35',
            gradient: 'from-black via-black/75 to-transparent'
        }
    } as const;
    const shaderClasses = shaderPresets[slide.shader as keyof typeof shaderPresets] ?? shaderPresets.cinematic;

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % enabledSlides.length);
        setAutoplay(false);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + enabledSlides.length) % enabledSlides.length);
        setAutoplay(false);
    };

    const currentSlideData = enabledSlides[currentSlide];

    if (currentSlideData?.is_before_after && currentSlideData.image && currentSlideData.before_image) {
        return (
            <div className="relative h-[100svh] min-h-[600px] w-full bg-black">
                <h1 className="sr-only">{documentTitle}</h1>
                <BeforeAfterSlide
                    beforeImage={typeof currentSlideData.before_image === 'string' ? currentSlideData.before_image : currentSlideData.before_image.file_path}
                    afterImage={typeof currentSlideData.image === 'string' ? currentSlideData.image : currentSlideData.image.file_path}
                    title={currentSlideData.title}
                    subtitle={currentSlideData.subtitle}
                    buttonText={currentSlideData.button_text}
                    buttonLink={currentSlideData.button_link}
                    isActive={true}
                    onPrev={enabledSlides.length > 1 ? prevSlide : undefined}
                    onNext={enabledSlides.length > 1 ? nextSlide : undefined}
                />

                {/* Keep Dots Navigation for consistency if multiple slides */}
                {enabledSlides.length > 1 && (
                    <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-40">
                        {enabledSlides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setCurrentSlide(index);
                                    setAutoplay(false);
                                }}
                                className={`rounded-full transition-all ${index === currentSlide ? 'bg-gold-500 w-8' : 'bg-white/40 hover:bg-white/60 w-2.5'
                                    } h-2.5`}
                                aria-label={`Przejdź do slajdu ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <section className="home-hero relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-[#151310]" aria-label="Najważniejsze oferty fotograficzne">
            <h1 className="sr-only">{documentTitle}</h1>
            {/* Background Images */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={`bg-${currentSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full overflow-hidden"
                >
                    <motion.div
                        className="w-full h-full"
                        initial={{ scale: 1 }}
                        animate={{ scale: prefersReducedMotion || isMobile ? 1 : 1.02 }}
                        transition={{
                            duration: prefersReducedMotion || isMobile ? 0 : 15,
                            ease: "linear",
                            repeat: 0
                        }}
                    >
                        <picture className="block h-full w-full">
                            {mobileImage && <source media="(max-width: 767px)" srcSet={mobileImage} />}
                            {/* The browser chooses one responsive source; the first visible image is requested with high priority for LCP. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={desktopImage || mobileImage}
                                alt=""
                                aria-hidden="true"
                                {...({ fetchpriority: currentSlide === 0 ? 'high' : 'auto' } as React.ImgHTMLAttributes<HTMLImageElement>)}
                                loading={currentSlide === 0 ? 'eager' : 'lazy'}
                                className="h-full w-full object-cover object-center md:object-[center_30%]"
                            />
                        </picture>
                    </motion.div>
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlays */}
            <div className={`absolute inset-0 z-10 ${shaderClasses.veil}`} />
            <div className="absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(12,10,8,.72)_0%,rgba(12,10,8,.42)_35%,rgba(12,10,8,.08)_68%,rgba(12,10,8,.18)_100%)] max-md:bg-[linear-gradient(180deg,rgba(12,10,8,.12)_10%,rgba(12,10,8,.28)_48%,rgba(12,10,8,.9)_100%)]" />
            <div className={`absolute bottom-0 left-0 z-10 h-[58%] w-full bg-gradient-to-t ${shaderClasses.gradient}`} />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black/55 to-transparent" />

            {/* Content */}
            <div className="relative z-20 mx-auto flex h-full w-full max-w-[1480px] items-end px-6 pb-24 sm:px-10 sm:pb-28 lg:px-16 lg:pb-24 xl:px-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`content-${currentSlide}`}
                        initial={variant.initial}
                        animate={variant.animate}
                        exit={variant.exit}
                        transition={variant.transition}
                        className="max-w-[760px] text-left max-md:text-center"
                    >
                        <div className="mb-5 flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[.32em] text-[#e6d4b0] max-md:justify-center sm:text-xs">
                            <span className="h-px w-10 bg-[#d7b978]" />
                            Przemysław Właśniewski · fotografia
                        </div>
                        <h2
                            className="font-display text-[clamp(2.8rem,6.2vw,6.7rem)] font-normal leading-[.86] tracking-[-.045em] text-[#fffdf8] drop-shadow-2xl"
                            dangerouslySetInnerHTML={{ __html: slide.title || '' }}
                        />
                        <p
                            className="mt-6 max-w-2xl text-sm font-medium leading-7 text-white/85 drop-shadow-lg max-md:mx-auto sm:text-base md:text-lg"
                            dangerouslySetInnerHTML={{ __html: slide.subtitle || '' }}
                        />
                        {slide.description && (
                            <p
                                className="mt-3 max-w-xl text-xs leading-6 text-white/65 drop-shadow-md max-md:mx-auto sm:text-sm"
                                dangerouslySetInnerHTML={{ __html: slide.description }}
                            />
                        )}
                        {slide.buttonText && (
                            <motion.div className="mt-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link
                                    href={slide.buttonLink || '/portfolio'}
                                    className={`inline-flex min-h-12 items-center rounded-full px-7 py-3 text-xs font-bold uppercase tracking-[.16em] transition-all duration-300 shadow-xl sm:px-8 ${(slide.buttonStyle === 'white')
                                        ? 'border border-white/70 bg-white/5 text-white backdrop-blur-md hover:bg-white/15'
                                        : (slide.buttonStyle === 'transparent')
                                            ? 'border border-white/25 bg-transparent text-white hover:border-white/60 hover:bg-white/10'
                                            : 'border border-[#ead5ab] bg-[#ead5ab] text-[#211c16] hover:border-white hover:bg-white'
                                        }`}
                                >
                                    {slide.buttonText}
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="absolute bottom-7 right-7 z-30 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[.28em] text-white/65 lg:flex">
                przewiń <ArrowDown size={15} strokeWidth={1.4} />
            </div>

            {/* Navigation Arrows */}
            {enabledSlides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        onMouseEnter={() => setAutoplay(false)}
                        className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white/80 backdrop-blur-md transition-all hover:border-white/50 hover:bg-black/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ead5ab] sm:left-6"
                        aria-label="Poprzedni slajd"
                    >
                        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                    <button
                        onClick={nextSlide}
                        onMouseEnter={() => setAutoplay(false)}
                        className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/15 text-white/80 backdrop-blur-md transition-all hover:border-white/50 hover:bg-black/35 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ead5ab] sm:right-6"
                        aria-label="Następny slajd"
                    >
                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                </>
            )}

            {/* Dots Navigation */}
            {enabledSlides.length > 1 && (
                <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 gap-2 md:left-auto md:right-16 md:translate-x-0">
                    {enabledSlides.map((_, index) => (
                        <motion.button
                            key={index}
                            onClick={() => {
                                setCurrentSlide(index);
                                setAutoplay(false);
                            }}
                            className={`rounded-full transition-all ${index === currentSlide ? 'bg-[#ead5ab]' : 'bg-white/35 hover:bg-white/60'
                                }`}
                            animate={{
                                width: index === currentSlide ? 32 : 10,
                                height: 10
                            }}
                            aria-label={`Przejdź do slajdu ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
