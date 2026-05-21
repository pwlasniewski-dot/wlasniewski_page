'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface LookbookCardProps {
    title: string;
    season: string;
    imageUrl: string;
    colors: string[];
    description?: string;
}

export default function LookbookCard({ title, season, imageUrl, colors, description }: LookbookCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="group"
        >
            {/* Large Image - Like Lookbook */}
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 shadow-xl mb-6">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Subtle overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-transparent" />
                
                {/* Season badge */}
                <div className="absolute top-6 right-6">
                    <div className="px-5 py-2.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
                        <span className="text-sm font-bold text-slate-900">{season}</span>
                    </div>
                </div>
            </div>

            {/* Content Below Image */}
            <div className="px-4">
                {/* Title with Hand-written Style */}
                <h3 className="text-3xl font-light text-center text-slate-800 mb-4 tracking-wide font-great-vibes">
                    {title}
                </h3>

                {/* Color Palette */}
                <div className="flex justify-center gap-3 mb-4">
                    {colors.map((color, idx) => (
                        <div
                            key={idx}
                            className="w-16 h-16 rounded-2xl shadow-md border-2 border-white ring-1 ring-slate-200"
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>

                {/* Description */}
                {description && (
                    <p className="text-center text-slate-600 text-sm leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </motion.div>
    );
}
