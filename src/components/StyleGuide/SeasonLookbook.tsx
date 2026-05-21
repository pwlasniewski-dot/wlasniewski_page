'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface SeasonLookbookProps {
    season: string;          // "WIOSNA", "LATO" etc.
    seasonColor: string;     // Color for season title (e.g. dusty rose, sage green)
    imageUrl: string;
    colors: string[];        // 4 colors
    reverse?: boolean;
}

export default function SeasonLookbook({ 
    season, 
    seasonColor, 
    imageUrl, 
    colors,
    reverse = false 
}: SeasonLookbookProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto py-16"
        >
            {/* Season Title - Big Handwritten */}
            <h2 
                className="text-center text-7xl md:text-9xl font-handwriting font-normal mb-12 tracking-wider"
                style={{ color: seasonColor }}
            >
                {season}
            </h2>

            {/* Flat-lay Image */}
            <div className="relative aspect-[4/3] mb-8 px-4">
                <Image
                    src={imageUrl}
                    alt={`Stylizacja na sesję - ${season}`}
                    fill
                    className="object-contain"
                />
            </div>

            {/* Color Swatches - Squares like inspiration */}
            <div className="flex justify-center gap-4 md:gap-6 mb-8">
                {colors.map((color, idx) => (
                    <div
                        key={idx}
                        className="w-16 h-16 md:w-20 md:h-20 shadow-sm"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>

            {/* Handwritten subtitle */}
            <p 
                className="text-center text-3xl md:text-4xl font-handwriting"
                style={{ color: '#5A7A99' }}
            >
                W co się ubrać na sesję?
            </p>
        </motion.div>
    );
}
