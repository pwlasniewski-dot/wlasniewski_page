'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    is_before_after?: boolean;
    before_image?: string | { file_path: string };
    image_mobile?: string;
    image_desktop?: string;
    // Helper for API response structure where image is object
    image: string | { file_path: string };
}

interface HeroSliderProps {
    slides?: HeroSlide[];
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

export default function HeroSlider({ slides = [], interval = 6000 }: HeroSliderProps & { interval?: number }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [autoplay, setAutoplay] = useState(true);

    // Filter enabled slides
    const enabledSlides = slides.filter(s => s.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

    useEffect(() => {
        if (mounted) console.log('[HeroSlider] Slides:', slides.length, 'Enabled:', enabledSlides.length);
    }, [mounted, slides.length, enabledSlides.length]);

    // Detect mobile
    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Autoplay
    useEffect(() => {
        if (!autoplay || enabledSlides.length <= 1 || !mounted) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % enabledSlides.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoplay, enabledSlides.length, mounted, interval]);

    if (!mounted) return <div className="h-screen w-full bg-black" />;

    if (!enabledSlides || enabledSlides.length === 0) {
        return (
            <div className="relative h-screen w-full flex items-center justify-center bg-black overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 z-10" />
                <div className="relative z-20 text-center px-4 space-y-4">
                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight drop-shadow-2xl">
                        Wspomnienia<br />zapisane światłem
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-2xl mx-auto">
                        Fotografia ślubna i rodzinna pełna naturalnych emocji.
                    </p>
                    <Link
                        href="/portfolio"
                        className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-gold-500 text-black font-semibold rounded hover:bg-gold-400 transition-colors shadow-lg"
                    >
                        Zobacz Portfolio
                    </Link>
                </div>
            </div>
        );
    }

    const slide = enabledSlides[currentSlide];
    const mainImage = typeof slide.image === 'string' ? slide.image : slide.image?.file_path;
    const slideImage = isMobile && slide.image_mobile ? slide.image_mobile : slide.image_desktop || mainImage;
    const textAnim = (slide.textAnimation || 'slide-up') as keyof typeof animationVariants;
    const variant = animationVariants[textAnim] || animationVariants['slide-up'];

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
            <div className="relative w-full h-[100vh] bg-black">
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
        <div className="relative w-full bg-black overflow-hidden" style={{ height: '90vh', minHeight: '600px' }}>
            {/* Background Images */}
            <AnimatePresence>
                <motion.div
                    key={`bg-${currentSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full overflow-hidden"
                >
                    <motion.div
                        className="w-full h-full bg-cover bg-no-repeat"
                        initial={{ scale: 1 }}
                        animate={{ scale: 1.02 }}
                        transition={{
                            duration: 15,
                            ease: "linear",
                            repeat: 0
                        }}
                        // [UPDATED: 2026-01-10] POPRAWA KADROWANIA (FRAMING)
                        // center 30% na desktop oraz center center na mobile
                        // lepiej eksponuje postacie, nie ucinając głów.
                        style={{
                            backgroundImage: `url("${slideImage}")`,
                            backgroundPosition: isMobile ? 'center center' : 'center 30%',
                            transformOrigin: isMobile ? 'center center' : 'center 30%'
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-black/20 z-10" />
            {/* Strong bottom fade for seamless transition */}
            <div className="absolute bottom-0 left-0 w-full h-[60vh] bg-gradient-to-t from-black via-black/80 to-transparent z-10" />

            {/* Content */}
            <div className="relative z-20 w-full h-full flex flex-col items-center justify-end pb-24 sm:pb-32 md:pb-40 px-4 sm:px-6 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`content-${currentSlide}`}
                        initial={variant.initial}
                        animate={variant.animate}
                        exit={variant.exit}
                        transition={variant.transition}
                        className="space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl"
                    >
                        <h1
                            className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold text-white tracking-tighter drop-shadow-2xl leading-tight"
                            dangerouslySetInnerHTML={{ __html: slide.title || '' }}
                        />
                        <p
                            className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-200 drop-shadow-lg"
                            dangerouslySetInnerHTML={{ __html: slide.subtitle || '' }}
                        />
                        {slide.description && (
                            <p
                                className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-xl mx-auto drop-shadow-md"
                                dangerouslySetInnerHTML={{ __html: slide.description }}
                            />
                        )}
                        {slide.buttonText && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link
                                    href={slide.buttonLink || '/portfolio'}
                                    className={`inline-block px-6 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 ${(slide.buttonStyle === 'white')
                                        ? 'bg-transparent border-2 border-white text-white hover:bg-white/10'
                                        : (slide.buttonStyle === 'transparent')
                                            ? 'bg-transparent border-2 border-transparent text-white hover:bg-white/10 hover:border-white/20'
                                            : 'bg-gold-500 text-black hover:bg-gold-400'
                                        }`}
                                >
                                    {slide.buttonText}
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {enabledSlides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        onMouseEnter={() => setAutoplay(false)}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-30 backdrop-blur-sm"
                        aria-label="Poprzedni slajd"
                    >
                        <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                    <button
                        onClick={nextSlide}
                        onMouseEnter={() => setAutoplay(false)}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-30 backdrop-blur-sm"
                        aria-label="Następny slajd"
                    >
                        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
                    </button>
                </>
            )}

            {/* Dots Navigation */}
            {enabledSlides.length > 1 && (
                <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
                    {enabledSlides.map((_, index) => (
                        <motion.button
                            key={index}
                            onClick={() => {
                                setCurrentSlide(index);
                                setAutoplay(false);
                            }}
                            className={`rounded-full transition-all ${index === currentSlide ? 'bg-gold-500' : 'bg-white/40 hover:bg-white/60'
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
        </div>
    );
}
