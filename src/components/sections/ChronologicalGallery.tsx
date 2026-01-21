import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Maximize2, MoveRight } from 'lucide-react';

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
    // console.log('[ChronologicalGallery] Rendering with items:', items?.length);
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
                            <div className="relative w-full shadow-lg">
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
        <section className="bg-white py-12">
            <div className="max-w-[1920px] mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id || index}
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: index % 3 * 0.1 }}
                            className="relative aspect-[3/2] group overflow-hidden bg-zinc-100 cursor-zoom-in"
                        >
                            {item.image ? (
                                <Image
                                    src={item.image}
                                    alt={item.description || `Photo ${index + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-200 flex items-center justify-center text-zinc-400 text-xs">NO IMG</div>
                            )}
                            {/* Simplified interaction for now - just hover effect */}
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors pointer-events-none" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
