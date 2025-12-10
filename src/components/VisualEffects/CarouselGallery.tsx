// Carousel Gallery Component using Swiper
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectCoverflow } from 'swiper/modules';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

interface CarouselGalleryProps {
    photos: Array<{
        url: string;
        alt?: string;
        caption?: string;
    }>;
    config?: {
        autoplay?: boolean;
        speed?: number;
        slidesPerView?: number;
        spaceBetween?: number;
        loop?: boolean;
        effect?: 'slide' | 'coverflow';
    };
}

export default function CarouselGallery({ photos, config }: CarouselGalleryProps) {
    const {
        autoplay = true,
        speed = 3000,
        slidesPerView = 1,
        spaceBetween = 30,
        loop = true,
        effect = 'slide'
    } = config || {};

    if (photos.length === 0) {
        return (
            <div className="text-center py-12 text-zinc-500">
                Brak zdjęć w galerii
            </div>
        );
    }

    return (
        <div className="carousel-gallery w-full">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
                spaceBetween={spaceBetween}
                slidesPerView={slidesPerView}
                navigation
                pagination={{ clickable: true }}
                autoplay={autoplay ? { delay: speed, disableOnInteraction: false } : false}
                loop={loop}
                effect={effect}
                coverflowEffect={effect === 'coverflow' ? {
                    rotate: 50,
                    stretch: 0,
                    depth: 100,
                    modifier: 1,
                    slideShadows: true,
                } : undefined}
                breakpoints={{
                    640: {
                        slidesPerView: Math.min(2, slidesPerView),
                    },
                    1024: {
                        slidesPerView: Math.min(3, slidesPerView),
                    },
                }}
                className="rounded-xl overflow-hidden"
            >
                {photos.map((photo, index) => (
                    <SwiperSlide key={index}>
                        <div className="relative aspect-[4/3] w-full">
                            <Image
                                src={photo.url}
                                alt={photo.alt || `Slide ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                            {photo.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                    <p className="text-white text-center">{photo.caption}</p>
                                </div>
                            )}
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <style jsx global>{`
                .carousel-gallery .swiper-button-next,
                .carousel-gallery .swiper-button-prev {
                    color: #D4AF37;
                }
                
                .carousel-gallery .swiper-pagination-bullet {
                    background: #D4AF37;
                }
                
                .carousel-gallery .swiper-pagination-bullet-active {
                    background: #D4AF37;
                }
            `}</style>
        </div>
    );
}
