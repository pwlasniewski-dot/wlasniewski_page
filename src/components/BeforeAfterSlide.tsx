'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Construction, ArrowLeftRight } from 'lucide-react';

interface BeforeAfterSlideProps {
    beforeImage: string;
    afterImage: string;
    title: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    isActive: boolean;
    onPrev?: () => void;
    onNext?: () => void;
}

export default function BeforeAfterSlide({
    beforeImage,
    afterImage,
    title,
    subtitle,
    buttonText,
    buttonLink,
    isActive,
    onPrev,
    onNext
}: BeforeAfterSlideProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handlePointerDown = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button, a')) return;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setIsDragging(true);
        updateSlider(e.clientX);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        updateSlider(e.clientX);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setIsDragging(false);
        (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    };

    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(position);
    }, []);

    const handleMouseMove = (e: React.MouseEvent) => {
        // Optional: Enable hover effect if desired, but drag is better for explicit control
        // updateSlider(e.clientX);
    };

    // Reset slider when slide becomes active
    useEffect(() => {
        if (isActive) {
            setSliderPos(50);
            // Optional: Auto-sweep animation to demonstrate functionality
            const timer = setTimeout(() => {
                const animate = () => {
                    // Simple intro animation could go here
                };
                animate();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    return (
        <div className="relative w-full h-full overflow-hidden group/slider select-none">
            {/* Interaction Layer */}
            <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className="absolute inset-0 w-full h-full cursor-ew-resize touch-pan-y z-20"
            >
                {/* Images Layer */}
                <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* AFTER Image (Background - Build Finished) */}
                    <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${afterImage}")` }}
                    />

                    {/* BEFORE Image (Foreground - Construction Start) - Clipped */}
                    <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center overflow-hidden"
                        style={{
                            backgroundImage: `url("${beforeImage}")`,
                            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                            WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                        }}
                    />

                    {/* Overlays for text readability */}
                    <div className="absolute inset-0 bg-black/20" />
                    <div className="absolute bottom-0 left-0 w-full h-[60vh] bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                </div>

                {/* Slider Handle */}
                <div
                    className="absolute inset-y-0 z-30 pointer-events-none"
                    style={{ left: `${sliderPos}%` }}
                >
                    <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
                    <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl border-4 border-black/20 backdrop-blur-sm cursor-ew-resize">
                            <ArrowLeftRight size={20} className="opacity-80" />
                        </div>
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-32 left-8 md:bottom-12 md:left-12 pointer-events-none z-30">
                    <span className="bg-black/60 backdrop-blur-md text-white text-xs md:text-sm font-bold px-3 py-1.5 rounded border border-white/20 uppercase tracking-wider">
                        Przed
                    </span>
                </div>
                <div className="absolute bottom-32 right-8 md:bottom-12 md:right-12 pointer-events-none z-30">
                    <span className="bg-gold-500/90 backdrop-blur-md text-black text-xs md:text-sm font-bold px-3 py-1.5 rounded border border-gold-400/20 uppercase tracking-wider">
                        Po
                    </span>
                </div>
            </div>

            {/* Content Overlay */}
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-end pb-24 md:pb-32 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-4xl space-y-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/80 text-xs font-medium uppercase tracking-widest mb-2">
                        <Construction size={12} />
                        <span>Realizacja</span>
                    </div>

                    <h2 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl">
                        {title}
                    </h2>

                    {subtitle && (
                        <p className="text-lg md:text-xl text-zinc-200 font-light max-w-2xl mx-auto drop-shadow-lg">
                            {subtitle}
                        </p>
                    )}

                    {buttonText && (
                        <div className="pt-6 pointer-events-auto">
                            <Link
                                href={buttonLink || '#'}
                                className="inline-block px-8 py-3 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded transition-colors shadow-lg hover:shadow-gold-500/20"
                            >
                                {buttonText}
                            </Link>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Navigation Arrows */}
            {(onPrev || onNext) && (
                <>
                    {onPrev && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPrev(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all z-40 backdrop-blur-sm border border-white/10"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>
                    )}
                    {onNext && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition-all z-40 backdrop-blur-sm border border-white/10"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
