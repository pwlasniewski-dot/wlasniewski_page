'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import Image from 'next/image';

interface GalleryItem {
    id: number;
    title: string;
    couple_names: string;
    cover_image: string | null;
    slug: string;
}

interface OrbitingGalleryProps {
    items: GalleryItem[];
}

export default function OrbitingGallery({ items }: OrbitingGalleryProps) {
    const [rotation, setRotation] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();
    const [isDragging, setIsDragging] = useState(false);

    // If no items, show nothing
    if (!items || items.length === 0) return null;

    // Calculate positions based on rotation
    const radius = 300; // Radius of the orbit
    const cardWidth = 280;
    const cardHeight = 400;
    const count = items.length;
    const angleStep = 360 / count;

    const handlePan = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const delta = info.delta.x;
        setRotation(prev => prev + delta * 0.5);
    };

    // Auto-rotate when not dragging
    useEffect(() => {
        if (isDragging) return;

        const interval = setInterval(() => {
            setRotation(prev => prev - 0.2);
        }, 20);

        return () => clearInterval(interval);
    }, [isDragging]);

    return (
        <div className="relative h-[600px] w-full overflow-hidden flex items-center justify-center perspective-1000">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gold-900/10 to-transparent pointer-events-none" />

            <div
                ref={containerRef}
                className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{ perspective: '1000px' }}
            >
                <motion.div
                    className="absolute w-full h-full flex items-center justify-center"
                    onPan={(e, info) => handlePan(e, info)}
                    onPanStart={() => setIsDragging(true)}
                    onPanEnd={() => setIsDragging(false)}
                    style={{ touchAction: 'none' }}
                >
                    {items.map((item, index) => {
                        const angle = (angleStep * index + rotation) % 360;
                        const radian = (angle * Math.PI) / 180;

                        // 3D positioning
                        const x = Math.sin(radian) * radius;
                        const z = Math.cos(radian) * radius; // Depth
                        const scale = (z + radius * 2) / (radius * 3); // Scale based on depth
                        const opacity = (z + radius) / (radius * 2); // Opacity based on depth

                        // Z-index based on depth (closer items on top)
                        const zIndex = Math.round(z + radius);

                        return (
                            <motion.div
                                key={item.id}
                                className="absolute rounded-xl overflow-hidden shadow-2xl border border-gold-500/30 bg-black"
                                style={{
                                    width: cardWidth,
                                    height: cardHeight,
                                    x: x,
                                    zIndex: zIndex,
                                    scale: scale,
                                    opacity: Math.max(0.3, opacity),
                                    filter: `blur(${Math.max(0, (1 - scale) * 10)}px)`, // Blur distant items
                                }}
                            >
                                <div className="relative w-full h-full group">
                                    {item.cover_image ? (
                                        <Image
                                            src={item.cover_image}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                                            Brak zdjęcia
                                        </div>
                                    )}

                                    {/* Overlay Content */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 transition-opacity duration-300">
                                        <div className="absolute bottom-0 left-0 w-full p-6 text-center transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                            <h3 className="text-xl font-display text-gold-400 mb-1">{item.couple_names}</h3>
                                            <p className="text-sm text-zinc-400 font-sans tracking-wider uppercase text-[10px]">{item.title}</p>
                                        </div>
                                    </div>

                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>

            {/* Controls hint */}
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 text-gold-500/50 text-sm uppercase tracking-widest animate-pulse pointer-events-none">
                Przesuń aby obrócić
            </div>
        </div>
    );
}
