'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import PuzzleGallery from './VisualEffects/PuzzleGallery';
import CarouselGallery from './VisualEffects/CarouselGallery';
// OrbitingGallery removed - requires different data structure

// Types
export interface CreativeSlide {
    id: string;
    effect: 'none' | 'puzzle' | 'carousel' | 'orbit';
    photos: string[];
    mainPhoto?: string;
    photoShape: 'original' | 'circle' | 'square' | 'rectangle';
    photoSize: number; // 50-150
    blurEdges: boolean;
    backgroundColor: string;
    title: string;
    subtitle: string;
    ctaText?: string;
    ctaLink?: string;
    textPosition: 'left' | 'center' | 'right';
    fontSize: 'small' | 'medium' | 'large';
    fontFamily: 'display' | 'sans' | 'serif';
    portraitMode: 'contain' | 'cover' | 'fit-height';
}

export interface CreativeSliderConfig {
    autoScroll: boolean;
    interval: number;
    height: string;
}

interface CreativeSliderProps {
    slides: CreativeSlide[];
    config: CreativeSliderConfig;
}

// Font size classes
const fontSizeClasses = {
    small: { title: 'text-2xl md:text-4xl', subtitle: 'text-sm md:text-lg' },
    medium: { title: 'text-3xl md:text-5xl', subtitle: 'text-base md:text-xl' },
    large: { title: 'text-4xl md:text-6xl', subtitle: 'text-lg md:text-2xl' }
};

// Font family classes
const fontFamilyClasses = {
    display: 'font-display',
    sans: 'font-sans',
    serif: 'font-serif'
};

// Text position classes
const textPositionClasses = {
    left: 'text-left items-start pl-8 md:pl-16 pr-4',
    center: 'text-center items-center px-4',
    right: 'text-right items-end pr-8 md:pr-16 pl-4'
};

// Shape classes
const getShapeClasses = (shape: string, size: number) => {
    const scale = size / 100;
    const baseSize = 'w-[280px] h-[280px] md:w-[400px] md:h-[400px]';

    switch (shape) {
        case 'circle':
            return `${baseSize} rounded-full`;
        case 'square':
            return `${baseSize} rounded-lg`;
        case 'rectangle':
            return 'w-[320px] h-[240px] md:w-[500px] md:h-[350px] rounded-lg';
        default:
            return 'max-w-full max-h-full rounded-lg';
    }
};

export default function CreativeSlider({ slides, config }: CreativeSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    const { autoScroll, interval, height } = config;

    useEffect(() => {
        if (!autoScroll || isHovered || slides.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, interval * 1000);

        return () => clearInterval(timer);
    }, [autoScroll, interval, isHovered, slides.length]);

    if (!slides || slides.length === 0) return null;
    const currentSlide = slides[currentIndex];

    // Prepare puzzle photos (duplicate if only 1)
    const getPuzzlePhotos = (photos: string[]) => {
        if (photos.length === 0 && currentSlide.mainPhoto) {
            return [currentSlide.mainPhoto, currentSlide.mainPhoto];
        }
        if (photos.length === 1) {
            return [photos[0], photos[0]];
        }
        return photos;
    };

    // Render visual content based on effect
    const renderVisualContent = () => {
        const { effect, photos, mainPhoto, photoShape, photoSize, blurEdges, portraitMode } = currentSlide;

        // Blur edge effect wrapper
        const BlurWrapper = ({ children }: { children: React.ReactNode }) => (
            <div className={`relative ${blurEdges ? 'blur-edges' : ''}`}>
                {children}
                {blurEdges && (
                    <>
                        <div className="absolute inset-0 pointer-events-none" style={{
                            background: `radial-gradient(ellipse at center, transparent 50%, ${currentSlide.backgroundColor || '#18181b'} 100%)`
                        }} />
                    </>
                )}
            </div>
        );

        switch (effect) {
            case 'puzzle':
                const puzzlePhotos = getPuzzlePhotos(photos);
                if (puzzlePhotos.length >= 2) {
                    return (
                        <BlurWrapper>
                            <div className="scale-75 md:scale-100 origin-center">
                                <PuzzleGallery photos={puzzlePhotos.map(url => ({ url }))} />
                            </div>
                        </BlurWrapper>
                    );
                }
                break;

            case 'carousel':
                if (photos.length > 0) {
                    return (
                        <BlurWrapper>
                            <div className="w-full max-w-4xl">
                                <CarouselGallery
                                    photos={photos.map(url => ({ url }))}
                                    config={{ slidesPerView: Math.min(3, photos.length), autoplay: true, speed: 3000 }}
                                />
                            </div>
                        </BlurWrapper>
                    );
                }
                break;

            case 'orbit':
                // Orbit effect not available for simple photo arrays
                // Fall through to standard image display
                break;

            case 'none':
            default:
                const displayPhoto = mainPhoto || photos[0];
                if (displayPhoto) {
                    return (
                        <BlurWrapper>
                            <img
                                src={displayPhoto}
                                alt={currentSlide.title || 'Slide'}
                                className={`object-${portraitMode} ${getShapeClasses(photoShape, photoSize)}`}
                                style={{ transform: `scale(${photoSize / 100})` }}
                            />
                        </BlurWrapper>
                    );
                }
                break;
        }

        return null;
    };

    return (
        <section
            className="relative w-full overflow-hidden"
            style={{
                height,
                backgroundColor: currentSlide.backgroundColor || '#18181b'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide.id}
                    className="absolute inset-0 w-full h-full flex flex-col"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    style={{ backgroundColor: currentSlide.backgroundColor || '#18181b' }}
                >
                    {/* Visual Content */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden p-4 md:p-8">
                        {renderVisualContent()}
                    </div>

                    {/* Text Content */}
                    <div className={`relative z-10 flex flex-col justify-end pb-16 md:pb-20 ${textPositionClasses[currentSlide.textPosition]}`}>
                        <div className="max-w-4xl">
                            {currentSlide.title && (
                                <motion.h2
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    className={`${fontSizeClasses[currentSlide.fontSize].title} ${fontFamilyClasses[currentSlide.fontFamily]} font-bold text-white mb-3 drop-shadow-lg`}
                                >
                                    {currentSlide.title}
                                </motion.h2>
                            )}

                            {currentSlide.subtitle && (
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    className={`${fontSizeClasses[currentSlide.fontSize].subtitle} ${fontFamilyClasses[currentSlide.fontFamily]} text-zinc-300 mb-6 max-w-2xl drop-shadow-md`}
                                >
                                    {currentSlide.subtitle}
                                </motion.p>
                            )}

                            {currentSlide.ctaText && currentSlide.ctaLink && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.6 }}
                                >
                                    <Link
                                        href={currentSlide.ctaLink}
                                        className="inline-block bg-gold-500 hover:bg-gold-400 text-black font-bold px-6 py-3 md:px-8 md:py-4 rounded-full transition-all hover:scale-105 shadow-lg"
                                    >
                                        {currentSlide.ctaText}
                                    </Link>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Navigation Dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-2 rounded-full transition-all duration-300 ${idx === currentIndex
                                ? 'bg-gold-500 w-6'
                                : 'bg-white/40 w-2 hover:bg-white/70'
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            )}

            {/* Navigation Arrows (for desktop) */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length)}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 items-center justify-center text-white transition-all"
                        aria-label="Previous slide"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev + 1) % slides.length)}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 items-center justify-center text-white transition-all"
                        aria-label="Next slide"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </>
            )}
        </section>
    );
}
