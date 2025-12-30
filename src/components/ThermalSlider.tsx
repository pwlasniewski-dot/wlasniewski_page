import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MoveHorizontal, ChevronLeft, ChevronRight, Activity, Crosshair, Maximize2, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    switchInterval?: number;
}

export default function ThermalSlider({
    visualImage,
    thermalImage,
    labelLeft = 'Widok Standardowy',
    labelRight = 'Termowizja',
    sections = [],
    title,
    switchInterval = 8
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
        const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPos(position);
        setAutoScroll(false);
    }, []);

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        updateSlider(clientX);
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
        }, switchInterval * 1000);
        return () => {
            if (autoScrollRef.current) clearInterval(autoScrollRef.current);
        };
    }, [autoScroll, displaySections.length, switchInterval]);

    // Format URLs for CSS
    const visualUrl = currentSection.visualImage ? `url("${currentSection.visualImage}")` : 'none';
    const thermalUrl = currentSection.thermalImage ? `url("${currentSection.thermalImage}")` : 'none';

    return (
        <div className="w-full space-y-8">
            {/* 1. Technical Header */}
            {title && (
                <div className="text-center space-y-4">
                    <div className="flex flex-col items-center">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4"
                        >
                            <Activity size={12} className="animate-pulse" /> Thermal Analysis Module
                        </motion.div>

                        {/* 2. Sleek Tab Navigation */}
                        {displaySections.length > 1 && (
                            <div className="mt-6 md:mt-8 relative inline-flex p-1 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden self-center max-w-full">
                                {displaySections.map((section, index) => (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() => handleCategoryClick(index)}
                                        className={`relative px-4 md:px-8 py-3 md:py-4 rounded-xl text-[10px] md:text-[13px] font-black uppercase tracking-widest transition-all z-10 ${activeSection === index ? 'text-black' : 'text-zinc-500 hover:text-white'
                                            }`}
                                    >
                                        {section.category}
                                        {activeSection === index && (
                                            <motion.div
                                                layoutId="activeTab"
                                                className="absolute inset-0 bg-yellow-500 rounded-xl -z-10 shadow-lg"
                                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                            />
                                        )}
                                        {/* Pulsing Border for Clickability */}
                                        {activeSection !== index && (
                                            <div className="absolute inset-0 rounded-xl border border-white/0 hover:border-yellow-500/30 transition-colors">
                                                <div className="absolute inset-0 rounded-xl border border-yellow-500/0 hover:border-yellow-500/20 animate-pulse" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        <motion.div
                            key={activeSection}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-3xl mx-auto"
                        >
                            <h3 className="text-xl font-bold text-white mb-3">{currentSection.category}</h3>
                            {currentSection.description && (
                                <div
                                    className="text-zinc-400 text-sm leading-relaxed max-w-2xl mx-auto prose prose-invert prose-sm prose-inline-styles"
                                    dangerouslySetInnerHTML={{ __html: currentSection.description }}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            {/* 3. The Slider with HUD */}
            <div className="relative group/slider">
                {/* HUD Elements - TOP LEFT */}
                <div className="absolute top-6 left-6 z-30 pointer-events-none hidden md:flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-mono text-zinc-300">
                        <ScanLine size={12} className="text-yellow-500" />
                        <span>STATUS: LIVE_SCAN_ACTIVE</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-mono text-zinc-300">
                        <Crosshair size={12} className="text-blue-400" />
                        <span>LAT: 52.2297° N / LON: 21.0122° E</span>
                    </div>
                </div>

                {/* HUD Elements - TOP RIGHT */}
                <div className="absolute top-6 right-6 z-30 pointer-events-none hidden md:flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-mono text-zinc-300">
                        <span>RES: 640x512 PX</span>
                        <Maximize2 size={12} className="text-zinc-500" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 text-[9px] font-mono text-zinc-300">
                        <span>EMISSIVITY: 0.95</span>
                    </div>
                </div>

                <div
                    ref={containerRef}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                    className="relative aspect-[4/3] md:aspect-video w-full rounded-[20px] md:rounded-[40px] overflow-hidden group/container cursor-none active:scale-[0.99] transition-transform duration-500 shadow-2xl touch-none"
                >
                    {/* Thermal Image (Bottom Layer) */}
                    <AnimatePresence>
                        <motion.div
                            key={currentSection.id + '_thermal'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: thermalUrl }}
                        />
                    </AnimatePresence>

                    {/* Visual Image (Top Layer) */}
                    <AnimatePresence>
                        <motion.div
                            key={currentSection.id + '_visual'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: visualUrl,
                                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                                WebkitClipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                            }}
                        />
                    </AnimatePresence>

                    {/* PRO Handle UI - More Technical */}
                    <div
                        className="absolute inset-y-0 z-30 pointer-events-none"
                        style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                    >
                        <div className="h-full w-0.5 bg-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all duration-300 group-active/container:scale-x-150" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-black/40 backdrop-blur-2xl border border-white/10 flex items-center justify-center shadow-2xl">
                                <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border border-yellow-500/30 flex items-center justify-center animate-pulse">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,1)]" />
                                </div>
                                {/* Handle Arrow Indicators */}
                                <div className="absolute inset-x-[-12px] md:inset-x-[-20px] top-1/2 -translate-y-1/2 flex justify-between px-1">
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 border-l border-t border-yellow-500 -rotate-45" />
                                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 border-r border-t border-yellow-500 rotate-45" />
                                </div>
                            </div>
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-yellow-500 text-black text-[10px] md:text-xs font-black rounded uppercase tracking-tighter whitespace-nowrap shadow-xl opacity-0 group-hover/container:opacity-100 transition-opacity">
                                POSITION: {sliderPos.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Labels - More Professional Styling */}
                    <div className="absolute bottom-10 left-10 z-20 pointer-events-none">
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Source Filter</span>
                            <span className="bg-black/40 backdrop-blur-xl text-white text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl border border-white/10 shadow-xl">
                                {currentSection.labelLeft || labelLeft}
                            </span>
                        </div>
                    </div>
                    <div className="absolute bottom-10 right-10 z-20 pointer-events-none">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Active Core</span>
                            <span className="bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-xl shadow-[0_10px_30px_rgba(234,179,8,0.3)] border border-yellow-400">
                                {currentSection.labelRight || labelRight}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Buttons - Hidden on small screens, minimal on large */}
                    {displaySections.length > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-yellow-500 hover:text-black text-white p-3 rounded-2xl transition-all backdrop-blur-md border border-white/10 hidden lg:flex group/btn"
                            >
                                <ChevronLeft size={24} className="group-hover/btn:-translate-x-1 transition-transform" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-yellow-500 hover:text-black text-white p-3 rounded-2xl transition-all backdrop-blur-md border border-white/10 hidden lg:flex group/btn"
                            >
                                <ChevronRight size={24} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </>
                    )}
                </div>

                {/* Filmstrip Switcher - Mega Pro Look */}
                {displaySections.length > 1 && (
                    <div className="mt-12 flex justify-center items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {displaySections.map((section, index) => (
                            <button
                                key={section.id}
                                type="button"
                                onClick={() => handleCategoryClick(index)}
                                className={`group/thumb relative flex-shrink-0 w-32 md:w-40 aspect-video rounded-xl overflow-hidden border-2 transition-all duration-500 bg-zinc-900 ${activeSection === index
                                    ? 'border-yellow-500 scale-110 shadow-[0_0_30px_rgba(234,179,8,0.3)]'
                                    : 'border-white/5 hover:border-white/20'
                                    }`}
                            >
                                {/* Thumbnail Background (Visual) */}
                                <img
                                    src={section.visualImage}
                                    alt={section.category}
                                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${activeSection === index ? 'grayscale-0 opacity-100' : 'grayscale opacity-40 group-hover/thumb:opacity-70 group-hover/thumb:grayscale-0'
                                        }`}
                                />

                                {/* Thumbnail Foreground (Thermal) - Reflecting main slider position */}
                                {section.thermalImage && (
                                    <div
                                        className="absolute inset-0 z-10"
                                        style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                                    >
                                        <img
                                            src={section.thermalImage}
                                            alt={section.category}
                                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${activeSection === index ? 'grayscale-0 opacity-100' : 'grayscale opacity-40 group-hover/thumb:opacity-70 group-hover/thumb:grayscale-0'
                                                }`}
                                        />
                                    </div>
                                )}

                                <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2 z-30">
                                    <p className={`text-[9px] font-black uppercase tracking-tighter truncate transition-colors ${activeSection === index ? 'text-yellow-500' : 'text-zinc-500 group-hover/thumb:text-white'
                                        }`}>
                                        {section.category}
                                    </p>
                                </div>
                                {activeSection === index && (
                                    <div className="absolute inset-0 border-4 border-yellow-500/20 pointer-events-none" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
