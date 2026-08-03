'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Camera, Maximize2, Minimize2 } from 'lucide-react';
import type { PortfolioSession } from "@/lib/portfolio";

interface CategoryFullSliderProps {
    sessions: PortfolioSession[];
    title: string;
    description?: string;
}

export default function CategoryFullSlider({ sessions, title, description }: CategoryFullSliderProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [autoplay, setAutoplay] = useState(true);
    const [fitMode, setFitMode] = useState<'cover' | 'contain'>('cover');

    // Prepare slides from sessions
    // Each slide is a session cover image or a highlighted photo
    const slides = sessions.flatMap(s => {
        if (s.highlightedPhotos && s.highlightedPhotos.length > 0) {
            return s.highlightedPhotos.map((photo, index) => ({
                id: `${s.id}-highlight-${index}`,
                image: photo,
                title: s.title,
                slug: s.slug,
                category: s.category,
                date: s.date,
                photoCount: s.photos?.length || 0,
                isHighlight: true
            }));
        }
        // Fallback to cover image if no highlights
        return s.coverImage ? [{
            id: s.id.toString(),
            image: s.coverImage,
            title: s.title,
            slug: s.slug,
            category: s.category,
            date: s.date,
            photoCount: s.photos?.length || 0,
            isHighlight: false
        }] : [];
    });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Autoplay logic
    useEffect(() => {
        if (!autoplay || slides.length <= 1) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [autoplay, slides.length]);

    if (!slides || slides.length === 0) return null;

    const slide = slides[currentSlide];

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setAutoplay(false);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
        setAutoplay(false);
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden group">

            {/* Background Images + Ken Burns Effect */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`bg-${currentSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute inset-0 w-full h-full overflow-hidden"
                >
                    {/* The Clickable Link Wrapper */}
                    <Link href={`/portfolio/${encodeURIComponent(slide.category)}/${encodeURIComponent(slide.slug)}`} className="block w-full h-full cursor-pointer relative">

                        {/* Layer 1: Blurred Background (Visible if contain mode, or if cover mode doesn't load/fill perfectly) */}
                        <div
                            className="absolute inset-0 w-full h-full bg-cover bg-center blur-xl opacity-40 scale-110"
                            style={{ backgroundImage: `url(${slide.image})` }}
                        />

                        {/* Layer 2: Main Image (Dynamic Fit) */}
                        <motion.div
                            className={`absolute inset-0 w-full h-full bg-center bg-no-repeat shadow-2xl transition-all duration-700 ${fitMode === 'cover' ? 'bg-cover' : 'bg-contain'}`}
                            initial={{ scale: 1 }}
                            animate={{ scale: fitMode === 'cover' ? 1.15 : 1.05 }}
                            transition={{
                                duration: 12,
                                ease: "linear",
                                repeat: 0
                            }}
                            style={{
                                backgroundImage: `url(${slide.image})`
                            }}
                        />
                    </Link>
                </motion.div>
            </AnimatePresence>

            {/* Gradient Overlay - darker at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none z-10" />

            {/* Global Title (Portfolio Category Name) - Top Left */}
            <div className="absolute top-8 left-8 z-20 pointer-events-none mix-blend-difference">
                <Link href="/portfolio" className="pointer-events-auto text-white/80 hover:text-gold-400 transition-colors uppercase tracking-widest text-xs font-bold mb-2 block">
                    ← Wróć do Portfolio
                </Link>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tighter opacity-90">
                    {title}
                </h1>
                {description && <p className="text-zinc-300 text-sm mt-2 max-w-md hidden md:block">{description}</p>}
            </div>

            {/* Slide Info (Bottom Left) */}
            <div className="absolute bottom-12 left-8 md:left-16 z-20 pointer-events-none max-w-2xl">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`info-${currentSlide}`}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        {slide.date && (
                            <p className="text-gold-400 text-sm uppercase tracking-wider mb-2 font-medium">
                                {new Date(slide.date).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long' })}
                            </p>
                        )}
                        <h2 className="text-3xl md:text-6xl font-bold text-white mb-4 leading-tight">
                            {slide.title}
                        </h2>

                        <div className="flex items-center gap-6 mt-6 pointer-events-auto">
                            <Link
                                href={`/portfolio/${encodeURIComponent(slide.category)}/${encodeURIComponent(slide.slug)}`}
                                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-bold uppercase tracking-wide text-sm hover:bg-gold-400 transition-all duration-300 transform hover:scale-105"
                            >
                                <Camera className="w-4 h-4" />
                                Zobacz Sesję
                            </Link>

                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setFitMode(prev => prev === 'cover' ? 'contain' : 'cover');
                                }}
                                className="inline-flex items-center gap-2 px-4 py-3 bg-black/50 border border-white/20 text-white font-medium uppercase tracking-wide text-xs hover:bg-black/70 transition-all backdrop-blur-sm"
                            >
                                {fitMode === 'cover' ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                {fitMode === 'cover' ? 'Dopasuj' : 'Wypełnij'}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prevSlide}
                onMouseEnter={() => setAutoplay(false)}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white/70 hover:text-white transition-all z-30 backdrop-blur-sm opacity-0 group-hover:opacity-100"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
            <button
                onClick={nextSlide}
                onMouseEnter={() => setAutoplay(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/20 hover:bg-black/50 text-white/70 hover:text-white transition-all z-30 backdrop-blur-sm opacity-0 group-hover:opacity-100"
            >
                <ChevronRight className="w-8 h-8" />
            </button>

            {/* Progress Bar / Dots */}
            <div className="absolute bottom-0 left-0 w-full z-30 flex">
                {slides.map((_, index) => (
                    <div
                        key={index}
                        className="h-1.5 flex-1 bg-white/10 relative cursor-pointer group/bar"
                        onClick={() => { setCurrentSlide(index); setAutoplay(false); }}
                    >
                        {index === currentSlide && (
                            <motion.div
                                className="absolute inset-0 bg-gold-400"
                                layoutId="progressBar"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 6, ease: "linear" }}
                                onAnimationComplete={() => {
                                    if (autoplay) nextSlide();
                                }}
                            />
                        )}
                        <div className="absolute inset-0 bg-white/30 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                ))}
            </div>
        </div>
    );
}
