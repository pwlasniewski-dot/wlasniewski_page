'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Activity, ScanLine, Crosshair, Maximize2 } from 'lucide-react';

interface ThermalHeroSlide {
    id: string;
    category: string;
    title: string;
    subtitle?: string;
    description?: string;
    visualMedia: string; // URL
    thermalMedia: string; // URL
    mediaType?: 'image' | 'video';
    labelLeft?: string;
    labelRight?: string;
    buttonText?: string;
    buttonLink?: string;
    buttonStyle?: 'gold' | 'white' | 'transparent';
    textAnimation?: 'fade' | 'slide-up' | 'scale';
}

interface ThermalHeroSliderProps {
    slides: ThermalHeroSlide[];
    interval?: number;
}

const textVariants = {
    'fade': { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    'slide-up': { initial: { opacity: 0, y: 50 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -50 } },
    'scale': { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 1.1 } }
};

export default function ThermalHeroSlider({ slides = [], interval = 10000 }: ThermalHeroSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const [autoplay, setAutoplay] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoplayRef = useRef<NodeJS.Timeout>();
    const touchStartRef = useRef<number | null>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setIsDragging(true);
        updateSlider(e.clientX);
        touchStartRef.current = e.clientX;
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        updateSlider(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

        if (touchStartRef.current !== null) {
            const diff = touchStartRef.current - e.clientX;
            // High threshold for swipe to distinguish from slider movement
            if (Math.abs(diff) > 100) {
                if (diff > 0) nextSlide();
                else prevSlide();
            }
        }
        touchStartRef.current = null;
    };

    const slide = slides[currentSlide];

    // Autoplay logic
    useEffect(() => {
        if (!autoplay || slides.length <= 1) return;
        autoplayRef.current = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, interval);
        return () => {
            if (autoplayRef.current) clearInterval(autoplayRef.current);
        };
    }, [autoplay, slides.length, interval]);

    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(position);
        setAutoplay(false);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) updateSlider(e.clientX);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setAutoplay(false);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setAutoplay(false);
    };

    if (!slides || slides.length === 0) return null;

    const variant = textVariants[slide.textAnimation || 'slide-up'] || textVariants['slide-up'];

    return (
        <div className="relative w-full h-[90vh] md:h-screen bg-black overflow-hidden group/slider">
            <div
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute inset-0 w-full h-full md:cursor-none touch-none"
            >
                {/* 1. THERMAL LAYER (Bottom) */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`thermal-${currentSlide}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 w-full h-full overflow-hidden"
                    >
                        {slide.mediaType === 'video' ? (
                            <video
                                src={slide.thermalMedia}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url("${slide.thermalMedia}")` }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* 2. VISUAL LAYER (Top) */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`visual-${currentSlide}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 w-full h-full overflow-hidden z-10"
                        style={{
                            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                            WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                        }}
                    >
                        {slide.mediaType === 'video' ? (
                            <video
                                src={slide.visualMedia}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url("${slide.visualMedia}")` }}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Overlays */}
                <div className="absolute inset-0 bg-black/20 z-20 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-full h-[60vh] bg-gradient-to-t from-black via-black/40 to-transparent z-20 pointer-events-none" />

                {/* HUD Elements */}
                <div className="absolute top-10 left-10 z-30 pointer-events-none hidden md:flex flex-col gap-3">
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] font-mono text-zinc-300">
                        <ScanLine size={14} className="text-yellow-500 animate-pulse" />
                        <span className="tracking-widest">SYSTEM_STATUS: THERMAL_HERO_ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] font-mono text-zinc-300">
                        <Crosshair size={14} className="text-blue-400" />
                        <span>SENSORS: FLIR_RADIOMETRIC_PRO</span>
                    </div>
                </div>

                <div className="absolute top-10 right-10 z-30 pointer-events-none hidden md:flex flex-col items-end gap-3">
                    <div className="flex items-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 text-[10px] font-mono text-zinc-300">
                        <span>LENS: 24MM_EQUIVALENT</span>
                        <Maximize2 size={14} className="text-zinc-500" />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black text-[10px] font-black rounded-xl">
                        <Activity size={14} /> LIVE_DELTA_T_SCAN
                    </div>
                </div>

                {/* Wiper Handle */}
                <div
                    className="absolute inset-y-0 z-40 pointer-events-none"
                    style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                >
                    <div className="h-full w-0.5 bg-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.8)]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center shadow-2xl">
                            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-yellow-500/30 flex items-center justify-center animate-pulse">
                                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(234,179,8,1)]" />
                            </div>
                        </div>
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-yellow-500 text-black text-[10px] font-black rounded-lg uppercase tracking-tighter whitespace-nowrap shadow-2xl opacity-0 group-hover/slider:opacity-100 transition-opacity">
                            SCAN_POS: {sliderPos.toFixed(1)}%
                        </div>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-10 left-10 z-30 pointer-events-none hidden sm:block">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Optical View</span>
                        <span className="bg-black/40 backdrop-blur-2xl text-white text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl border border-white/10 shadow-2xl">
                            {slide.labelLeft || 'Standard RGB'}
                        </span>
                    </div>
                </div>

                <div className="absolute bottom-10 right-10 z-30 pointer-events-none hidden sm:block">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Thermal Core</span>
                        <span className="bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-widest px-5 py-2.5 rounded-xl shadow-[0_10px_40px_rgba(234,179,8,0.4)] border border-yellow-400">
                            {slide.labelRight || 'Ironbow Palette'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Content Overlay (Centered/Bottom) */}
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-end pb-24 md:pb-32 px-6">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`text-${currentSlide}`}
                        initial={variant.initial}
                        animate={variant.animate}
                        exit={variant.exit}
                        transition={{ duration: 0.8 }}
                        className="max-w-4xl w-full text-center space-y-4 md:space-y-6 pointer-events-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4"
                        >
                            <Activity size={12} className="animate-pulse" /> {slide.category}
                        </motion.div>
                        <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tighter drop-shadow-2xl" dangerouslySetInnerHTML={{ __html: slide.title }} />
                        {slide.subtitle && (
                            <p className="text-lg md:text-2xl text-zinc-300 font-light max-w-2xl mx-auto drop-shadow-xl">
                                {slide.subtitle}
                            </p>
                        )}
                        {slide.description && (
                            <div className="max-w-xl mx-auto text-sm md:text-base text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: slide.description }} />
                        )}
                        {slide.buttonText && (
                            <div className="pt-6">
                                <Link
                                    href={slide.buttonLink || '#'}
                                    className={`inline-block px-8 py-4 font-black rounded-2xl transition-all duration-300 shadow-2xl hover:scale-105 ${slide.buttonStyle === 'white'
                                        ? 'bg-white text-black hover:bg-zinc-200'
                                        : slide.buttonStyle === 'transparent'
                                            ? 'bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white'
                                            : 'bg-yellow-500 text-black hover:bg-yellow-400'
                                        }`}
                                >
                                    {slide.buttonText}
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows (Desktop Only) */}
            {slides.length > 1 && (
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-40 px-4 md:px-8 pointer-events-none flex justify-between items-center hidden md:flex opacity-0 group-hover/slider:opacity-100 transition-opacity">
                    <button
                        type="button"
                        onClick={prevSlide}
                        className="pointer-events-auto p-4 md:p-6 rounded-2xl bg-black/40 hover:bg-yellow-500 text-white hover:text-black transition-all backdrop-blur-xl border border-white/10 group/btn relative overflow-hidden"
                    >
                        <ChevronLeft size={32} className="relative z-10 group-hover/btn:-translate-x-1 transition-transform" />
                        <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-2xl animate-pulse opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                    <button
                        type="button"
                        onClick={nextSlide}
                        className="pointer-events-auto p-4 md:p-6 rounded-2xl bg-black/40 hover:bg-yellow-500 text-white hover:text-black transition-all backdrop-blur-xl border border-white/10 group/btn relative overflow-hidden"
                    >
                        <ChevronRight size={32} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-2xl animate-pulse opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </button>
                </div>
            )}

            {/* "Mega Pro" Filmstrip Thumbnails */}
            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 flex gap-3 md:gap-4 justify-center items-center overflow-x-auto no-scrollbar py-4">
                    {slides.map((s, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => { setCurrentSlide(idx); setAutoplay(false); }}
                            className={`group/thumb relative flex-shrink-0 w-24 md:w-32 aspect-video rounded-xl overflow-hidden border-2 transition-all duration-500 ${idx === currentSlide
                                ? 'border-yellow-500 scale-110 shadow-[0_0_30px_rgba(234,179,8,0.5)]'
                                : 'border-white/5 hover:border-white/20'}`}
                        >
                            {/* Visual Layer */}
                            <img
                                src={s.visualMedia}
                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${idx === currentSlide ? 'grayscale-0 opacity-100' : 'grayscale opacity-40 group-hover/thumb:opacity-70 group-hover/thumb:grayscale-0'}`}
                            />
                            {/* Thermal Layer (Partial Overlay) */}
                            <div
                                className="absolute inset-0 z-10"
                                style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                            >
                                <img
                                    src={s.thermalMedia}
                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${idx === currentSlide ? 'grayscale-0 opacity-100' : 'grayscale opacity-40 group-hover/thumb:opacity-70 group-hover/thumb:grayscale-0'}`}
                                />
                            </div>

                            <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-1.5 left-2 right-2 z-30">
                                <p className={`text-[8px] font-black uppercase tracking-tighter truncate ${idx === currentSlide ? 'text-yellow-500' : 'text-zinc-500'}`}>
                                    {s.category}
                                </p>
                            </div>

                            {/* Pulsing Highlight for Active Item */}
                            {idx === currentSlide && (
                                <div className="absolute inset-0 border-2 border-yellow-500 animate-pulse pointer-events-none" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
