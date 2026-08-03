import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export interface StoryItem {
    id: string;
    image: string;
    title: string;
    link: string;
    category?: string; // e.g., "WESELE", "SESJA"
}

interface StoriesGridProps {
    title?: string;
    subtitle?: string;
    items: StoryItem[];
}

export default function StoriesGrid({
    title,
    subtitle,
    items
}: StoriesGridProps) {
    if (!items || items.length === 0) return null;

    const plainTitle = (title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const demoteTitle = plainTitle.length > 110 || plainTitle.split(' ').filter(Boolean).length > 16;

    return (
        <section className="home-editorial-section bg-[#ebe4da] px-5 py-24 sm:px-8 md:py-32">
            <div className="mx-auto max-w-[1380px]">
                {/* Header */}
                <div className="mb-14 text-center md:mb-20">
                    {subtitle && (
                        <span className="mb-5 block text-[10px] font-bold uppercase tracking-[.32em] text-[#94733d] sm:text-xs">
                            {subtitle}
                        </span>
                    )}
                    {title && (
                        demoteTitle ? (
                            <p className="font-display text-5xl font-normal leading-none tracking-[-.035em] text-[#28221c] md:text-7xl">
                                {title}
                            </p>
                        ) : (
                            <h2 className="font-display text-5xl font-normal leading-none tracking-[-.035em] text-[#28221c] md:text-7xl">
                                {title}
                            </h2>
                        )
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3 lg:gap-y-20">
                    {items.map((item) => {
                        const href = item.link.replace(/^https?:\/\/(?:www\.)?wlasniewski\.pl/i, '') || '/';
                        return (
                        <Link href={href} key={item.id} className="group block">
                            <div className="relative mb-6">
                                {/* Shadow Effect - Light gray shadow */}
                                <div className="absolute left-4 top-4 -z-10 h-full w-full border border-[#cbbdab] bg-[#f6f1e9] transition-transform duration-500 group-hover:translate-x-1 group-hover:translate-y-1" />

                                <div className="relative aspect-[4/5] overflow-hidden border border-[#d2c6b6] bg-[#ded4c7]">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            unoptimized={item.image.startsWith('https://wlasniewski.pl/_next/image')}
                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-zinc-100 text-zinc-400">
                                            <span className="text-xs">NO IMAGE</span>
                                        </div>
                                    )}

                                    {/* Overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                                </div>
                            </div>

                            <div className="space-y-3 text-left">
                                {item.category && (
                                    <span className="text-[10px] font-bold uppercase tracking-[.24em] text-[#94733d]">
                                        {item.category}
                                    </span>
                                )}
                                <h3 className="font-display text-3xl font-normal leading-none text-[#28221c] transition-colors group-hover:text-[#94733d]">
                                    {item.title}
                                </h3>
                                <div className="mt-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-[#786b5d] transition-colors group-hover:text-[#28221c]">
                                    <span>Zobacz historię</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    )})}
                </div>
            </div>
        </section>
    );
}
