'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Volume2, VolumeX } from 'lucide-react';

interface VideoSlide {
    id: string;
    videoUrl: string;
    title: string;
    subtitle?: string;
    description?: string;
    buttonText?: string;
    buttonLink?: string;
    buttonStyle?: 'gold' | 'white' | 'transparent';
    overlayOpacity?: number;
    textAnimation?: 'fade' | 'slide-up' | 'scale';
}

interface HeroVideoSliderProps {
    slides: VideoSlide[];
    interval?: number;
}

const animationVariants = {
    'fade': { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    'slide-up': { initial: { opacity: 0, y: 60 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -60 } },
    'scale': { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.1 } }
};

export default function HeroVideoSlider({ slides = [], interval = 12000 }: HeroVideoSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMuted, setIsMuted] = useState(true);
    const [autoplay, setAutoplay] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const slide = slides[currentSlide];

    useEffect(() => {
        if (!autoplay || slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoplay, slides.length, interval]);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setAutoplay(false);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setAutoplay(false);
    };

    if (!slides || slides.length === 0) return null;

    const variant = animationVariants[slide.textAnimation || 'slide-up'] || animationVariants['slide-up'];

    return (
        <div className="relative w-full h-[90vh] md:h-screen bg-black overflow-hidden group">
            {/* Background Video */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentSlide}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5 }}
                    className="absolute inset-0 w-full h-full"
                >
                    <video
                        ref={videoRef}
                        src={slide.videoUrl}
                        autoPlay
                        muted={isMuted}
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0 bg-black"
                        style={{ opacity: slide.overlayOpacity ?? 0.4 }}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="relative z-20 h-full w-full flex flex-col items-center justify-center px-6 text-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`content-${currentSlide}`}
                        initial={variant.initial}
                        animate={variant.animate}
                        exit={variant.exit}
                        transition={{ duration: 0.8 }}
                        className="max-w-5xl space-y-6"
                    >
                        <h1
                            className="text-5xl md:text-8xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl"
                            dangerouslySetInnerHTML={{ __html: slide.title }}
                        />
                        {slide.subtitle && (
                            <p className="text-xl md:text-3xl text-zinc-300 font-light drop-shadow-xl">
                                {slide.subtitle}
                            </p>
                        )}
                        {slide.description && (
                            <div
                                className="max-w-2xl mx-auto text-sm md:text-lg text-zinc-400 leading-relaxed font-medium"
                                dangerouslySetInnerHTML={{ __html: slide.description }}
                            />
                        )}
                        {slide.buttonText && (
                            <div className="pt-8">
                                <Link
                                    href={slide.buttonLink || '#'}
                                    className={`inline-block px-10 py-5 font-black rounded-2xl transition-all duration-300 shadow-2xl hover:scale-105 ${slide.buttonStyle === 'white'
                                            ? 'bg-white text-black hover:bg-zinc-200'
                                            : slide.buttonStyle === 'transparent'
                                                ? 'bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white'
                                                : 'bg-gold-500 text-black hover:bg-gold-400'
                                        }`}
                                >
                                    {slide.buttonText}
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent z-10" />

            {/* Controls */}
            <div className="absolute bottom-10 right-10 z-30 flex items-center gap-4">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white hover:bg-white/20 transition-all"
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>

            {/* Navigation */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft size={32} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-black/20 hover:bg-black/40 text-white transition-all backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight size={32} />
                    </button>

                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-2">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setCurrentSlide(idx); setAutoplay(false); }}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlide ? 'w-10 bg-gold-500' : 'w-4 bg-white/20 hover:bg-white/40'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
