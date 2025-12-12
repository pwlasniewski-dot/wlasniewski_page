'use client';

import React from 'react';
import { PageSection } from '@/components/admin/PageBuilder';
import ParallaxSection from '@/components/ParallaxSection';
import Link from 'next/link';

export default function PageRenderer({ sections }: { sections: PageSection[] }) {
    if (!sections || sections.length === 0) return null;

    return (
        <div className="flex flex-col gap-0">
            {sections.map((section) => {
                switch (section.type) {
                    case 'hero_parallax':
                        return (
                            <ParallaxSection
                                key={section.id}
                                image={section.image || ''}
                                title={section.title || ''}
                                height="min-h-[70vh]"
                            />
                        );

                    case 'rich_text':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div
                                    className="mx-auto max-w-4xl prose prose-invert prose-lg
                                        prose-headings:font-display prose-headings:text-white
                                        prose-p:text-zinc-300 prose-p:leading-relaxed
                                        prose-a:text-gold-400 prose-a:no-underline hover:prose-a:text-gold-300
                                        prose-strong:text-white
                                        prose-ul:text-zinc-300 prose-ol:text-zinc-300
                                        prose-li:marker:text-gold-400
                                        prose-img:rounded-xl prose-img:shadow-2xl
                                    "
                                    dangerouslySetInnerHTML={{ __html: section.content || '' }}
                                />
                            </section>
                        );

                    case 'image_text':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12 items-center">
                                    <div className={`relative aspect-video rounded-2xl overflow-hidden shadow-2xl ${section.layout === 'right' ? 'md:order-2' : ''}`}>
                                        {section.image && (
                                            <img
                                                src={section.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className={`prose prose-invert prose-lg ${section.layout === 'right' ? 'md:order-1' : ''}`}>
                                        <div dangerouslySetInnerHTML={{ __html: section.content || '' }} />
                                    </div>
                                </div>
                            </section>
                        );

                    case 'gallery':
                        return (
                            <section key={section.id} className="py-16 px-4 bg-zinc-950">
                                <div className="mx-auto max-w-6xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {section.images?.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                                                <img
                                                    src={img}
                                                    alt=""
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        );

                    default:
                        return null;
                }
            })}
        </div>
    );
}
