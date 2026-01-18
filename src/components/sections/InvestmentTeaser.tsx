'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface PricingPackage {
    id: string;
    name: string;
    price: string;
    features: string[];
    isPopular?: boolean;
}

interface InvestmentTeaserProps {
    packages: PricingPackage[];
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
}

export default function InvestmentTeaser({
    packages,
    title,
    subtitle,
    buttonText = 'Zobacz pełną ofertę',
    buttonLink = '/oferta',
}: InvestmentTeaserProps) {
    return (
        <section className="section-spacing bg-white">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Header */}
                <div className="text-center mb-20 space-y-4">
                    {subtitle && (
                        <p className="text-sm uppercase tracking-[0.4em] text-[var(--wedding-taupe)] font-medium">
                            {subtitle}
                        </p>
                    )}
                    {title && (
                        <h2
                            className="text-4xl md:text-5xl text-[var(--wedding-brown)]"
                            style={{ fontFamily: 'var(--font-editorial-heading)' }}
                        >
                            {title}
                        </h2>
                    )}
                    <div className="w-12 h-[1px] bg-[var(--wedding-gold)] mx-auto mt-6" />
                </div>

                {/* Packages Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-16">
                    {packages.map((pkg, idx) => (
                        <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: idx * 0.1 }}
                            className={`p-10 border ${pkg.isPopular ? 'border-[var(--wedding-gold)] bg-[var(--wedding-cream)] shadow-xl relative scale-105 z-10' : 'border-gray-100 bg-white'} flex flex-col items-center text-center`}
                        >
                            {pkg.isPopular && (
                                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--wedding-gold)] text-white text-[10px] uppercase tracking-widest px-4 py-1 font-bold">
                                    Najczęściej wybierany
                                </span>
                            )}

                            <h3
                                className="text-2xl text-[var(--wedding-brown)] mb-4"
                                style={{ fontFamily: 'var(--font-editorial-heading)' }}
                            >
                                {pkg.name}
                            </h3>

                            <div className="mb-8">
                                <span className="text-xs uppercase tracking-widest text-gray-500">zaczyna się od</span>
                                <p
                                    className="text-4xl font-serif text-[var(--wedding-gold)]"
                                    style={{ fontFamily: 'var(--font-editorial-heading)' }}
                                >
                                    {pkg.price}
                                </p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-1">
                                {pkg.features.map((feature, fIdx) => (
                                    <li
                                        key={fIdx}
                                        className="text-gray-600 text-sm font-light tracking-wide"
                                        style={{ fontFamily: 'var(--font-editorial-body)' }}
                                    >
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="text-center">
                    <Link href={buttonLink}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                            className="btn-premium"
                        >
                            {buttonText}
                        </motion.button>
                    </Link>
                </div>

            </div>
        </section>
    );
}
