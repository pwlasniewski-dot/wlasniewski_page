'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
    id: string | number;
    image: string;
    image_mobile?: string;
    image_desktop?: string;
    title: string;
    subtitle: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    enabled?: boolean;
    order?: number;
    textAnimation?: 'fade' | 'slide-up' | 'slide-down' | 'scale' | 'bounce' | 'zoom-in';
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

export default function HeroSlider({ slides = [] }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [autoplay, setAutoplay] = useState(true);

    // Filter enabled slides
    const enabledSlides = slides.filter(s => s.enabled !== false).sort((a, b) => (a.order || 0) - (b.order || 0));

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
        }, 6000);
        return () => clearInterval(timer);
    }, [autoplay, enabledSlides.length, mounted]);

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
    const slideImage = isMobile && slide.image_mobile ? slide.image_mobile : slide.image_desktop || slide.image;
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

    return (
        <div className="relative w-full bg-black overflow-hidden" style={{ aspectRatio: isMobile ? '9/16' : '16/9', minHeight: isMobile ? '100vh' : '100vh' }}>
            {/* Background Images */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`bg-${currentSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0"
                >
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                            backgroundImage: `url(${slideImage})`,
                            backgroundPosition: isMobile ? 'center' : 'center 30%'
                        }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60 z-10" />

            {/* Content */}
            <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`content-${currentSlide}`}
                        initial={variant.initial}
                        animate={variant.animate}
                        exit={variant.exit}
                        transition={variant.transition}
                        className="space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl"
                    >
                        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold text-white tracking-tighter drop-shadow-2xl leading-tight">
                            {slide.title}
                        </h1>
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-200 drop-shadow-lg">
                            {slide.subtitle}
                        </p>
                        {slide.description && (
                            <p className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-xl mx-auto drop-shadow-md">
                                {slide.description}
                            </p>
                        )}
                        {slide.buttonText && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <Link
                                    href={slide.buttonLink || '/portfolio'}
                                    className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
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
                            className={`rounded-full transition-all ${
                                index === currentSlide ? 'bg-gold-500' : 'bg-white/40 hover:bg-white/60'
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
