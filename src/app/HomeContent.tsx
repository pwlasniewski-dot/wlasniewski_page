'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronDown, Facebook, Instagram, Mail, MapPin, Phone, Send, User, X, Maximize2, Image as ImageIcon, ArrowLeft, ArrowRight, Star, Check } from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';
import ContactForm from '@/components/ContactForm';

// Lazy-loaded below-the-fold components
const ParallaxSection = dynamic(() => import('@/components/ParallaxSection'), { ssr: false });
const CarouselGallery = dynamic(() => import('@/components/VisualEffects/CarouselGallery'), { ssr: false });
const MasonryGallery = dynamic(() => import('@/components/VisualEffects/MasonryGallery'), { ssr: false });
const PuzzleGallery = dynamic(() => import('@/components/VisualEffects/PuzzleGallery'), { ssr: false });
const AdvancedBanner = dynamic(() => import('@/components/AdvancedBanner'), { ssr: false });
const CreativeSlider = dynamic(() => import('@/components/CreativeSlider'), { ssr: false });
const WhiteInfoBand = dynamic(() => import('@/components/WhiteInfoBand'), { ssr: false });
const PhotoChallengeBanner = dynamic(() => import('@/components/PhotoChallengeBanner'), { ssr: false });
// Premium Modules — lazy loaded
const StoriesGrid = dynamic(() => import('@/components/sections/StoriesGrid'), { ssr: false });
const ChronologicalGallery = dynamic(() => import('@/components/sections/ChronologicalGallery'), { ssr: false });
const MagazineLayout = dynamic(() => import('@/components/sections/MagazineLayout'), { ssr: false });
const EditorialMasonry = dynamic(() => import('@/components/sections/MasonryGallery'), { ssr: false });
const ClientStory = dynamic(() => import('@/components/sections/ClientStory'), { ssr: false });
const ProcessTimeline = dynamic(() => import('@/components/sections/ProcessTimeline'), { ssr: false });
const InvestmentTeaser = dynamic(() => import('@/components/sections/InvestmentTeaser'), { ssr: false });
const NarrativeText = dynamic(() => import('@/components/sections/NarrativeText'), { ssr: false });
const FeaturedCarousel = dynamic(() => import('@/components/sections/FeaturedCarousel'), { ssr: false });
const PhotoCube3D = dynamic(() => import('@/components/sections/PhotoCube3D'), { ssr: false });
// Banners are rendered in AppShell
interface Testimonial {
    id: number;
    client_name: string;
    client_photo?: { file_path: string } | null;
    testimonial_text: string;
    rating: number | null;
    source: string | null;
    photo_size: number | null;
    is_featured: boolean;
}

interface Section {
    id: string;
    type: 'about' | 'features' | 'parallax' | 'info_band' | 'challenge_banner' | 'testimonials' | 'creative_slider' | 'hero' | 'rich_text' | 'image_text' | 'gallery' | 'contact' | 'thermal_slider' | 'hero_parallax' | 'mini_gallery' |
    'stories_grid' | 'chronological_gallery' | 'magazine_layout' | 'masonry_gallery' | 'client_story' | 'process_timeline' | 'investment_teaser' | 'narrative_text' | 'featured_carousel' | 'photo_cube_3d';
    enabled?: boolean;
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-800' | 'gold-900' | 'white';
    textVariant?: 'light' | 'dark';
    data?: any;
    // PageBuilder fields
    image?: string;
    thermalImage?: string;
    title?: string;
    subtitle?: string;
    tag?: string;
    content?: string;
    buttonText?: string;
    buttonLink?: string;
    layout?: 'left' | 'right';
    images?: string[];
}

interface HomeData {
    hero_slider: any[];
    sections?: Section[];
    // Legacy fields for backward compatibility
    about_section?: any;
    features?: any[];
    parallax1?: any;
    parallax2?: any;
    info_band?: any;
    challenge_banner?: any;
    foto_wyzwanie_effect?: any;
    foto_wyzwanie_photos?: any;
}

// Interfaces
interface HomeContentProps {
    heroSlides: any[]; // Explicitly passed hero slides array
    sections: Section[]; // Explicitly passed sections array
    homeData: HomeData | null;
    orderedSections: Section[];
    testimonials: Testimonial[];
    heroSliderInterval?: number;
}

