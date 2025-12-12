"use client";

import React from "react";
import Link from "next/link";
import ParallaxSection from "@/components/ParallaxSection";
import { motion } from "framer-motion";

interface OMnieContentProps {
    pageData: any;
    parallaxSections: any[];
}

export default function OMnieContent({ pageData, parallaxSections }: OMnieContentProps) {
    return (
        <main className="min-h-screen bg-black text-white">
            {/* Hero Parallax */}
            {parallaxSections.length > 0 && parallaxSections[0]?.image && (
                <ParallaxSection
                    image={parallaxSections[0].image}
                    title={parallaxSections[0].title || "O mnie"}
                    subtitle={parallaxSections[0].subtitle || "Fotograf z pasją"}
                    height="min-h-[75vh]"
                />
            )}

            {!parallaxSections.length && pageData?.hero_image && (
                <ParallaxSection
                    image={pageData.hero_image}
                    title={pageData.title || "O mnie"}
                    subtitle={pageData.hero_subtitle || "Fotograf z pasją"}
                    height="min-h-[75vh]"
                />
            )}

            <div className="mx-auto max-w-5xl px-6 py-20">
                <div className="mb-12">
                    <Link href="/" className="text-zinc-400 hover:text-gold-400">← Powrót</Link>
                </div>

                {/* Main Content */}
                {pageData?.content && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="prose prose-lg prose-invert max-w-none mb-20"
                    >
                        <div className="w-20 h-px bg-gold-400 mb-12" />
                        <div dangerouslySetInnerHTML={{ __html: pageData.content }} className="text-zinc-300" />
                    </motion.div>
                )}

                {/* Photo + Text Section */}
                {pageData?.about_photo && pageData?.about_text_side && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="grid md:grid-cols-2 gap-12 mb-20"
                    >
                        {/* Text - Left */}
                        <div className="flex flex-col justify-center">
                            <div className="prose prose-invert">
                                <div dangerouslySetInnerHTML={{ __html: pageData.about_text_side }} className="text-zinc-300 text-lg leading-relaxed" />
                            </div>
                        </div>

                        {/* Photo - Right */}
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-white/10">
                            <img
                                src={pageData.about_photo}
                                alt="O mnie"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </motion.div>
                )}

                {/* Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
                >
                    {[
                        { number: "500+", label: "Sesji zdjęciowych" },
                        { number: "10+", label: "Lat doświadczenia" },
                        { number: "100%", label: "Zadowolonych klientów" },
                        { number: "∞", label: "Pięknych wspomnień" },
                    ].map((stat, index) => (
                        <div
                            key={index}
                            className="text-center p-6 bg-zinc-900 border border-white/5 hover:border-gold-400/30 transition-colors rounded-lg"
                        >
                            <div className="text-4xl font-bold text-gold-400 mb-2 font-display">
                                {stat.number}
                            </div>
                            <div className="text-sm text-zinc-400 font-sans tracking-wide uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </motion.div>

                {/* Additional Parallax Sections */}
                {parallaxSections.slice(1).map((section, index) => (
                    <div key={section.id} className="mb-24 -mx-6">
                        <ParallaxSection
                            image={section.image}
                            title={section.title}
                            subtitle={section.subtitle}
                            height="min-h-[60vh]"
                        />
                    </div>
                ))}

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-12 rounded-lg"
                >
                    <h2 className="text-4xl font-bold mb-4">Stwórzmy coś razem</h2>
                    <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
                        Skontaktuj się, aby porozmawiać o Twojej sesji
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/rezerwacja"
                            className="inline-flex items-center gap-3 bg-gold-400 hover:bg-gold-500 text-black font-bold px-8 py-4 rounded-full text-lg"
                        >
                            Zarezerwuj sesję →
                        </Link>
                        <Link
                            href="/kontakt"
                            className="inline-flex items-center gap-3 bg-transparent hover:bg-white/5 text-white font-bold px-8 py-4 rounded-full text-lg border-2 border-white/20 hover:border-gold-400/50"
                        >
                            Napisz do mnie
                        </Link>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
