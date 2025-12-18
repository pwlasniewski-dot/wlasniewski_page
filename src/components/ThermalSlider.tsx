
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface ThermalSliderProps {
    visualImage: string;
    thermalImage: string;
    labelLeft?: string;
    labelRight?: string;
}

export default function ThermalSlider({
    visualImage,
    thermalImage,
    labelLeft = 'Widok Standardowy',
    labelRight = 'Termowizja'
}: ThermalSliderProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);

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
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl cursor-col-resize select-none"
            onMouseMove={handleMove}
            onTouchMove={handleMove}
        >
            {/* Thermal Image (Bottom Layer) */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${thermalImage})` }}
            />

            {/* Visual Image (Top Layer) */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${visualImage})`,
                    clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
                }}
            />

            {/* Slider Divider */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10"
                style={{ left: `${sliderPos}%` }}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center text-black">
                    <MoveHorizontal size={20} />
                </div>
            </div>

            {/* Labels */}
            <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
                <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                    {labelLeft}
                </span>
            </div>
            <div className="absolute bottom-6 right-6 z-20 pointer-events-none">
                <span className="bg-yellow-500 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    {labelRight}
                </span>
            </div>
        </div>
    );
}
