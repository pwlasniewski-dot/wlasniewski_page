"use client";

import React, { useState } from "react";
import PhotoAlbum from "react-photo-album"; // Optional, but if not installed we use CSS columns
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { motion } from "framer-motion";
import type { PortfolioImage } from "@/lib/portfolio";

// Plugins for Lightbox
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

export default function PortfolioGallery({ images }: { images: PortfolioImage[] }) {
    const [index, setIndex] = useState(-1);

    if (!images || images.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-500">Brak zdjęć w tej kategorii.</p>
            </div>
        );
    }

    // Convert to format expected by Lightbox
    const slides = images.map((img) => ({
        src: img.src,
        width: img.width,
        height: img.height,
        alt: img.alt,
    }));

    return (
        <>
            {/* Masonry Grid using Tailwind CSS Columns */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                {images.map((image, i) => (
                    <motion.div
                        key={image.src}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="break-inside-avoid"
                    >
                        <div
                            className="group relative overflow-hidden rounded-xl bg-zinc-900 cursor-pointer"
                            onClick={() => setIndex(i)}
                        >
                            <img
                                src={image.src}
                                alt={image.alt || "Portfolio image"}
                                className="w-full h-auto transform transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

                            {/* Icon */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Lightbox */}
            <Lightbox
                index={index}
                slides={slides}
                open={index >= 0}
                close={() => setIndex(-1)}
                plugins={[Zoom, Thumbnails]}
                animation={{ fade: 300 }}
                carousel={{ padding: 0 }}
                styles={{ container: { backgroundColor: "rgba(0, 0, 0, .95)" } }}
            />
        </>
    );
}
