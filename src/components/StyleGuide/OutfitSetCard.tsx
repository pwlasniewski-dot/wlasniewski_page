'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, MapPin, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getSeasonLabel } from '@/lib/styleGuideSeason';

interface OutfitSetCardProps {
    outfit: {
        id: number;
        title: string;
        slug: string;
        description?: string | null;
        category?: string | null;
        group_size?: number | null;
        age_group?: string | null;
        season?: string | null;
        location_type?: string | null;
        example_images?: any;
        palette_name?: string;
        palette_colors?: any;
    };
    showLink?: boolean;
}

export default function OutfitSetCard({ outfit, showLink = true }: OutfitSetCardProps) {
    const exampleImages = Array.isArray(outfit.example_images) 
        ? outfit.example_images 
        : outfit.example_images 
        ? JSON.parse(outfit.example_images as any)
        : [];
    
    const firstImage = exampleImages[0];
    const paletteColors = Array.isArray(outfit.palette_colors) 
        ? outfit.palette_colors 
        : outfit.palette_colors
        ? JSON.parse(outfit.palette_colors as any)
        : [];
    const seasonLabel = getSeasonLabel(outfit.season);

    const content = (
        <div className="h-full flex flex-col">
            {/* Image Section with Beautiful Overlay */}
            <div className="relative h-64 bg-gradient-to-br from-amber-100 via-rose-50 to-pink-100 overflow-hidden rounded-t-3xl">
                {firstImage ? (
                    <>
                        <Image
                            src={firstImage}
                            alt={outfit.title}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        {/* Gradient overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
                ) : (
                    // Placeholder with icon if no image
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-amber-400/30" />
                    </div>
                )}
                
                {/* Category Badge - Beautiful Pill */}
                {outfit.category && (
                    <div className="absolute top-4 right-4">
                        <span className="px-4 py-2 bg-white/95 backdrop-blur-sm text-slate-900 text-xs font-bold rounded-full shadow-lg border-2 border-amber-200">
                            {outfit.category}
                        </span>
                    </div>
                )}

                {/* Color Palette Preview - At Bottom of Image */}
                {paletteColors.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                {paletteColors.slice(0, 4).map((color: any, idx: number) => (
                                    <div
                                        key={idx}
                                        className="w-10 h-10 rounded-lg shadow-lg border-2 border-white/80 ring-1 ring-black/10"
                                        style={{ backgroundColor: color.hex }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                            {outfit.palette_name && (
                                <span className="text-xs text-white font-semibold drop-shadow-lg">
                                    {outfit.palette_name}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Content Section - Light Background with Dark Text */}
            <div className="flex-1 p-7 flex flex-col bg-white">
                <h3 className="text-2xl font-bold text-slate-900 mb-3 line-clamp-2 group-hover:text-amber-900 transition-colors">
                    {outfit.title}
                </h3>

                {outfit.description && (
                    <p className="text-base text-slate-600 mb-5 line-clamp-3 flex-1 leading-relaxed">
                        {outfit.description}
                    </p>
                )}

                {/* Meta Info - Beautiful Icons with Light Style */}
                <div className="space-y-3 mb-5">
                    {outfit.group_size && (
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Users className="w-4 h-4 text-amber-700" />
                            </div>
                            <span className="font-semibold">{outfit.group_size} osób</span>
                        </div>
                    )}
                    {outfit.location_type && (
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-rose-700" />
                            </div>
                            <span className="font-semibold capitalize">{outfit.location_type}</span>
                        </div>
                    )}
                    {seasonLabel && (
                        <div className="flex items-center gap-3 text-sm text-slate-700">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-emerald-700" />
                            </div>
                            <span className="font-semibold capitalize">{seasonLabel}</span>
                        </div>
                    )}
                </div>

                {/* Link/CTA */}
                {showLink && (
                    <div className="mt-auto pt-4 border-t-2 border-slate-100">
                        <div className="flex items-center justify-between text-amber-700 font-bold group-hover:text-amber-900 transition-colors">
                            <span>Zobacz szczegóły</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    if (!showLink) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-slate-100 hover:border-amber-300 cursor-pointer"
            >
                {content}
            </motion.div>
        );
    }

    return (
        <Link href={`/jak-sie-ubrac/zestawy/${outfit.slug}`} className="block h-full">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-slate-100 hover:border-amber-300 h-full"
            >
                {content}
            </motion.div>
        </Link>
    );
}
