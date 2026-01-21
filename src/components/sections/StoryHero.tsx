'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface StoryHeroProps {
    image: string;
    imagePosition?: 'left' | 'right';
    title: string;
    subtitle?: string;
    content?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundColor?: string;
}

export default function StoryHero({
    image,
    imagePosition = 'left',
    title,
    subtitle,
    content,
    buttonText,
    buttonLink,
    backgroundColor = 'var(--wedding-cream)',
}: StoryHeroProps) {
    const isImageLeft = imagePosition === 'left';

    return (
        <section
            className="editorial-spacing"
            style={{ backgroundColor }}
        >
            <div className="container mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* Image Side */}
                    <div
                        className={`relative aspect-[4/5] overflow-hidden rounded-sm ${!isImageLeft ? 'md:order-last' : ''}`}
                    >
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="object-cover hover-scale"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            priority
                        />
                    </div>

                    {/* Text Side */}
                    <div className="space-y-6">
                        {subtitle && (
                            <p className="text-sm uppercase tracking-widest text-gray-600 font-medium">
                                {subtitle}
                            </p>
                        )}

                        <h1
                            className="text-5xl md:text-6xl leading-tight"
                            style={{
                                fontFamily: 'var(--font-editorial-heading)',
                                color: 'var(--wedding-brown)',
                            }}
                        >
                            {title}
                        </h1>

                        {/* Gold accent line */}
                        <div
                            className="w-16 h-0.5"
                            style={{ backgroundColor: 'var(--wedding-gold)' }}
                        />

                        {content && (
                            <div
                                className="text-lg leading-relaxed text-gray-700 space-y-4"
                                style={{ fontFamily: 'var(--font-editorial-body)' }}
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        )}

                        {buttonText && buttonLink && (
                            <div className="pt-4">
                                <Link href={buttonLink}>
                                    <button className="btn-premium">{buttonText}</button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
