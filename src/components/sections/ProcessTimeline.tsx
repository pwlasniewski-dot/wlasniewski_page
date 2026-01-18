'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProcessStep {
    id: string;
    title: string;
    description: string;
    number: string;
}

interface ProcessTimelineProps {
    steps: ProcessStep[];
    title?: string;
    subtitle?: string;
    backgroundColor?: string;
}

export default function ProcessTimeline({
    steps,
    title,
    subtitle,
    backgroundColor = 'var(--wedding-cream)',
}: ProcessTimelineProps) {
    return (
        <section className="section-spacing overflow-hidden" style={{ backgroundColor }}>
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Header */}
                <div className="text-center mb-24 space-y-4">
                    {subtitle && (
                        <p className="text-sm uppercase tracking-[0.4em] text-[var(--wedding-taupe)] font-medium">
                            {subtitle}
                        </p>
                    )}
                    {title && (
                        <h2
                            className="text-4xl md:text-6xl text-[var(--wedding-brown)] italic"
                            style={{ fontFamily: 'var(--font-editorial-heading)', fontWeight: 400 }}
                        >
                            {title}
                        </h2>
                    )}
                    <div className="w-12 h-[1px] bg-[var(--wedding-gold)] mx-auto mt-6" />
                </div>

                {/* Vertical/Horizontal Timeline */}
                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-[1px] bg-[var(--wedding-gold)] opacity-20 hidden md:block" />

                    <div className="space-y-24 md:space-y-40">
                        {steps.map((step, idx) => {
                            const isEven = idx % 2 === 0;
                            return (
                                <div key={step.id} className="relative flex flex-col md:flex-row items-center gap-12 md:gap-0">

                                    {/* Content Side */}
                                    <motion.div
                                        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.8 }}
                                        className={`md:w-1/2 ${isEven ? 'md:pr-20 md:text-right' : 'md:pl-20 md:order-2'}`}
                                    >
                                        <h3
                                            className="text-2xl md:text-3xl text-[var(--wedding-brown)] mb-4"
                                            style={{ fontFamily: 'var(--font-editorial-heading)' }}
                                        >
                                            {step.title}
                                        </h3>
                                        <p
                                            className="text-lg text-[var(--wedding-brown)] leading-relaxed opacity-90"
                                            style={{ fontFamily: 'var(--font-editorial-body)' }}
                                        >
                                            {step.description}
                                        </p>
                                    </motion.div>

                                    {/* Marker in Middle */}
                                    <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            whileInView={{ scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ type: 'spring', damping: 10, stiffness: 100, delay: 0.3 }}
                                            className="w-16 h-16 rounded-full bg-[var(--wedding-brown)] text-[var(--wedding-cream)] flex items-center justify-center text-xl font-serif border-4 border-[var(--wedding-gold)]"
                                            style={{ fontFamily: 'var(--font-editorial-heading)' }}
                                        >
                                            {step.number}
                                        </motion.div>
                                    </div>

                                    {/* Empty Side (Spacer for MD+) */}
                                    <div className={`md:w-1/2 ${isEven ? 'md:order-2' : ''}`} />

                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </section>
    );
}
