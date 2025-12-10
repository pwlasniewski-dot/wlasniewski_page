"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import type { PortfolioSession } from "@/lib/portfolio";

export default function SessionGrid({ sessions }: { sessions: PortfolioSession[] }) {
    const [currentSession, setCurrentSession] = useState<PortfolioSession | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const openSession = (session: PortfolioSession) => {
        setCurrentSession(session);
        setLightboxOpen(true);
    };

    if (!sessions || sessions.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-zinc-500 font-sans">Brak sesji w tej kategorii.</p>
            </div>
        );
    }

    // Disable sparse mode to show session cards
    const isSparseCategory = false;

    if (isSparseCategory) {
        // ... (code omitted for brevity, but effectively disabled)
        return null;
    }

    // \"Session Card Mode\": Premium large cards
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {sessions.map((session, i) => (
                    <motion.div
                        key={session.slug}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: i * 0.15 }}
                    >
                        <a
                            href={`/portfolio/${session.category}/${session.slug}`}
                            className="group relative block overflow-hidden bg-black cursor-pointer transition-all duration-700 hover:scale-[1.02]"
                        >
                            {/* Cover Image with Aspect Ratio */}
                            <div className="relative w-full aspect-[4/3] overflow-hidden">
                                <img
                                    src={session.coverImage || session.photos[0]?.src}
                                    alt={session.title}
                                    className="w-full h-full object-cover transform transition-all duration-[2s] ease-out group-hover:scale-110 image-warm"
                                    loading="lazy"
                                />

                                {/* Gradient Overlay - Only from bottom */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-100 transition-opacity duration-700" />

                                {/* Content Overlay - Always visible at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-8 transform transition-all duration-700">
                                    {/* Gold accent line */}
                                    <div className="w-16 h-0.5 bg-gold-400 mb-4 transform origin-left transition-all duration-700 group-hover:w-24" />

                                    <h3 className="text-3xl md:text-4xl font-bold text-white mb-3 font-display tracking-tight transform transition-all duration-500 group-hover:text-gold-400">
                                        {session.title}
                                    </h3>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-zinc-400 text-xs font-sans tracking-widest uppercase">
                                            <svg className="w-4 h-4 mr-2 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {session.imageCount} zdjęć
                                        </div>

                                        <span className="text-gold-400 text-xs font-bold tracking-widest uppercase flex items-center opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-700">
                                            Zobacz więcej
                                            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>

                                {/* Center Hover Icon */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-700 transform scale-75 group-hover:scale-100">
                                    <div className="bg-gold-400/95 backdrop-blur-md p-5 rounded-full text-black shadow-2xl shadow-gold-400/40 ring-4 ring-white/20">
                                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </motion.div>
                ))}
            </div>
        </>
    );
}
