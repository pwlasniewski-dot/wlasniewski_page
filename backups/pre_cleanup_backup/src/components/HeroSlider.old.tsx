'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
    id: string | number;
    title: string;
    subtitle: string;
    buttonText?: string;
    buttonLink?: string;
    image: string; // URL string directly from home_sections
}

interface HeroSliderProps {
    slides?: any[];
}

export default function HeroSlider({ slides = [] }: HeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [filteredSlides, setFilteredSlides] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            const filtered = slides.filter(slide => {
                const mode = slide.display_mode || 'BOTH';
                if (mode === 'BOTH') return true;
                if (mode === 'MOBILE' && isMobile) return true;
                if (mode === 'DESKTOP' && !isMobile) return true;
                return false;
            });
            setFilteredSlides(filtered);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [slides]);

    useEffect(() => {
        if (filteredSlides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [filteredSlides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % filteredSlides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + filteredSlides.length) % filteredSlides.length);

    // Fallback static content if no slides
    if (!mounted) return <div className="h-screen w-full bg-zinc-950" />; // Prevent hydration mismatch

    if (!filteredSlides || filteredSlides.length === 0) {
        return (
            <div className="relative h-screen w-full overflow-hidden bg-zinc-950">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
                    <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-wide">
                        Wspomnienia zapisane światłem
                    </h1>
                    <p className="font-sans text-lg md:text-xl text-zinc-200 mb-8 max-w-2xl">
                        Fotografia ślubna i rodzinna pełna naturalnych emocji.
                    </p>
                    <Link
                        href="/portfolio"
                        className="px-8 py-3 bg-gold-500 text-black font-medium rounded hover:bg-gold-400 transition-colors"
                    >
                        Zobacz Portfolio
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-zinc-950">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0"
                >
                    <picture className="absolute inset-0 w-full h-full">
                        {filteredSlides[currentSlide].mobileImage && (
                            <source
                                media="(max-width: 768px)"
                                srcSet={filteredSlides[currentSlide].mobileImage}
                            />
                        )}
                        <img
                            src={filteredSlides[currentSlide].image?.file_path || filteredSlides[currentSlide].image}
                            alt={filteredSlides[currentSlide].title}
                            className="w-full h-full object-cover object-[center_30%]"
                            fetchPriority="high"
                            loading="eager"
                        />
                    </picture>
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>
            </AnimatePresence>

            <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-wide drop-shadow-lg">
                            {filteredSlides[currentSlide].title}
                        </h1>
                        <p className="font-sans text-lg md:text-xl text-zinc-200 mb-8 max-w-2xl mx-auto drop-shadow-md">
                            {filteredSlides[currentSlide].subtitle}
                        </p>
                        {filteredSlides[currentSlide].buttonText && (
                            <Link
                                href={filteredSlides[currentSlide].buttonLink || '/portfolio'}
                                className="inline-block px-8 py-3 bg-gold-500 text-black font-medium rounded hover:bg-gold-400 transition-colors shadow-lg"
                            >
                                {filteredSlides[currentSlide].buttonText}
                            </Link>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {filteredSlides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors z-20"
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white transition-colors z-20"
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>
                </>
            )}

            {/* Dots */}
            {filteredSlides.length > 1 && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                    {filteredSlides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? 'bg-gold-500 w-8' : 'bg-white/50 hover:bg-white'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
