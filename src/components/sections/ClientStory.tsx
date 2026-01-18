'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ClientStoryProps {
    clientName: string;
    storyTitle: string;
    testimonial: string;
    mainImage: string;
    location?: string;
    date?: string;
    backgroundColor?: string;
}

export default function ClientStory({
    clientName,
    storyTitle,
    testimonial,
    mainImage,
    location,
    date,
    backgroundColor = 'var(--wedding-cream)',
}: ClientStoryProps) {
    return (
        <section className="editorial-spacing overflow-hidden" style={{ backgroundColor }}>
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid md:grid-cols-12 gap-12 items-center">

                    {/* Portrait Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 1.05 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="md:col-span-5 relative aspect-[3/4] overflow-hidden rounded-sm shadow-xl"
                    >
                        <Image
                            src={mainImage}
                            alt={clientName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 40vw"
                        />
                    </motion.div>

                    {/* Story Content */}
                    <div className="md:col-span-7 space-y-10 md:pl-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="space-y-4"
                        >
                            {(location || date) && (
                                <p className="text-xs uppercase tracking-[0.4em] text-[var(--wedding-taupe)] font-semibold">
                                    {location} {location && date && '•'} {date}
                                </p>
                            )}
                            <h2
                                className="text-4xl md:text-6xl text-[var(--wedding-brown)] leading-tight"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                            >
                                {storyTitle}
                            </h2>
                            <p
                                className="text-xl text-[var(--wedding-taupe)] font-serif italic"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                            >
                                — {clientName}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Large Quote Mark Decoration */}
                            <span
                                className="absolute -top-10 -left-6 text-9xl text-[var(--wedding-gold)] opacity-20 pointer-events-none select-none"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                            >
                                &ldquo;
                            </span>

                            <div
                                className="text-xl md:text-2xl leading-[1.8] text-gray-700 font-light italic"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                                dangerouslySetInnerHTML={{ __html: testimonial }}
                            />
                        </motion.div>

                        {/* Aesthetic Divider */}
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '100px' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-[1px] bg-[var(--wedding-gold)]"
                        />
                    </div>

                </div>
            </div>
        </section>
    );
}
