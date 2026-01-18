'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface MagazineLayoutProps {
    title: string;
    subtitle?: string;
    content?: string;
    mainImage: string;
    secondaryImage?: string;
    backgroundColor?: string;
    layout?: 'left' | 'right';
}

export default function MagazineLayout({
    title,
    subtitle,
    content,
    mainImage,
    secondaryImage,
    backgroundColor = 'var(--wedding-cream)',
    layout = 'left',
}: MagazineLayoutProps) {
    const isMainLeft = layout === 'left';

    return (
        <section
            className="editorial-spacing overflow-hidden"
            style={{ backgroundColor }}
        >
            <div className="container mx-auto px-6 max-w-7xl">
                <div className={`flex flex-col md:flex-row items-center gap-16 ${!isMainLeft ? 'md:flex-row-reverse' : ''}`}>

                    {/* Visual Composition */}
                    <div className="md:w-3/5 relative">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative z-10 aspect-[3/4] md:aspect-[4/5] overflow-hidden rounded-sm gold-glow"
                        >
                            <Image
                                src={mainImage}
                                alt={title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 60vw"
                            />
                        </motion.div>

                        {secondaryImage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: isMainLeft ? -50 : 50 }}
                                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`absolute bottom-[-10%] ${isMainLeft ? 'right-[-10%]' : 'left-[-10%]'} z-20 w-1/2 aspect-[4/5] overflow-hidden rounded-sm border-8 border-[var(--wedding-cream)] shadow-2xl`}
                            >
                                <Image
                                    src={secondaryImage}
                                    alt={`${title} - detail`}
                                    fill
                                    className="object-cover"
                                    sizes="25vw"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Text Composition */}
                    <div className="md:w-2/5 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, x: isMainLeft ? 30 : -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            {subtitle && (
                                <p className="text-sm uppercase tracking-[0.3em] text-[var(--wedding-taupe)] font-medium mb-4">
                                    {subtitle}
                                </p>
                            )}
                            <h2
                                className="text-5xl md:text-7xl leading-[1.1] text-[var(--wedding-brown)] mb-6"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                            >
                                {title}
                            </h2>
                            <div className="w-20 h-[1px] bg-[var(--wedding-gold)] mb-8" />

                            {content && (
                                <div
                                    className="text-lg leading-relaxed text-gray-700/90 space-y-4"
                                    style={{ fontFamily: 'var(--font-editorial-body)' }}
                                    dangerouslySetInnerHTML={{ __html: content }}
                                />
                            )}
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
