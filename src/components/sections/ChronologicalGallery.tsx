import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface GalleryItem {
    id: string;
    image: string;
    description?: string;
    spanCols?: number; // Optional for masonry-like variety
}

interface ChronologicalGalleryProps {
    items: GalleryItem[];
    layout?: 'grid' | 'list';
    title?: string; // Optional context
}

export default function ChronologicalGallery({
    items,
    layout = 'grid',
    title
}: ChronologicalGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

    // Keyboard navigation
    useEffect(() => {
        if (lightboxIndex === null) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setLightboxIndex(null);
            } else if (e.key === 'ArrowLeft') {
                setLightboxIndex((prev) => (prev === null || prev === 0 ? items.length - 1 : prev - 1));
            } else if (e.key === 'ArrowRight') {
                setLightboxIndex((prev) => (prev === null || prev === items.length - 1 ? 0 : prev + 1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lightboxIndex, items.length]);

    if (!items || items.length === 0) {
        return (
            <div className="p-12 text-center border-2 border-dashed border-red-300 bg-red-50 text-red-800">
                [DEBUG] Chronological Gallery Rendered (No Items Found)
            </div>
        );
    }

    // List Layout (Column)
    if (layout === 'list') {
        return (
            <section className="bg-white py-16 md:py-24">
                <div className="max-w-5xl mx-auto px-4">
                    {(title || layout === 'list') && (
                        <div className="text-center mb-16">
                            {title && (
                                <h2 className="text-4xl md:text-6xl text-[var(--wedding-brown)] italic mb-6" style={{ fontFamily: 'var(--font-editorial-heading)', fontWeight: 400 }}>
                                    {title}
                                </h2>
                            )}
                            <div className="w-12 h-[1px] bg-[var(--wedding-gold)] mx-auto" />
                        </div>
                    )}

                    {items.map((item, index) => (
                        <motion.div
                            key={item.id || index}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="mb-4 md:mb-8 last:mb-0"
                        >
                            <div
                                className="relative w-full shadow-lg cursor-zoom-in"
                                onClick={() => setLightboxIndex(index)}
                            >
                                {item.image ? (
                                    /* using standard img to preserve natural aspect ratio for mixed orientation (vertical/horizontal) */
                                    <img
                                        src={item.image}
                                        alt={item.description || `Photo ${index + 1}`}
                                        className="w-full h-auto block rounded-sm"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full aspect-video bg-zinc-100" />
                                )}
                            </div>
                            {item.description && (
                                <p className="text-[var(--wedding-taupe)] font-light text-base italic text-center max-w-2xl mx-auto mt-6" style={{ fontFamily: 'var(--font-editorial-body)' }}>
                                    {item.description}
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            </section>
        );
    }

    // Grid Layout (Default)
    return (
        <>
            <section className="bg-white py-12">
                <div className="max-w-[1920px] mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2">
                        {items.map((item, index) => (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ once: true, margin: "0px" }}
                                transition={{ duration: 0.3 }}
                                className="relative aspect-[3/2] group overflow-hidden bg-zinc-100 cursor-zoom-in"
                                onClick={() => setLightboxIndex(index)}
                            >
                                {item.image ? (
                                    <Image
                                        src={item.image}
                                        alt={item.description || `Photo ${index + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        loading={index < 6 ? "eager" : "lazy"}
                                        priority={index < 3}
                                        quality={85}
                                        placeholder="blur"
                                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg=="
                                    />
                                ) : (
                                    <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-xs">NO IMG</div>
                                )}
                                {/* Hover overlay with icon hint */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-3">
                                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                        onClick={() => setLightboxIndex(null)}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setLightboxIndex(null)}
                            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Previous button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev === null || prev === 0 ? items.length - 1 : prev - 1));
                            }}
                            className="absolute left-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                            aria-label="Previous"
                        >
                            <ChevronLeft className="w-8 h-8" />
                        </button>

                        {/* Next button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLightboxIndex((prev) => (prev === null || prev === items.length - 1 ? 0 : prev + 1));
                            }}
                            className="absolute right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
                            aria-label="Next"
                        >
                            <ChevronRight className="w-8 h-8" />
                        </button>

                        {/* Image */}
                        <motion.div
                            key={lightboxIndex}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={items[lightboxIndex].image}
                                alt={items[lightboxIndex].description || `Photo ${lightboxIndex + 1}`}
                                className="max-w-full max-h-full object-contain"
                            />

                            {/* Description */}
                            {items[lightboxIndex].description && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white text-center">
                                    <p className="text-lg italic">
                                        {items[lightboxIndex].description}
                                    </p>
                                </div>
                            )}

                            {/* Counter */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                                {lightboxIndex + 1} / {items.length}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