export default function HomeContent({ heroSlides, sections, homeData, orderedSections, testimonials, heroSliderInterval = 6000 }: HomeContentProps) {
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [selectedGalleryImage, setSelectedGalleryImage] = useState<string | null>(null);

    // Preload first hero image for faster LCP
    useEffect(() => {
        const firstSlide = heroSlides?.find((s: any) => s.enabled !== false);
        if (firstSlide) {
            const imageUrl = typeof firstSlide.image === 'string' 
                ? firstSlide.image 
                : firstSlide.image?.file_path;
            
            if (imageUrl && typeof window !== 'undefined') {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = imageUrl;
                link.fetchPriority = 'high';
                document.head.appendChild(link);
            }
        }
    }, [heroSlides]);

    // Auto-rotate testimonials
    useEffect(() => {
        if (testimonials.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials]);

    const getBackgroundClass = (bgColor?: string) => {
        switch (bgColor) {
            case 'white': return 'bg-white';
            case 'zinc-100': return 'bg-zinc-100'; // Light Gray
            case 'zinc-800': return 'bg-zinc-800';
            case 'zinc-900': return 'bg-zinc-900';
            case 'gold-900': return 'bg-gradient-to-br from-gold-900/30 to-black';
            case 'black':
            default: return 'bg-black';
        }
    };

    const getTextColorClass = (variant?: string, bgColor?: string) => {
        // Dynamic Text Color based on Background
        const isLight = bgColor === 'white' || bgColor === 'zinc-100' || bgColor === 'zinc-50';

        if (isLight) {
            return {
                heading: 'text-black',
                body: 'text-zinc-700'
            };
        }

        // Default Dark Mode Text
        return {
            heading: 'text-gold-400',
            body: 'text-zinc-300'
        };
    };

    const shouldDemoteHeading = (value?: string) => {
        if (!value) return false;
        const plain = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (!plain) return false;
        const words = plain.split(' ').filter(Boolean).length;
        return plain.length > 110 || words > 16;
    };

    const renderSection = (section: Section) => {
        if (section.enabled === false) return null;
        const bgClass = getBackgroundClass(section.backgroundColor);
        const textColors = getTextColorClass(section.textVariant, section.backgroundColor);

        switch (section.type) {
            case 'about':
                return (
                    <section key={section.id} className={`py-20 px-6 ${bgClass}`}>
                        <div className="max-w-6xl mx-auto space-y-20">
                            {/* Main Content Part */}
                            {(section.data.title || section.data.content || section.data.image) && (
                                <div className="grid md:grid-cols-2 gap-12 items-center">
                                    <div className={`relative overflow-hidden flex items-center justify-center ${section.data.imageShape === 'circle'
                                        ? 'w-64 h-64 md:w-[500px] md:h-[500px] rounded-full mx-auto'
                                        : 'h-[300px] md:h-[500px] rounded-2xl'
                                        } order-1 ${section.data.textPosition === 'left' ? 'md:order-2' : 'md:order-1'}`}>
                                        {section.data.image && (
                                            <Image
                                                src={section.data.image}
                                                alt={section.data.title || "O mnie"}
                                                fill
                                                className={`object-cover ${section.data.imageShape === 'circle' ? 'rounded-full' : ''}`}
                                                style={{
                                                    transform: `scale(${(section.data.imageSize || 100) / 100})`
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className={`order-2 ${section.data.textPosition === 'left' ? 'md:order-1 text-left' :
                                        section.data.textPosition === 'right' ? 'md:order-2 text-right' :
                                            'md:order-1 text-center md:col-span-2' // Center implies spanning full width or centered text
                                        } ${section.data.textPosition === 'center' ? 'md:text-center' : ''}`}>

                                        {(() => {
                                            const HeadingTag = shouldDemoteHeading(section.data.title) ? 'p' : 'h2';
                                            return (
                                                <HeadingTag className={`text-3xl md:text-4xl font-display font-bold ${textColors.heading} mb-6`}>
                                                    {section.data.title}
                                                </HeadingTag>
                                            );
                                        })()}
                                        <div
                                            className={`prose prose-invert ${textColors.body} mb-8 text-base md:text-lg max-w-none`}
                                            dangerouslySetInnerHTML={{ __html: section.data.content }}
                                        />

                                        {/* New Facebook Button */}
                                        <div className="mt-12 flex justify-center">
                                            <a
                                                href="https://www.facebook.com/PiotrWlasniewskiFotografia"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-8 py-3 border border-white/20 rounded-full text-white hover:bg-white/10 hover:border-gold-400 hover:text-gold-400 transition-all duration-300 backdrop-blur-sm"
                                            >
                                                Odwiedź mnie na Facebooku
                                            </a>
                                        </div>

                                        <div className={`flex flex-wrap gap-4 ${section.data.textPosition === 'center' ? 'justify-center' :
                                            section.data.textPosition === 'right' ? 'justify-end' :
                                                'justify-start'
                                            }`}>
                                            {section.data.cta1Text && (
                                                <Link
                                                    href={section.data.cta1Link || '/portfolio'}
                                                    className="px-6 py-3 bg-gold-500 text-black font-bold rounded-lg hover:bg-gold-400 transition-colors"
                                                >
                                                    {section.data.cta1Text}
                                                </Link>
                                            )}
                                            {section.data.cta2Text && (
                                                <Link
                                                    href={section.data.cta2Link || '/kontakt'}
                                                    className="px-6 py-3 border border-gold-500 text-gold-500 font-bold rounded-lg hover:bg-gold-500/10 transition-colors"
                                                >
                                                    {section.data.cta2Text}
                                                </Link>
                                            )}
                                            {/* Facebook Button (User Request) */}
                                            <a
                                                href="https://www.facebook.com/przemyslaw.wlasniewski.fotografia"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-3 border border-white/20 text-white font-bold rounded-lg hover:bg-white/10 hover:border-white/40 transition-colors flex items-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                                                </svg>
                                                Facebook
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Additional Blocks */}
                            {section.data.blocks && section.data.blocks.map((block: any, idx: number) => (
                                <div
                                    key={block.id || idx}
                                    className={`grid md:grid-cols-2 gap-12 items-center ${block.position === 'right' ? 'md:grid-flow-dense' : ''
                                        }`}
                                >
                                    {/* Block Image */}
                                    <div className={`relative overflow-hidden flex items-center justify-center ${block.imageShape === 'circle'
                                        ? 'w-64 h-64 md:w-[400px] md:h-[400px] rounded-full mx-auto'
                                        : 'h-[300px] md:h-[400px] rounded-2xl'
                                        } ${block.position === 'right' ? 'md:col-start-2' : ''}`}>
                                        {block.image && (
                                            <Image
                                                src={block.image}
                                                alt={block.title || "Sekcja"}
                                                fill
                                                className={`object-cover ${block.imageShape === 'circle' ? 'rounded-full' : ''}`}
                                            />
                                        )}
                                    </div>

                                    {/* Block Content */}
                                    <div className={block.position === 'right' ? 'md:col-start-1 md:row-start-1 text-right' : 'text-left'}>
                                        <h3 className={`text-2xl md:text-3xl font-display font-bold ${textColors.heading} mb-4`}>
                                            {block.title}
                                        </h3>
                                        <p className={`text-lg ${textColors.body} leading-relaxed whitespace-pre-line`}>
                                            {block.content}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                );

            case 'features':
                const isCentered = section.data.sectionLayout === 'centered';
                const isLarge = section.data.featureSize === 'large';

                return (
                    <section key={section.id} className="py-20 px-6 bg-black">
                        <div className={`max-w-6xl mx-auto ${isCentered
                            ? 'flex flex-wrap justify-center gap-8'
                            : 'grid md:grid-cols-3 gap-8'
                            }`}>
                            {section.data.features?.map((feature: any, index: number) => (
                                feature.enabled && (
                                    <div key={index}
                                        className={`bg-zinc-900/50 rounded-2xl border border-zinc-800 hover:border-gold-500/30 transition-colors flex flex-col
                                            ${isCentered ? 'max-w-md w-full' : ''}
                                            ${isLarge ? 'p-12' : 'p-8'}
                                        `}
                                    >
                                        <h3 className={`font-bold text-white mb-4 ${isLarge ? 'text-2xl' : 'text-xl'}`}>{feature.title}</h3>
                                        <ul className="space-y-3 flex-1">
                                            {feature.items.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-zinc-400">
                                                    <Check className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                                                    <span className={isLarge ? 'text-lg' : ''}>{item}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {(feature.buttonText && feature.buttonLink) && (
                                            <div className="mt-8 pt-6 border-t border-zinc-800">
                                                <Link
                                                    href={feature.buttonLink}
                                                    className="w-full block text-center py-3 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 hover:border-gold-500/50 text-gold-400 rounded-lg transition-all font-bold tracking-wide shadow-[0_0_15px_rgba(234,179,8,0.15)] animate-pulse hover:animate-none"
                                                >
                                                    {feature.buttonText}
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )
                            ))}
                        </div>
                    </section>
                );

            case 'challenge_banner':
                return (
                    <PhotoChallengeBanner
                        key={section.id}
                        title={section.data.title || '📸 Foto Wyzwanie'}
                        subtitle={section.data.subtitle || 'Pokaż Swoją Kreatywność'}
                        description={section.data.content || 'Podejmij wyzwanie i wygraj fantastyczne nagrody!'}
                        buttonText={section.data.buttonText || 'Dołącz Teraz'}
                        buttonLink={section.data.buttonLink || '/foto-wyzwanie'}
                        layout={section.data.layout || 'full-width'}
                        accentColor={section.data.accentColor || 'gold'}
                        animationStyle={section.data.animationStyle || 'fade'}
                        enableParticles={section.data.enableParticles !== false}
                        height={section.data.height || 'min-h-[70vh]'}
                    />
                );

                return (
                    <section key={section.id} className="py-20 px-6 bg-zinc-900 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/images/pattern.png')] opacity-5"></div>
                        <div className="max-w-7xl mx-auto relative z-10">
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                {/* Left side - Visual Effect */}
                                <div className="order-2 md:order-1">
                                    {section.data.effect === 'carousel' && section.data.photos && (
                                        <CarouselGallery
                                            photos={section.data.photos.map((url: string) => ({ url, alt: 'Foto Wyzwanie' }))}
                                            config={{
                                                slidesPerView: 3,
                                                spaceBetween: 20,
                                                autoplay: true
                                            }}
                                        />
                                    )}
                                    {section.data.effect === 'masonry' && section.data.photos && (
                                        <MasonryGallery
                                            photos={section.data.photos.map((url: string) => ({ url, alt: 'Foto Wyzwanie' }))}
                                            config={{}}
                                        />
                                    )}
                                    {section.data.effect === 'puzzle' && section.data.photos && (
                                        <PuzzleGallery
                                            photos={section.data.photos.map((url: string) => ({ url, alt: 'Foto Wyzwanie' }))}
                                            config={{}}
                                        />
                                    )}
                                    {section.data.effect === 'orbiting3d' && section.data.photos && (
                                        <div className="relative h-96 flex items-center justify-center">
                                            <div className="relative w-64 h-64">
                                                {section.data.photos.slice(0, 2).map((photo: string, i: number) => (
                                                    <motion.div
                                                        key={i}
                                                        className="absolute w-32 h-32 rounded-full overflow-hidden shadow-2xl"
                                                        animate={{
                                                            x: [0, 120, 0, -120, 0],
                                                            y: [0, -120, 0, 120, 0],
                                                        }}
                                                        transition={{
                                                            duration: 8,
                                                            repeat: Infinity,
                                                            delay: i * 4,
                                                            ease: "linear"
                                                        }}
                                                        style={{
                                                            left: '50%',
                                                            top: '50%',
                                                            marginLeft: '-64px',
                                                            marginTop: '-64px'
                                                        }}
                                                    >
                                                        <Image
                                                            src={photo}
                                                            alt="Foto Wyzwanie"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {(!section.data.effect || section.data.effect === 'none') && (
                                        <div className="flex items-center justify-center h-96">
                                            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gold-500/20">
                                                <Camera className="w-16 h-16 text-gold-500" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right side - Text content */}
                                <div className="text-center md:text-left order-1 md:order-2">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/20 mb-6 md:mx-0 mx-auto">
                                        <Camera className="w-8 h-8 text-gold-500" />
                                    </div>
                                    <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                                        {section.data.title || 'Foto Wyzwanie dla Par'}
                                    </h2>
                                    <p className="text-zinc-300 text-lg mb-10">
                                        {section.data.content || 'Podejmij wyzwanie, wykonaj 10 kreatywnych zadań i stwórz niezapomnianą pamiątkę.'}
                                    </p>
                                    <Link
                                        href={section.data.buttonLink || '/foto-wyzwanie'}
                                        className="inline-flex items-center px-8 py-4 bg-gold-500 hover:bg-gold-400 text-black font-bold rounded-xl shadow-lg shadow-gold-500/20 transition-all transform hover:scale-105"
                                    >
                                        {section.data.buttonText || 'Dołącz do Wyzwania'}
                                        <ArrowRight className="ml-2 w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                );

            case 'parallax':
                return (
                    <ParallaxSection
                        key={section.id}
                        {...section.data}
                        imageSrc={section.data.image}
                        // Explicitly mapping overrides if needed, but spread handles most
                        height="min-h-[60vh] md:min-h-[80vh] lg:min-h-screen"
                    />
                );

            case 'info_band':
                // Multi-block mode
                if (section.data.blocks && section.data.blocks.length > 0) {
                    return (
                        <section key={section.id} className={`py-20 px-6 ${bgClass}`}>
                            <div className="max-w-6xl mx-auto space-y-20">
                                {section.data.blocks.map((block: any, idx: number) => (
                                    <div
                                        key={block.id}
                                        className={`grid md:grid-cols-2 gap-12 items-center ${block.position === 'right' ? 'md:grid-flow-dense' : ''
                                            }`}
                                    >
                                        {/* Image */}
                                        <div className={`relative overflow-hidden flex items-center justify-center ${block.imageShape === 'circle'
                                            ? 'w-[500px] h-[500px] rounded-full mx-auto'
                                            : 'h-[500px] rounded-2xl'
                                            } ${block.position === 'right' ? 'md:col-start-2' : ''}`}>
                                            {block.image && (
                                                <Image
                                                    src={block.image}
                                                    alt={block.title}
                                                    fill
                                                    className={`object-cover ${block.imageShape === 'circle' ? 'rounded-full' : ''}`}
                                                    style={{
                                                        transform: `scale(${(block.imageSize || 100) / 100})`
                                                    }}
                                                />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className={`${block.position === 'right' ? 'md:col-start-1 md:row-start-1 text-right' : 'text-left'}`}>
                                            {(() => {
                                                const HeadingTag = shouldDemoteHeading(block.title) ? 'p' : 'h2';
                                                return (
                                                    <HeadingTag className={`text-4xl font-display font-bold ${textColors.heading} mb-4`}>
                                                        {block.title}
                                                    </HeadingTag>
                                                );
                                            })()}
                                            <div
                                                className={`text-lg ${textColors.body} leading-relaxed prose prose-zinc`}
                                                dangerouslySetInnerHTML={{ __html: block.content }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                }

                // Legacy single block mode
                return (
                    <WhiteInfoBand
                        key={section.id}
                        image={section.data.image}
                        title={section.data.title}
                        content={section.data.content}
                        imagePosition={section.data.position}
                    />
                );

            case 'testimonials':
                return testimonials.length > 0 ? (
                    <section key={section.id} className="py-20 px-6 bg-black">
                        <div className="max-w-4xl mx-auto text-center">
                            <h2 className="text-3xl font-display font-bold text-gold-400 mb-2">
                                {section.data.title || 'Co mówią klienci'}
                            </h2>
                            {section.data.subtitle && (
                                <p className="text-zinc-400 mb-12">{section.data.subtitle}</p>
                            )}
                            <div className="relative min-h-[300px]">
                                {testimonials.map((testimonial, index) => (
                                    <div
                                        key={testimonial.id}
                                        className={`absolute inset-0 transition-opacity duration-500 ${index === currentTestimonial ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                            }`}
                                    >
                                        <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
                                            <div className="flex justify-center mb-6">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`w-5 h-5 ${i < (testimonial.rating || 5)
                                                            ? 'text-gold-500 fill-gold-500'
                                                            : 'text-zinc-700'
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xl text-zinc-300 italic mb-6">
                                                &quot;{testimonial.testimonial_text}&quot;
                                            </p>
                                            <div className="flex items-center justify-center gap-4">
                                                {testimonial.client_photo?.file_path && (
                                                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                                                        <Image
                                                            src={testimonial.client_photo.file_path}
                                                            alt={testimonial.client_name}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-white">{testimonial.client_name}</p>
                                                    {testimonial.source && (
                                                        <p className="text-sm text-zinc-500">{testimonial.source}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null;

            case 'creative_slider':
                return section.data.slides && section.data.slides.length > 0 ? (
                    <CreativeSlider
                        key={section.id}
                        slides={section.data.slides}
                        config={section.data.config}
                    />
                ) : null;

            // === PageBuilder Section Types ===
            case 'hero':
                return section.image ? (
                    <section key={section.id} className="relative w-full bg-black overflow-hidden" style={{ height: '100vh', minHeight: '600px' }}>
                        {/* Background Image */}
                        <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url("${section.image}")`, backgroundPosition: 'center 30%' }} />
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-0 left-0 w-full h-[60vh] bg-gradient-to-t from-black via-black/80 to-transparent" />

                        {/* Content */}
                        <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 text-center">
                            <div className="space-y-3 sm:space-y-4 md:space-y-6 max-w-4xl">
                                {section.tag && <p className="text-sm md:text-base text-gold-400 font-semibold tracking-wide uppercase">{section.tag}</p>}
                                {section.title && <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-extrabold text-white tracking-tighter drop-shadow-2xl leading-tight">{section.title}</h2>}
                                {section.subtitle && <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-200 drop-shadow-lg">{section.subtitle}</p>}
                                {section.buttonText && (
                                    <div className="pt-4">
                                        <Link href={section.buttonLink || '#'} className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-gold-500 text-black font-semibold rounded hover:bg-gold-400 transition-colors shadow-lg">
                                            {section.buttonText}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                ) : null;

            case 'rich_text':
                return (
                    <section key={section.id} className={`py-20 px-6 ${getBackgroundClass('black')}`}>
                        <div className="max-w-3xl mx-auto">
                            {section.title && <h2 className="text-4xl font-bold text-gold-400 mb-6">{section.title}</h2>}
                            {section.content && (
                                <div className="prose prose-invert max-w-none text-zinc-300" dangerouslySetInnerHTML={{ __html: section.content }} />
                            )}
                        </div>
                    </section>
                );

            case 'image_text':
                return (
                    <section key={section.id} className={`py-20 px-6 ${getBackgroundClass('black')}`}>
                        <div className="max-w-6xl mx-auto">
                            <div className={`grid md:grid-cols-2 gap-12 items-center ${section.layout === 'right' ? 'md:grid-flow-dense' : ''}`}>
                                {section.image && (
                                    <div className={`relative h-96 md:h-[500px] rounded-2xl overflow-hidden ${section.layout === 'right' ? 'md:col-start-2' : ''}`}>
                                        <Image src={section.image} alt={section.title || ''} fill className="object-cover" />
                                    </div>
                                )}
                                <div className={section.layout === 'right' ? 'md:col-start-1 md:row-start-1' : ''}>
                                    {section.title && <h2 className="text-3xl md:text-4xl font-bold text-gold-400 mb-6">{section.title}</h2>}
                                    {section.content && <p className="text-lg text-zinc-300 leading-relaxed mb-8">{section.content}</p>}
                                </div>
                            </div>
                        </div>
                    </section>
                );

            case 'gallery':
                return (
                    <section key={section.id} className={`py-20 px-6 ${getBackgroundClass('black')}`}>
                        <div className="max-w-6xl mx-auto">
                            {section.title && <h2 className="text-4xl font-bold text-gold-400 mb-12 text-center">{section.title}</h2>}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {section.images?.map((img, idx) => (
                                    <div key={idx} className="relative h-64 rounded-lg overflow-hidden">
                                        <Image src={img} alt={`Galeria ${idx + 1}`} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );

            case 'mini_gallery':
                // Safe access to nested data structure
                const miniData = section.data || {};
                const config = miniData.mini_gallery_config || {};
                const items = miniData.mini_gallery_items || [];

                const colClass = {
                    2: 'grid-cols-1 sm:grid-cols-2',
                    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
                    4: 'grid-cols-2 md:grid-cols-4',
                    5: 'grid-cols-2 md:grid-cols-5',
                    6: 'grid-cols-2 md:grid-cols-6'
                }[(config.columns || 4) as number] || 'grid-cols-2 md:grid-cols-4';

                const gapClass = `gap-${config.gap || 4}`;

                const cornerClass = {
                    'square': 'rounded-none',
                    'rounded': 'rounded-xl',
                    'pill': 'rounded-full'
                }[(config.corners || 'square') as string] || 'rounded-none';

                const aspectRatio = {
                    'square': 'aspect-square',
                    'video': 'aspect-video',
                    'portrait': 'aspect-[3/4]',
                    'auto': ''
                }[(config.aspectRatio || 'square') as string];

                // Background handling - use config or section fallback
                const containerBg = config.backgroundColor
                    ? { backgroundColor: config.backgroundColor }
                    : {};

                return (
                    <section
                        key={section.id}
                        className={`py-16 px-4 md:px-8 relative overflow-hidden`}
                        style={containerBg}
                    >
                        <div className="max-w-[1920px] mx-auto">
                            {/* Description Rendering Logic */}
                            {(() => {
                                const DescriptionBlock = () => (
                                    config.description ? (
                                        <div className={`mb-12 px-4 
                                            ${config.descriptionWidth === 'narrow' ? 'max-w-2xl' :
                                                config.descriptionWidth === 'wide' ? 'max-w-6xl' :
                                                    config.descriptionWidth === 'full' ? 'max-w-full' : 'max-w-4xl'}
                                            ${config.descriptionAlign === 'left' ? 'mr-auto ml-0 text-left' :
                                                config.descriptionAlign === 'right' ? 'ml-auto mr-0 text-right' : 'mx-auto text-center'}
                                        `}>
                                            <div
                                                className="prose prose-invert prose-lg text-zinc-200 leading-relaxed font-normal max-w-none"
                                                dangerouslySetInnerHTML={{ __html: config.description }}
                                            />
                                            {config.descriptionAlign === 'center' || !config.descriptionAlign ? (
                                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent mx-auto mt-8" />
                                            ) : null}
                                        </div>
                                    ) : null
                                );

                                return (
                                    <>
                                        {(!config.descriptionPlacement || config.descriptionPlacement === 'top') && <DescriptionBlock />}

                                        <div className={`grid ${config.mobileColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'} ${colClass} ${gapClass} 
                                            ${(!config.containerWidth || config.containerWidth === 'full') ? 'w-full' :
                                                config.containerWidth === '3/4' ? 'w-full md:w-3/4 mx-auto' :
                                                    'w-full md:w-1/2 mx-auto'}
                                        `}>
                                            {items.map((item: any, idx: number) => (
                                                <div
                                                    key={item.id || idx}
                                                    className={`relative group cursor-pointer ${item.spanCols > 1 ? `col-span-${item.spanCols}` : ''} ${item.spanRows > 1 ? `row-span-${item.spanRows}` : ''}`}
                                                    onClick={() => item.link ? window.location.href = item.link : setSelectedGalleryImage(item.image)}
                                                >
                                                    <div className={`relative overflow-hidden w-full h-full ${cornerClass} ${aspectRatio} bg-zinc-900 border border-white/5`}>
                                                        {item.image ? (
                                                            <img
                                                                src={item.image}
                                                                alt={item.title || ''}
                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-zinc-800"><ImageIcon /></div>
                                                        )}

                                                        {/* Hover Overlay */}
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                                                            {item.title && <h4 className="text-white font-bold text-lg mb-1 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{item.title}</h4>}
                                                            {item.description && <p className="text-zinc-300 text-sm translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{item.description}</p>}
                                                            {!item.link && <Maximize2 className="text-white mt-4 opacity-50" size={20} />}
                                                        </div>
                                                    </div>

                                                    {/* Below Text */}
                                                    {(config.textPosition === 'below' && (item.title || item.description)) && (
                                                        <div className="mt-2 text-left">
                                                            {item.title && <h5 className="text-white font-bold text-sm">{item.title}</h5>}
                                                            {item.description && <p className="text-zinc-500 text-xs">{item.description}</p>}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {config.descriptionPlacement === 'bottom' && (
                                            <div className="mt-12">
                                                <DescriptionBlock />
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

                            {/* Lightbox */}
                            <AnimatePresence>
                                {selectedGalleryImage && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
                                        onClick={() => setSelectedGalleryImage(null)}
                                    >
                                        <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors z-[110]">
                                            <X size={48} />
                                        </button>

                                        {/* Navigation Arrows */}
                                        {items.length > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const currentIndex = items.findIndex((item: any) => item.image === selectedGalleryImage);
                                                        const prevIndex = (currentIndex - 1 + items.length) % items.length;
                                                        setSelectedGalleryImage(items[prevIndex].image);
                                                    }}
                                                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white/75 hover:text-white hover:bg-black/80 rounded-full transition-all z-[110]"
                                                >
                                                    <ArrowLeft size={32} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const currentIndex = items.findIndex((item: any) => item.image === selectedGalleryImage);
                                                        const nextIndex = (currentIndex + 1) % items.length;
                                                        setSelectedGalleryImage(items[nextIndex].image);
                                                    }}
                                                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 bg-black/50 text-white/75 hover:text-white hover:bg-black/80 rounded-full transition-all z-[110]"
                                                >
                                                    <ArrowRight size={32} />
                                                </button>
                                            </>
                                        )}

                                        <motion.img
                                            key={selectedGalleryImage} // Key change triggers animation
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.9, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            src={selectedGalleryImage}
                                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </section>
                );


            // NEW PREMIUM MODULES

            case 'stories_grid':
                return (
                    <StoriesGrid
                        key={section.id}
                        title={section.data?.title}
                        subtitle={section.data?.subtitle}
                        items={section.data?.stories_items || []}
                    />
                );

            case 'chronological_gallery':
                return (
                    <ChronologicalGallery
                        key={section.id}
                        items={section.data?.chronological_items || []}
                        layout={section.data?.gallery_layout || 'grid'}
                        title={section.data?.title}
                    />
                );

            case 'magazine_layout':
                return (
                    <MagazineLayout
                        key={section.id}
                        title={section.data?.title || section.title || ''}
                        subtitle={section.data?.subtitle || section.subtitle}
                        content={section.data?.content || section.content}
                        mainImage={section.data?.image || section.image || ''}
                        secondaryImage={section.data?.secondaryImage || section.thermalImage}
                        backgroundColor={section.data?.backgroundColor || section.backgroundColor}
                        layout={section.data?.layout || section.layout || 'left'}
                    />
                );

            case 'masonry_gallery':
                return (
                    <EditorialMasonry
                        key={section.id}
                        images={section.data?.images || []}
                        title={section.data?.title}
                        subtitle={section.data?.subtitle}
                        columns={section.data?.columns || 3}
                    />
                );

            case 'client_story':
                return (
                    <ClientStory
                        key={section.id}
                        clientName={section.data?.tag || section.data?.subtitle || ''}
                        storyTitle={section.data?.title || ''}
                        testimonial={section.data?.content || ''}
                        mainImage={section.data?.image || ''}
                        location={section.data?.subtitle || ''}
                        date={section.data?.date}
                    />
                );

            case 'process_timeline':
                return (
                    <ProcessTimeline
                        key={section.id}
                        title={section.data?.title || ''}
                        subtitle={section.data?.subtitle}
                        steps={section.data?.steps || section.data?.timeline_steps || []}
                        backgroundColor={section.data?.backgroundColor}
                    />
                );

            case 'investment_teaser':
                const packages = section.data?.packages || (Array.isArray(section.data?.features) && section.data.features.length > 0 && typeof section.data.features[0] === 'object'
                    ? section.data.features.map((pkg: any) => ({
                        id: pkg.id || 'pkg-' + Math.random(),
                        name: pkg.title || 'Pakiet',
                        price: pkg.buttonText || '',
                        features: Array.isArray(pkg.items) ? pkg.items : [],
                        isPopular: pkg.enabled
                    }))
                    : [{
                        id: 'default',
                        name: section.data?.priceLabel || 'Pakiet',
                        price: section.data?.price || 'Zapytaj o cenę',
                        features: Array.isArray(section.data?.features) ? section.data.features : []
                    }]
                );

                return (
                    <InvestmentTeaser
                        key={section.id}
                        title={section.data?.title || ''}
                        subtitle={section.data?.subtitle}
                        packages={packages}
                        buttonText={section.data?.buttonText}
                        buttonLink={section.data?.buttonLink}
                    />
                );

            case 'narrative_text':
                return (
                    <NarrativeText
                        key={section.id}
                        title={section.data?.title || ''}
                        content={section.data?.content || ''}
                        dropCap={section.data?.dropCap !== false}
                        backgroundColor={section.data?.bgColor || section.data?.backgroundColor}
                        alignment={section.data?.alignment}
                    />
                );

            case 'featured_carousel':
                return (
                    <FeaturedCarousel
                        key={section.id}
                        title={section.data?.title || ''}
                        subtitle={section.data?.subtitle}
                        slides={(section.data?.items || section.data?.slides || []).map((slide: any, idx: number) => ({
                            id: slide.id || `slide-${idx}`,
                            image: slide.image,
                            title: slide.title,
                            subtitle: slide.subtitle
                        }))}
                    />
                );

            case 'photo_cube_3d':
                return (
                    <PhotoCube3D
                        key={section.id}
                        images={section.data?.images || []}
                        cubeSize={section.data?.cube_size || 320}
                        imageFit={section.data?.image_fit || 'cover'}
                        rotationSpeed={section.data?.rotation_speed || 0.5}
                        smoothness={section.data?.smoothness || 0.96}
                        entrySpeed={section.data?.entry_speed || 1800}
                        entryDirection={section.data?.entry_direction || 'left'}
                        mode="section"
                        backgroundColor={section.data?.background_color || '#000000'}
                        title={section.data?.title}
                        subtitle={section.data?.subtitle}
                        edgeColor={section.data?.edge_color || '#c8a960'}
                        edgeWidth={section.data?.edge_width ?? 1.5}
                        autoRotate={section.data?.auto_rotate ?? true}
                        autoRotateSpeed={section.data?.auto_rotate_speed ?? 0.15}
                    />
                );

            case 'contact':
                return (
                    <section key={section.id} className={`py-20 px-6 ${getBackgroundClass('black')}`}>
                        <div className="max-w-3xl mx-auto text-center">
                            {section.title && <h2 className="text-4xl font-bold text-gold-400 mb-6">{section.title}</h2>}
                            {section.subtitle && <p className="text-lg text-zinc-300 mb-10">{section.subtitle}</p>}
                            {section.buttonText && (
                                <Link href={section.buttonLink || '/kontakt'} className="inline-block px-8 py-3 bg-gold-500 text-black font-semibold rounded-lg hover:bg-gold-400 transition-colors">
                                    {section.buttonText}
                                </Link>
                            )}
                        </div>
                    </section>
                );

            default:
                return null;
        }
    };

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Hero Slider - Always First */}
            <HeroSlider slides={heroSlides} interval={heroSliderInterval} />

            <section className="relative z-20 -mt-8 px-4 pb-16 md:-mt-12">
                <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-zinc-950/95 p-5 shadow-2xl shadow-black/60 backdrop-blur md:p-8">
                    <div className="mb-7 text-center">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gold-400">Zacznij od tego, czego potrzebujesz</p>
                        <h2 className="text-2xl font-bold text-white md:text-4xl">Wybierz rodzaj fotografii i od razu zobacz pakiety</h2>
                        <p className="mx-auto mt-3 max-w-2xl text-zinc-400">Ceny, zakres pracy i wolne terminy są w jednym miejscu. Rezerwację potwierdzasz zaliczką przez PayU.</p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { title: 'Sesja rodzinna', price: 'od 750 zł', copy: 'Dla rodziny, pary albo na spokojne zdjęcia kilku pokoleń.', href: '/rezerwacja?source=home&service=Sesja' },
                            { title: 'Ślub', price: 'od 1900 zł', copy: 'Od ceremonii w urzędzie po pełny reportaż z wesela.', href: '/rezerwacja?source=home&service=Ślub' },
                            { title: 'Urodziny i przyjęcia', price: 'od 1100 zł', copy: 'Reportaż z urodzin, jubileuszu lub rodzinnej uroczystości.', href: '/rezerwacja?source=home&service=Urodziny' },
                        ].map((item) => (
                            <Link key={item.title} href={item.href} className="group rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:-translate-y-1 hover:border-gold-500/50">
                                <div className="mb-2 flex items-start justify-between gap-3">
                                    <h3 className="text-xl font-bold text-white group-hover:text-gold-300">{item.title}</h3>
                                    <span className="whitespace-nowrap text-sm font-bold text-gold-400">{item.price}</span>
                                </div>
                                <p className="mb-5 text-sm leading-relaxed text-zinc-400">{item.copy}</p>
                                <span className="font-semibold text-white">Zobacz pakiety i terminy →</span>
                            </Link>
                        ))}
                    </div>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
                        <span>✓ Jasny zakres każdego pakietu</span>
                        <span>✓ Bezpieczna zaliczka PayU</span>
                        <span>✓ Potwierdzenie na e-mail</span>
                    </div>
                </div>
            </section>


            {/* Dynamic Sections */}
            {sections.map(section => renderSection(section))}

            {/* SEO: internal links to landing pages — descriptive anchor text helps Google
                map keywords ("fotograf toruń", "sesja rodzinna") to dedicated pages. */}
            <section className="py-16 px-6 bg-zinc-950 border-t border-white/5">
                <div className="container mx-auto max-w-5xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center font-display">
                        Fotograf Toruń, Grudziądz, Chełmno, Płużnica i Wąbrzeźno — sprawdź ofertę
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/fotograf-torun" className="group block p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-gold-500/30 rounded-lg transition-all">
                            <div className="text-gold-400 text-xs font-bold tracking-widest uppercase mb-2">Lokalnie</div>
                            <div className="text-white font-semibold mb-1 group-hover:text-gold-300 transition-colors">Fotograf Toruń i okolice</div>
                            <p className="text-sm text-zinc-400">Profesjonalne sesje zdjęciowe: Toruń, Grudziądz, Chełmno, Płużnica, Wąbrzeźno.</p>
                        </Link>
                        <Link href="/sesja-rodzinna" className="group block p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-gold-500/30 rounded-lg transition-all">
                            <div className="text-gold-400 text-xs font-bold tracking-widest uppercase mb-2">Rodzina</div>
                            <div className="text-white font-semibold mb-1 group-hover:text-gold-300 transition-colors">Sesja rodzinna Toruń i Grudziądz</div>
                            <p className="text-sm text-zinc-400">Naturalne sesje rodzinne w Toruniu, Grudziądzu, Chełmnie i okolicach.</p>
                        </Link>
                        <Link href="/slub" className="group block p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-gold-500/30 rounded-lg transition-all">
                            <div className="text-gold-400 text-xs font-bold tracking-widest uppercase mb-2">Ślub</div>
                            <div className="text-white font-semibold mb-1 group-hover:text-gold-300 transition-colors">Fotograf ślubny Toruń i Chełmno</div>
                            <p className="text-sm text-zinc-400">Reportaż ślubny pełen emocji: Toruń, Grudziądz, Chełmno, Wąbrzeźno.</p>
                        </Link>
                        <Link href="/portfolio" className="group block p-5 bg-zinc-900/50 hover:bg-zinc-900 border border-white/5 hover:border-gold-500/30 rounded-lg transition-all">
                            <div className="text-gold-400 text-xs font-bold tracking-widest uppercase mb-2">Praca</div>
                            <div className="text-white font-semibold mb-1 group-hover:text-gold-300 transition-colors">Portfolio</div>
                            <p className="text-sm text-zinc-400">Wybrane realizacje — sesje, śluby, reportaże.</p>
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section and Contact Form */}
            <section className="py-24 px-6 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-t border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 mix-blend-overlay" />

                {/* Animated background glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-[100px] group-hover:bg-gold-500/20 transition-all duration-1000" />

                <div className="relative container mx-auto text-center max-w-3xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 font-display">
                        Fotograf ślubny i rodzinny — <span className="text-gold-400">Toruń, Grudziądz, Chełmno i okolice</span>
                    </h2>
                    <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                        Szukasz fotografa z Torunia lub okolic, który uchwyci Twoją historię?
                        <br />
                        Napisz do mnie i porozmawiajmy o sesji w Toruniu, Grudziądzu, Chełmnie, Płużnicy lub Wąbrzeźnie.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-5 justify-center">
                        <Link
                            href="/rezerwacja?source=home-bottom&service=Sesja"
                            className="bg-gold-500 hover:bg-gold-400 text-black px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-gold-500/20"
                        >
                            Sprawdź pakiety i terminy
                        </Link>
                        <Link
                            href="/kontakt"
                            className="bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
                        >
                            Napisz do mnie
                        </Link>
                    </div>
                </div>
            </section>

            <Link
                href="/rezerwacja?source=home-mobile&service=Sesja"
                className="fixed bottom-4 left-4 right-4 z-50 rounded-xl bg-gold-500 px-5 py-4 text-center font-bold text-black shadow-2xl shadow-black/60 md:hidden"
            >
                Zobacz ceny i wolne terminy
            </Link>

            <div className="bg-black py-20 border-t border-zinc-900">
                <ContactForm />
            </div>


        </main>
    );
}
