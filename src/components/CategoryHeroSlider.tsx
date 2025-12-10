"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PortfolioSession } from "@/lib/portfolio";

export default function CategoryHeroSlider({
    sessions,
    title,
    description
}: {
    sessions: PortfolioSession[],
    title: string,
    description?: string
}) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Logic:
    // 1. Take covers from all sessions.
    // 2. If we have fewer than 5 slides, take the first few photos from each session to fill it up.
    // 3. Shuffle or just take the top 10.

    const allCandidates = sessions.flatMap(s => [
        { image: s.coverImage, title: s.title },
        ...(s.photos || []).slice(0, 3).map(p => ({ image: p.src, title: s.title }))
    ]).filter(item => item.image);

    // Deduplicate by image URL
    const uniqueSlides = Array.from(new Map(allCandidates.map(item => [item.image, item])).values());

    // Take top 8 for the slider
    const slides = uniqueSlides.slice(0, 8);

    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    if (slides.length === 0) return null;

    return (
        <div className="relative h-[70vh] w-full overflow-hidden mb-16">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    {/* Smart Fit Background (Blurred) */}
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-xl opacity-50 scale-110"
                        style={{ backgroundImage: `url(${slides[currentIndex].image})` }}
                    />

                    {/* Main Image (Contained) */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <img
                            src={slides[currentIndex].image}
                            alt={slides[currentIndex].title}
                            className="w-full h-full object-contain relative z-10"
                        />
                    </div>

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40" />
                </motion.div>
            </AnimatePresence>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.5 }}
                >
                    <h1 className="text-6xl md:text-8xl font-display font-medium text-white mb-6 tracking-tight drop-shadow-2xl">
                        {title}
                    </h1>
                    <div className="w-24 h-px bg-gold-400 mx-auto mb-6" />
                    {description && (
                        <p className="text-zinc-200 text-lg md:text-xl max-w-2xl mx-auto font-light font-sans tracking-wide">
                            {description}
                        </p>
                    )}
                </motion.div>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-1 rounded-full transition-all duration-500 ${index === currentIndex ? "w-8 bg-gold-400" : "w-2 bg-white/30 hover:bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
