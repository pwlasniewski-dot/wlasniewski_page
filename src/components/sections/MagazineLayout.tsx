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
    const isPreoptimized = (source?: string) => Boolean(source?.startsWith('https://wlasniewski.pl/_next/image'));
    // The section already owns its H2. Headings pasted into the CMS body are
    // demoted visually/semantically without changing the stored admin content.
    const semanticContent = (content || '')
        .replace(/<h1(\s[^>]*)?>/gi, '<h3$1>')
        .replace(/<\/h1>/gi, '</h3>')
        .replace(/<h2(\s[^>]*)?>/gi, '<h3$1>')
        .replace(/<\/h2>/gi, '</h3>');

    return (
        <section
            className="home-editorial-section editorial-spacing overflow-hidden"
            style={{ backgroundColor }}
        >
            <div className="container mx-auto max-w-[1380px] px-5 sm:px-8">
                <div className={`flex flex-col items-center gap-14 lg:flex-row lg:gap-20 ${!isMainLeft ? 'lg:flex-row-reverse' : ''}`}>

                    {/* Visual Composition */}
                    <div className="relative mb-6 w-full lg:mb-0 lg:w-[56%]">
                        <motion.div
                            initial={{ y: 40 }}
                            whileInView={{ y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="relative z-10 ml-auto aspect-[4/5] w-[92%] overflow-hidden border border-[#d8cdbd] bg-[#e8dfd3] shadow-[0_35px_80px_-28px_rgba(54,44,34,.38)] sm:aspect-[5/6] lg:ml-0 lg:w-full"
                        >
                            {!mainImage ? (
                                <div className="w-full h-full bg-zinc-800" />
                            ) : (
                                <Image
                                    src={mainImage}
                                    alt={title}
                                    fill
                                    unoptimized={isPreoptimized(mainImage)}
                                    className="object-cover transition duration-[1600ms] hover:scale-[1.02]"
                                    sizes="(max-width: 768px) 100vw, 60vw"
                                />
                            )}
                        </motion.div>

                        {secondaryImage && (
                            <motion.div
                                initial={{ scale: 0.9, x: isMainLeft ? -50 : 50 }}
                                whileInView={{ scale: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`absolute bottom-[-7%] ${isMainLeft ? 'left-0 lg:left-auto lg:right-[-8%]' : 'right-0 lg:left-[-8%] lg:right-auto'} z-20 aspect-[4/5] w-[46%] overflow-hidden border-[6px] border-[#f3efe8] shadow-2xl sm:border-[10px]`}
                            >
                                <Image
                                    src={secondaryImage}
                                    alt={`${title} - detail`}
                                    fill
                                    unoptimized={isPreoptimized(secondaryImage)}
                                    className="object-cover"
                                    sizes="25vw"
                                />
                            </motion.div>
                        )}
                    </div>

                    {/* Text Composition */}
                    <div className="relative z-30 w-full lg:w-[44%]">
                        <motion.div
                            initial={{ x: isMainLeft ? 30 : -30 }}
                            whileInView={{ x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            {subtitle && (
                                <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.32em] text-[#94733d] sm:text-xs">
                                    {subtitle}
                                </p>
                            )}
                            <h2
                                className="mb-7 font-display text-[clamp(2.8rem,5vw,5.6rem)] font-normal leading-[.94] tracking-[-.04em] text-[#28221c]"
                                dangerouslySetInnerHTML={{ __html: title }}
                            />
                            <div className="mb-8 h-px w-20 bg-[#b08a4c]" />

                            {content && (
                                <div
                                    className="home-editorial-richtext"
                                    dangerouslySetInnerHTML={{ __html: semanticContent }}
                                />
                            )}
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    );
}
