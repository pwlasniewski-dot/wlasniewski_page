'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Sparkles } from 'lucide-react';
import { getSeasonLabel } from '@/lib/styleGuideSeason';

interface Color {
    name: string;
    hex: string;
    description?: string;
}

interface ColorPaletteCardProps {
    palette: {
        id: number;
        name: string;
        slug: string;
        description?: string | null;
        season?: string | null;
        location_type?: string | null;
        mood?: string | null;
        colors: Color[];
        example_images?: string[] | null;
    };
    onClick?: () => void;
}

export default function ColorPaletteCard({ palette, onClick }: ColorPaletteCardProps) {
    const colors = Array.isArray(palette.colors) ? palette.colors : [];
    const seasonLabel = getSeasonLabel(palette.season);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            onClick={onClick}
            className="group bg-white rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 border border-slate-200"
        >
            {/* Subtle Color Display */}
            <div className="h-40 flex items-center justify-center gap-3 relative overflow-hidden bg-gradient-to-br from-slate-50 to-white p-6">
                {colors.slice(0, 4).map((color, idx) => (
                    <div
                        key={idx}
                        className="relative group/circle"
                    >
                        <div
                            className="w-16 h-16 rounded-full shadow-md border-3 border-white transition-all duration-300 group-hover:scale-105 group-hover/circle:scale-110"
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                        />
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="p-7">
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Palette className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-1">
                            {palette.name}
                        </h3>
                        {palette.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                                {palette.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Meta Tags - Beautiful Pills */}
                <div className="flex flex-wrap gap-2 mb-5">
                    {seasonLabel && (
                        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                            {seasonLabel}
                        </span>
                    )}
                    {palette.location_type && (
                        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                            {palette.location_type}
                        </span>
                    )}
                    {palette.mood && (
                        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full capitalize">
                            {palette.mood}
                        </span>
                    )}
                </div>

                {/* Color Details - Elegant List */}
                <div className="space-y-2.5">
                    {colors.slice(0, 3).map((color, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                            <div
                                className="w-6 h-6 rounded-lg shadow-sm border-2 border-white flex-shrink-0"
                                style={{ backgroundColor: color.hex }}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate">{color.name}</p>
                                {color.description && (
                                    <p className="text-xs text-slate-500 truncate">{color.description}</p>
                                )}
                            </div>
                        </div>
                    ))}
                    {colors.length > 3 && (
                        <span className="text-xs text-slate-500">
                            + {colors.length - 3} więcej kolorów
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
