
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

interface ThermalSection {
    id: string;
    category: string;
    description?: string;
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
    const [isDragging, setIsDragging] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const autoScrollRef = useRef<NodeJS.Timeout>();

    // Prepare sections from props
    const displaySections: ThermalSection[] = (sections && sections.length > 0) ? sections : [
        {
            id: '1',
            category: 'Podgląd',
            visualImage: visualImage || '',
            thermalImage: thermalImage || '',
            labelLeft: labelLeft,
            labelRight: labelRight
        }
    ];

    if (displaySections.length === 1 && !displaySections[0].visualImage && !displaySections[0].thermalImage) {
        return (
            <div className="w-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-500">Galeria w przygotowaniu...</p>
            </div>
        );
    }

    const currentSection = displaySections[activeSection];

    const updateSlider = useCallback((clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const position = (x / rect.width) * 100;
        setSliderPos(Math.max(0, Math.min(100, position)));
        setAutoScroll(false);
    }, []);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        updateSlider(e.clientX);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        updateSlider(e.touches[0].clientX);
    };

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            if (isDragging) updateSlider(e.clientX);
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (isDragging) updateSlider(e.touches[0].clientX);
        };
        const handleEnd = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, updateSlider]);

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
        }, 8000);
        return () => {
            if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        };
    }, [autoScroll, displaySections.length]);

    // Format URLs for CSS
    const visualUrl = currentSection.visualImage ? `url("${currentSection.visualImage}")` : 'none';
    const thermalUrl = currentSection.thermalImage ? `url("${currentSection.thermalImage}")` : 'none';

    return (
        <div className="w-full space-y-6">
            {title && (
                <div className="text-center space-y-2">
                    <h2 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{title}</h2>
                    <div className="flex flex-col items-center">
                        <span className="text-yellow-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">Bieżąca Analiza</span>
                        <h3 className="text-xl font-medium text-zinc-100">{currentSection.category}</h3>
                        {currentSection.description && (
                            <p className="text-zinc-400 text-sm max-w-2xl mt-2 leading-relaxed italic">
                                {currentSection.description}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {displaySections.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center px-4">
                    {displaySections.map((section, index) => (
                        <button
                            key={section.id}
                            onClick={() => handleCategoryClick(index)}
                            className={`group relative px-5 py-2.5 rounded-full text-xs font-bold transition-all overflow-hidden ${activeSection === index
                                ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                                : 'bg-zinc-900 text-zinc-400 border border-white/5 hover:text-white hover:bg-zinc-800'
                                }`}
                        >
                            <span className="relative z-10">{section.category}</span>
                            {activeSection === index && (
                                <span className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-50 blur-sm" />
                            )}
                        </button>
                    ))}
                </div>
            )}

            <div
                ref={containerRef}
                className="relative w-full aspect-[16/6] md:aspect-[16/7] overflow-hidden rounded-2xl cursor-col-resize select-none shadow-2xl bg-zinc-900 border border-white/5 touch-none"
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                {/* Thermal Image (Bottom Layer) */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: thermalUrl }}
                />

                {/* Visual Image (Top Layer) */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: visualUrl,
                        clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                        WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                    }}
                />

                {/* Slider Divider */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10"
                    style={{ left: `${sliderPos}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center text-black">
                        <MoveHorizontal size={16} />
                    </div>
                </div>

                {/* Labels */}
                <div className="absolute bottom-4 left-4 z-20 pointer-events-none sm:bottom-6 sm:left-6">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                        {currentSection.labelLeft || labelLeft}
                    </span>
                </div>
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none sm:bottom-6 sm:right-6">
                    <span className="bg-yellow-500 text-black text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                        {currentSection.labelRight || labelRight}
                    </span>
                </div>

                {displaySections.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all backdrop-blur-sm hidden sm:flex"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleNext(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-all backdrop-blur-sm hidden sm:flex"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
            </div>

            {displaySections.length > 1 && (
                <div className="flex justify-center gap-1.5">
                    {displaySections.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 rounded-full transition-all ${activeSection === index ? 'w-8 bg-yellow-500' : 'w-2 bg-zinc-800'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
