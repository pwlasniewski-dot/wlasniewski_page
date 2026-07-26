'use client';

import Image from 'next/image';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export type CityStoryPhoto = {
    src: string;
    alt: string;
    caption: string;
};

function ParallaxFrame({ photo, index }: { photo: CityStoryPhoto; index: number }) {
    const frameRef = useRef<HTMLElement>(null);
    const reduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({
        target: frameRef,
        offset: ['start end', 'end start'],
    });
    const y = useTransform(scrollYProgress, [0, 1], reduceMotion ? ['0%', '0%'] : ['-6%', '6%']);

    return (
        <figure ref={frameRef} className="relative overflow-hidden bg-[#25221f]">
            <div className="relative h-[68svh] min-h-[520px] md:h-[78vh]">
                <motion.div style={{ y }} className="absolute -inset-y-[8%] inset-x-0 will-change-transform">
                    <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="100vw"
                        className="object-cover"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-7xl items-end justify-between gap-8 px-6 pb-8 text-white sm:px-10 md:pb-12">
                    <figcaption className="max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
                        {photo.caption}
                    </figcaption>
                    <span className="hidden text-xs tracking-[0.24em] text-white/65 md:block">0{index + 1}</span>
                </div>
            </div>
        </figure>
    );
}

export default function CityPhotoStory({ images, city }: { images: CityStoryPhoto[]; city: string }) {
    if (!images.length) return null;

    const featureImages = images.slice(0, 3);
    const mosaicImages = images.slice(3, 7);

    return (
        <section aria-labelledby="city-photo-story-title">
            <div className="bg-[#f4f1eb] px-6 py-20 sm:px-10 lg:py-28">
                <div className="mx-auto max-w-6xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8d7f6d]">Kadry z miasta</p>
                    <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
                        <h2 id="city-photo-story-title" className="font-display text-4xl font-medium leading-tight text-[#25221f] md:text-6xl">
                            {city} jest częścią tej opowieści
                        </h2>
                        <p className="max-w-xl leading-relaxed text-[#6c655d]">
                            Architektura i światło budują tło, ale na pierwszym planie zawsze zostają ludzie. Poniżej są fotografie z mojego portfolio — nie zdjęcia katalogowe.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-px bg-[#d7d0c6]">
                {featureImages.map((photo, index) => (
                    <ParallaxFrame key={photo.src} photo={photo} index={index} />
                ))}
            </div>

            {mosaicImages.length > 0 && (
                <div className="grid gap-px bg-[#d7d0c6] sm:grid-cols-2">
                    {mosaicImages.map((photo, index) => (
                        <figure key={photo.src} className="group bg-[#ece7df]">
                            <div className="relative aspect-[4/5] overflow-hidden">
                                <Image
                                    src={photo.src}
                                    alt={photo.alt}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 50vw"
                                    className="object-cover transition duration-700 group-hover:scale-[1.025]"
                                />
                            </div>
                            <figcaption className="px-6 py-5 text-sm leading-relaxed text-[#665f57]">
                                {photo.caption}
                            </figcaption>
                        </figure>
                    ))}
                </div>
            )}
        </section>
    );
}
