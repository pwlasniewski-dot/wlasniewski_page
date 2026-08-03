'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NarrativeTextProps {
    content: string;
    title?: string;
    subtitle?: string;
    backgroundColor?: string;
    columns?: 1 | 2;
    dropCap?: boolean;
    alignment?: 'left' | 'center' | 'right';
}

export default function NarrativeText({
    content,
    title,
    subtitle,
    backgroundColor = 'var(--wedding-cream)',
    columns = 1,
    dropCap = true,
    alignment = 'left',
}: NarrativeTextProps) {
    const plainTitle = (title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const demoteTitle = plainTitle.length > 110 || plainTitle.split(' ').filter(Boolean).length > 16;
    const semanticContent = (content || '')
        .replace(/<h1(\s[^>]*)?>/gi, '<h3$1>')
        .replace(/<\/h1>/gi, '</h3>')
        .replace(/<h2(\s[^>]*)?>/gi, '<h3$1>')
        .replace(/<\/h2>/gi, '</h3>');

    return (
        <section className="home-editorial-section narrative-spacing" style={{ backgroundColor }}>
            <div className={`container mx-auto px-5 sm:px-8 ${columns === 1 ? 'max-w-4xl' : 'max-w-6xl'}`}>

                {/* Header */}
                {(title || subtitle) && (
                    <div className="mb-14 space-y-4 text-center md:mb-20">
                        {subtitle && (
                            <p className="text-[10px] font-bold uppercase tracking-[.32em] text-[#94733d] sm:text-xs">
                                {subtitle}
                            </p>
                        )}
                        {title && (
                            demoteTitle ? (
                                <p
                                    className="font-display text-4xl font-normal leading-[.95] tracking-[-.035em] text-[#28221c] md:text-6xl"
                                >
                                    {title}
                                </p>
                            ) : (
                                <h2
                                    className="font-display text-4xl font-normal leading-[.95] tracking-[-.035em] text-[#28221c] md:text-6xl"
                                >
                                    {title}
                                </h2>
                            )
                        )}
                        <div className="mx-auto mt-7 h-px w-16 bg-[#b08a4c]" />
                    </div>
                )}

                {/* Narrative Content */}
                <motion.div
                    initial={{ y: 20 }}
                    whileInView={{ y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className={`prose prose-lg max-w-none prose-p:leading-[1.8] prose-p:text-gray-700/90 ${columns === 2 ? 'md:columns-2 md:gap-12' : ''
                        } ${alignment === 'center' ? 'text-center mx-auto' : alignment === 'right' ? 'text-right ml-auto' : 'text-left mr-auto'}`}
                    style={{
                        fontFamily: 'var(--font-editorial-body)',
                        // Simple dropcap logic would require splitting content, 
                        // but here we can use a CSS class if content starts with <p>
                    } as any}
                >
                    <div
                        className={`home-editorial-richtext ${dropCap ? 'narrative-dropcap' : ''}`}
                        dangerouslySetInnerHTML={{ __html: semanticContent }}
                    />
                </motion.div>

            </div>

            <style jsx global>{`
                .narrative-dropcap p:first-of-type::first-letter {
                    float: left;
                    font-family: var(--font-editorial-heading);
                    font-size: 4.5rem;
                    line-height: 1;
                    padding-top: 4px;
                    padding-right: 12px;
                    padding-left: 3px;
                    color: var(--wedding-taupe);
                }
            `}</style>
        </section>
    );
}
