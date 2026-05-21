'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getSeasonColor, getSeasonLabel } from '@/lib/styleGuideSeason';

interface OutfitItem {
    image_url: string;
    name: string;
    color_hex: string;
    category?: string;
    person?: string;
}

interface OutfitCollageCardProps {
    outfit: {
        id: number;
        title: string;
        slug?: string;
        description?: string | null;
        season?: string | null;
        location_type?: string | null;
        category?: string | null;
        outfit_details?: OutfitItem[] | any;
        palette?: { name?: string; colors?: any } | null;
    };
    seasonColor?: string;
    showSubtitle?: boolean;
}

export default function OutfitCollageCard({
    outfit,
    seasonColor,
    showSubtitle = true
}: OutfitCollageCardProps) {
    const items: OutfitItem[] = Array.isArray(outfit.outfit_details) ? outfit.outfit_details : [];
    const seasonLabel = getSeasonLabel(outfit.season);
    const titleColor = seasonColor 
        || getSeasonColor(outfit.season)
        || '#5A7A99';

    // Unikalne kolory ze wszystkich elementów (do paska próbek)
    const uniqueColors: string[] = [];
    items.forEach(item => {
        if (item.color_hex && !uniqueColors.includes(item.color_hex.toLowerCase())) {
            uniqueColors.push(item.color_hex.toLowerCase());
        }
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto py-12"
        >
            {/* Tytuł sezonu/outfitu - duży handwriting */}
            <h2
                className="text-center font-handwriting font-normal text-6xl md:text-8xl mb-10 tracking-wide"
                style={{ color: titleColor }}
            >
                {seasonLabel ? seasonLabel.toUpperCase() : outfit.title}
            </h2>

            {seasonLabel && outfit.title !== seasonLabel && (
                <p className="text-center text-sm tracking-[0.25em] text-slate-400 uppercase mb-8 -mt-6">
                    {outfit.title}
                </p>
            )}

            {/* Collage - elementy ubrań na białym tle */}
            {items.length > 0 ? (
                <div className="bg-white px-4 md:px-8 mb-8">
                    {/* Layout zależny od liczby items */}
                    {items.length === 1 && (
                        <div className="flex justify-center">
                            <CollageItem item={items[0]} size="large" />
                        </div>
                    )}
                    {items.length === 2 && (
                        <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-2xl mx-auto">
                            {items.map((item, idx) => <CollageItem key={idx} item={item} size="large" />)}
                        </div>
                    )}
                    {items.length === 3 && (
                        <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
                            {items.map((item, idx) => <CollageItem key={idx} item={item} size="medium" />)}
                        </div>
                    )}
                    {items.length === 4 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
                            {items.map((item, idx) => <CollageItem key={idx} item={item} size="medium" />)}
                        </div>
                    )}
                    {items.length >= 5 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
                            {items.map((item, idx) => <CollageItem key={idx} item={item} size="medium" />)}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-slate-50 py-16 px-6 text-center mb-8 max-w-2xl mx-auto rounded">
                    <p className="text-slate-400 text-sm">Brak elementów w tym zestawie</p>
                </div>
            )}

            {/* Pasek próbek kolorów - kwadraty jak w inspiracji */}
            {uniqueColors.length > 0 && (
                <div className="flex justify-center gap-3 md:gap-4 mb-8">
                    {uniqueColors.slice(0, 6).map((color, idx) => (
                        <div
                            key={idx}
                            className="w-14 h-14 md:w-16 md:h-16 shadow-sm"
                            style={{ backgroundColor: color }}
                            title={color}
                        />
                    ))}
                </div>
            )}

            {/* Podtytuł handwriting */}
            {showSubtitle && (
                <p
                    className="text-center font-handwriting text-3xl md:text-4xl mb-2"
                    style={{ color: '#5A7A99' }}
                >
                    W co się ubrać na sesję?
                </p>
            )}

            {/* Opcjonalny opis */}
            {outfit.description && (
                <p className="text-center text-sm md:text-base text-slate-500 max-w-xl mx-auto mt-4 font-light leading-relaxed">
                    {outfit.description}
                </p>
            )}
        </motion.div>
    );
}

function CollageItem({ item, size }: { item: OutfitItem; size: 'large' | 'medium' }) {
    const aspectClass = size === 'large' ? 'aspect-[3/4]' : 'aspect-square';
    return (
        <div className="flex flex-col items-center">
            <div className={`${aspectClass} w-full bg-white relative overflow-hidden`}>
                {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: item.color_hex || '#f0f0f0' }}
                    >
                        <span className="text-xs text-white/80 px-2 text-center">{item.name}</span>
                    </div>
                )}
            </div>
            {(item.name || item.person) && (
                <div className="mt-2 text-center">
                    {item.name && (
                        <p className="text-xs md:text-sm text-slate-600 font-light tracking-wide">
                            {item.name}
                        </p>
                    )}
                    {item.person && (
                        <p className="text-[10px] text-slate-400 tracking-widest uppercase mt-0.5">
                            {item.person}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
