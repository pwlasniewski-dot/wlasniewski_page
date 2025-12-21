
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

interface ThermalSection {
    id: string;
    category: string;
    visualImage: string;
    thermalImage: string;
    labelLeft?: string;
    labelRight?: string;
}

interface ThermalSliderProps {
    visualImage?: string;
    thermalImage?: string;
    labelLeft?: string;
    labelRight?: string;
    sections?: ThermalSection[];
    title?: string;
}

export default function ThermalSlider({
    visualImage,
    thermalImage,
    labelLeft = 'Widok Standardowy',
    labelRight = 'Termowizja',
    sections = [],
    title
}: ThermalSliderProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const [activeSection, setActiveSection] = useState(0);
    const [autoScroll, setAutoScroll] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const autoScrollRef = useRef<NodeJS.Timeout>();

    // Default sections if none provided
    const displaySections: ThermalSection[] = sections.length > 0 ? sections : [
        {
            id: '1',
            category: 'Fotowoltaika',
            visualImage: visualImage || 'https://images.unsplash.com/photo-1542332213-9b5a5a3fad35?auto=format&fit=crop&q=80&w=1200',
            thermalImage: thermalImage || 'https://images.unsplash.com/photo-1579546678181-7f311c1d0b3e?auto=format&fit=crop&q=80&w=1200',
            labelLeft: 'Widok Standardowy',
            labelRight: 'Termowizja'
        }
    ];

    const currentSection = displaySections[activeSection];

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let x = 0;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
        }

        const position = (x / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, position)));
        setAutoScroll(false);
    };

    const handleCategoryClick = (index: number) => {
        setActiveSection(index);
        setAutoScroll(false);
    };

    const handlePrev = () => {
        setActiveSection((prev) => (prev === 0 ? displaySections.length - 1 : prev - 1));
        setAutoScroll(false);
    };

    const handleNext = () => {
        setActiveSection((prev) => (prev === displaySections.length - 1 ? 0 : prev + 1));
        setAutoScroll(false);
    };

    // Auto-scroll effect
    useEffect(() => {
        if (!autoScroll || displaySections.length <= 1) return;

        autoScrollRef.current = setInterval(() => {
            setActiveSection((prev) => (prev === displaySections.length - 1 ? 0 : prev + 1));
        }, 5000); // Change section every 5 seconds

        return () => {
            if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        };
    }, [autoScroll, displaySections.length]);

    return (
        <div className="w-full space-y-6">
            {title && (
                <div className="text-center">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-2">{title}</h2>
                    <p className="text-zinc-400">Kategoria: <span className="text-yellow-500 font-semibold">{currentSection.category}</span></p>
                </div>
            )}

            {/* Category Tags */}
            {displaySections.length > 1 && (
                <div className="flex flex-wrap gap-3 justify-center">
                    {displaySections.map((section, index) => (
                        <button
                            key={section.id}
                            onClick={() => handleCategoryClick(index)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                activeSection === index
                                    ? 'bg-yellow-500 text-black shadow-lg'
                                    : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-yellow-500/50 hover:text-white'
                            }`}
                        >
                            {section.category}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Slider */}
            <div
                ref={containerRef}
                className="relative w-full aspect-[16/6] overflow-hidden rounded-2xl cursor-col-resize select-none shadow-2xl"
                onMouseMove={handleMove}
                onTouchMove={handleMove}
            >
                {/* Thermal Image (Bottom Layer) */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{ backgroundImage: `url(${currentSection.thermalImage})` }}
                />

                {/* Visual Image (Top Layer) */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{
                        backgroundImage: `url(${currentSection.visualImage})`,
                        clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                    }}
                />

                {/* Slider Divider */}
                <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-all duration-75"
                    style={{ left: `${sliderPos}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-black">
                        <MoveHorizontal size={20} />
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                        {currentSection.labelLeft || labelLeft}
                    </span>
                </div>
                <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
                    <span className="bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                        {currentSection.labelRight || labelRight}
                    </span>
                </div>

                {/* Navigation Controls (if multiple sections) */}
                {displaySections.length > 1 && (
                    <>
                        <button
                            onClick={handlePrev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                            aria-label="Previous"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                            aria-label="Next"
                        >
                            <ChevronRight size={24} />
                        </button>

                        {/* Indicators */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                            {displaySections.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleCategoryClick(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        activeSection === index
                                            ? 'bg-yellow-500 w-6'
                                            : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                    aria-label={`Go to section ${index + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Description */}
            {displaySections.length > 1 && (
                <div className="text-center text-sm text-zinc-400">
                    Sekcja {activeSection + 1} z {displaySections.length}
                    {autoScroll && <span className="ml-2 text-yellow-500/70">Auto-scroll aktywny</span>}
                </div>
            )}
        </div>
    );
}
