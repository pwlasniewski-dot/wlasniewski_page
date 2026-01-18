'use client';

import React from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

interface CarouselSlide {
    id: string;
    image: string;
    title?: string;
    subtitle?: string;
}

interface FeaturedCarouselProps {
    slides: CarouselSlide[];
    title?: string;
    subtitle?: string;
    backgroundColor?: string;
}

export default function FeaturedCarousel({
    slides,
    title,
    subtitle,
    backgroundColor = '#ffffff',
}: FeaturedCarouselProps) {
    if (!slides || slides.length === 0) return null;

    return (
        <section className="section-spacing overflow-hidden" style={{ backgroundColor }}>
            <div className="container mx-auto px-6 max-w-7xl">

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
                                className="text-4xl md:text-6xl text-[var(--wedding-brown)] italic"
                                style={{ fontFamily: 'var(--font-editorial-heading)', fontWeight: 400 }}
                            >
                                {title}
                            </h2>
                        )}
                        <div className="w-12 h-[1px] bg-[var(--wedding-gold)] mx-auto mt-6" />
                    </div>
                )}

                <div className="relative">
                    <Swiper
                        modules={[Autoplay, Pagination, EffectFade]}
                        spaceBetween={0}
                        slidesPerView={1}
                        loop={true}
                        effect="fade"
                        speed={1000}
                        autoplay={{
                            delay: 5000,
                            disableOnInteraction: false,
                        }}
                        pagination={{
                            clickable: true,
                            el: '.featured-pagination',
                        }}
                        className="rounded-sm overflow-hidden aspect-[16/9] md:aspect-[21/9] shadow-2xl"
                    >
                        {slides.map((slide) => (
                            <SwiperSlide key={slide.id}>
                                <div className="relative w-full h-full group">
                                    {slide.image ? (
                                        <Image
                                            src={slide.image}
                                            alt={slide.title || 'Slide'}
                                            fill
                                            className="object-cover transition-transform duration-[10000ms] ease-linear group-hover:scale-110"
                                            sizes="100vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-zinc-200" />
                                    )}

                                    {/* Overlay Content */}
                                    {(slide.title || slide.subtitle) && (
                                        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-6">
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                className="space-y-4"
                                            >
                                                {slide.subtitle && (
                                                    <p className="text-white text-sm uppercase tracking-[0.5em] font-light drop-shadow-lg">
                                                        {slide.subtitle}
                                                    </p>
                                                )}
                                                {slide.title && (
                                                    <h3
                                                        className="text-white text-3xl md:text-6xl drop-shadow-2xl"
                                                        style={{ fontFamily: 'var(--font-editorial-heading)' }}
                                                    >
                                                        {slide.title}
                                                    </h3>
                                                )}
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Custom Pagination Position */}
                    <div className="featured-pagination mt-8 flex justify-center !static" />
                </div>

            </div>

            <style jsx global>{`
                .featured-pagination .swiper-pagination-bullet {
                    width: 40px;
                    height: 2px;
                    border-radius: 0;
                    background: var(--wedding-gold);
                    opacity: 0.3;
                    transition: all 0.3s ease;
                }
                .featured-pagination .swiper-pagination-bullet-active {
                    opacity: 1;
                    width: 60px;
                }
            `}</style>
        </section>
    );
}
