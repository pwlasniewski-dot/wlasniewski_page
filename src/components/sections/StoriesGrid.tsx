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
        <section className="py-24 px-4 bg-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    {subtitle && (
                        <span className="text-[var(--wedding-taupe)] text-xs font-medium uppercase tracking-[0.3em] block mb-4">
                            {subtitle}
                        </span>
                    )}
                    {title && (
                        demoteTitle ? (
                            <p className="text-4xl md:text-6xl text-[var(--wedding-brown)] italic" style={{ fontFamily: 'var(--font-editorial-heading)', fontWeight: 400 }}>
                                {title}
                            </p>
                        ) : (
                            <h2 className="text-4xl md:text-6xl text-[var(--wedding-brown)] italic" style={{ fontFamily: 'var(--font-editorial-heading)', fontWeight: 400 }}>
                                {title}
                            </h2>
                        )
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                    {items.map((item, index) => (
                        <Link href={item.link} key={item.id} className="group block" target="_blank" rel="noopener noreferrer">
                            <div className="relative mb-6">
                                {/* Shadow Effect - Light gray shadow */}
                                <div className="absolute top-4 left-4 w-full h-full bg-zinc-100 border border-zinc-200 -z-10 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />

                                <div className="aspect-[3/4] overflow-hidden bg-zinc-100 relative border border-zinc-200">
                                    {item.image ? (
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
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

                            <div className="space-y-4 text-center md:text-left">
                                {item.category && (
                                    <span className="text-[10px] text-[var(--wedding-gold)] font-medium uppercase tracking-widest">
                                        {item.category}
                                    </span>
                                )}
                                <h3 className="text-2xl text-[var(--wedding-brown)] italic group-hover:text-[var(--wedding-gold)] transition-colors" style={{ fontFamily: 'var(--font-editorial-heading)', fontWeight: 400 }}>
                                    {item.title}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-[var(--wedding-taupe)] group-hover:text-[var(--wedding-brown)] transition-colors mt-2" style={{ fontFamily: 'var(--font-editorial-body)' }}>
                                    <span>Zobacz historię</span>
                                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
