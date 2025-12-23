"use client";

import React from "react";
import Link from "next/link";
import ParallaxSection from "@/components/ParallaxSection";
import { motion } from "framer-motion";
import ContactForm from '@/components/ContactForm';

interface OMnieContentProps {
    pageData: any;
    parallaxSections: any[];
    contentCards?: any[];
}

export default function OMnieContent({ pageData, parallaxSections, contentCards }: OMnieContentProps) {

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


                {/* Contact Form */}
                <div className="mt-20">
                    <ContactForm />
                </div>

            </div>
        </main>
    );
}
