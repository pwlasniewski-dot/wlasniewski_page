'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';

interface TipCardProps {
    tip: {
        id: number | string;
        title: string;
        content: string;
        image?: string;
        imageAlt?: string;
        tip_type?: string | null;
        icon?: string | null;
        is_featured?: boolean;
    };
    compact?: boolean;
    imagePriority?: boolean;
}

export default function TipCard({ tip, compact = false, imagePriority = false }: TipCardProps) {
    // Dynamically get icon from lucide-react
    const IconComponent = tip.icon && (Icons as any)[tip.icon] 
        ? (Icons as any)[tip.icon] 
        : Icons.Lightbulb;

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all"
            >
                <div className="w-8 h-8 flex-shrink-0 bg-slate-50 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm mb-1">
                        {tip.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2">
                        {tip.content}
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="overflow-hidden bg-white border border-slate-200 rounded-2xl hover:shadow-lg transition-all group"
        >
            {tip.image && (
                <div className="relative aspect-[16/10] overflow-hidden bg-[#f7eee3]">
                    <Image
                        src={tip.image}
                        alt={tip.imageAlt || tip.title}
                        fill
                        priority={imagePriority}
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-contain"
                    />
                </div>
            )}
            <div className="flex items-start gap-4 p-6 sm:p-7">
                {/* Small subtle icon */}
                {!tip.image && (
                    <div className="w-10 h-10 flex-shrink-0 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                        <IconComponent className="w-5 h-5 text-slate-400" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                        {tip.title}
                    </h3>
                    <p className="text-base text-slate-700 leading-relaxed">
                        {tip.content}
                    </p>
                    {tip.tip_type && (
                        <span className="inline-block mt-3 text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                            {tip.tip_type}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
