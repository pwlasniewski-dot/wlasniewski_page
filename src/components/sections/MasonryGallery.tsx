'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface MasonryGalleryProps {
    images: string[];
    title?: string;
    subtitle?: string;
    columns?: 2 | 3 | 4;
}

function getImageAlt(url: string, galleryTitle?: string, index?: number): string {
    try {
        const filename = decodeURIComponent(url.split('/').pop() || '').split('.')[0];
        const descriptive = filename.replace(/^\d+-/, '').replace(/-/g, ' ').trim();
        if (descriptive.length > 5) return descriptive;
    } catch {}
    return `${galleryTitle || 'Fotografia'} — zdjęcie ${(index || 0) + 1}`;
}

export default function MasonryGallery({
    images,
    title,
    subtitle,
    columns = 3,
}: MasonryGalleryProps) {
    if (!images || images.length === 0) return null;

    // Split images into columns
    const validImages = images.filter(img => img && img.trim() !== '');
    if (validImages.length === 0) return null;

    // Split images into columns
    const columnsData: string[][] = Array.from({ length: columns }, () => []);
    validImages.forEach((img, idx) => {
        columnsData[idx % columns].push(img);
    });

    const gridColsClass = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }[columns];

    return (
        <section className="section-spacing bg-white">
            <div className="container mx-auto px-6 max-w-full">
                {(title || subtitle) && (
                    <div className="text-center mb-16 space-y-4">
                        {subtitle && (
                            <p className="text-sm uppercase tracking-[0.4em] text-[var(--wedding-taupe)] font-medium">
                                {subtitle}
                            </p>
                        )}
                        {title && (
                            <h2
                                className="text-4xl md:text-5xl text-[var(--wedding-brown)]"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                            >
                                {title}
                            </h2>
                        )}
                        <div className="w-12 h-[1px] bg-[var(--wedding-gold)] mx-auto mt-6" />
                    </div>
                )}

                <div className={`grid ${gridColsClass} gap-6`}>
                    {columnsData.map((column, colIdx) => (
                        <div key={colIdx} className="flex flex-col gap-6">
                            {column.map((img, imgIdx) => (
                                <motion.div
                                    key={`${colIdx}-${imgIdx}`}
                                    initial={{ scale: 0.95 }}
                                    whileInView={{ scale: 1 }}
                                    viewport={{ once: true, margin: "-50px" }}
                                    transition={{
                                        duration: 0.6,
                                        delay: (imgIdx * 0.1) + (colIdx * 0.1)
                                    }}
                                    className="relative overflow-hidden rounded-sm group cursor-pointer"
                                >
                                    <Image
                                        src={img}
                                        alt={getImageAlt(img, title, imgIdx)}
                                        width={800}
                                        height={1200}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </motion.div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
