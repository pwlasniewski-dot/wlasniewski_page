// Masonry/Puzzle Gallery Component
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface MasonryGalleryProps {
    photos: Array<{
        url: string;
        alt?: string;
        caption?: string;
    }>;
    config?: {
        columns?: number;
        gap?: number;
    };
}

export default function MasonryGallery({ photos, config }: MasonryGalleryProps) {
    const { columns = 3, gap = 4 } = config || {};
    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

    if (photos.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                Brak zdjęć w galerii
            </div>
        );
    }

    return (
        <>
            <div
                className={`grid gap-${gap} masonry-gallery`}
                style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                }}
            >
                {photos.map((photo, index) => {
                    // Random height for masonry effect
                    const heights = ['h-64', 'h-80', 'h-96', 'h-72'];
                    const randomHeight = heights[index % heights.length];

                    return (
                        <div
                            key={index}
                            className={`relative ${randomHeight} rounded-xl overflow-hidden cursor-pointer group`}
                            onClick={() => setSelectedPhoto(index)}
                        >
                            <Image
                                src={photo.url}
                                alt={photo.alt || `Photo ${index + 1}`}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                            </div>
                            {photo.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-sm">{photo.caption}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Lightbox */}
            {selectedPhoto !== null && (
                <div
                    className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <button
                        onClick={() => setSelectedPhoto(null)}
                        className="absolute top-4 right-4 text-white hover:text-gold-400 transition-colors"
                    >
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
                        <Image
                            src={photos[selectedPhoto].url}
                            alt={photos[selectedPhoto].alt || `Photo ${selectedPhoto + 1}`}
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>
            )}

            <style jsx global>{`
                @media (max-width: 640px) {
                    .masonry-gallery {
                        grid-template-columns: repeat(1, 1fr) !important;
                    }
                }
                @media (min-width: 641px) and (max-width: 1024px) {
                    .masonry-gallery {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
            `}</style>
        </>
    );
}
