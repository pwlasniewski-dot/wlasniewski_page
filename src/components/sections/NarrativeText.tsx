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
    return (
        <section className="narrative-spacing" style={{ backgroundColor }}>
            <div className={`container mx-auto px-6 ${columns === 1 ? 'max-w-3xl' : 'max-w-5xl'}`}>

                {/* Header */}
                {(title || subtitle) && (
                    <div className="text-center mb-16 space-y-4">
                        {subtitle && (
                            <p className="text-sm uppercase tracking-[0.4em] text-[var(--wedding-taupe)] font-medium">
                                {subtitle}
                            </p>
                        )}
                        {title && (
                            <h2
                                className="text-3xl md:text-5xl text-[var(--wedding-brown)]"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                            >
                                {title}
                            </h2>
                        )}
                        <div className="w-12 h-[1px] bg-[var(--wedding-gold)] mx-auto mt-6" />
                    </div>
                )}

                {/* Narrative Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
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
                        className={dropCap ? 'narrative-dropcap' : ''}
                        dangerouslySetInnerHTML={{ __html: content }}
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
