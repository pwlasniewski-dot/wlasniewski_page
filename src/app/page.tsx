// Deploy with manually fixed Root Directory
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Check, Camera } from 'lucide-react';
import HeroSlider from '@/components/HeroSlider';
import ParallaxBand from '@/components/ParallaxBand';
import GiftCardPromoBar from '@/components/GiftCardPromoBar';
import CarouselGallery from '@/components/VisualEffects/CarouselGallery';
import MasonryGallery from '@/components/VisualEffects/MasonryGallery';
import PuzzleGallery from '@/components/VisualEffects/PuzzleGallery';
import AdvancedBanner from '@/components/AdvancedBanner';
import CreativeSlider from '@/components/CreativeSlider';
import WhiteInfoBand from '@/components/WhiteInfoBand';
import PhotoChallengeBanner from '@/components/PhotoChallengeBanner';

interface Testimonial {
    id: number;
    client_name: string;
    client_photo?: { file_path: string };
    testimonial_text: string;
    rating: number | null;
    source: string | null;
    photo_size: number;
    is_featured: boolean;
}

interface Section {
    id: string;
    type: 'about' | 'features' | 'parallax' | 'info_band' | 'challenge_banner' | 'testimonials' | 'creative_slider';
    enabled: boolean;
    backgroundColor?: 'black' | 'zinc-900' | 'zinc-800' | 'gold-900' | 'white';
    textVariant?: 'light' | 'dark';
    data: any;
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

export default function Home() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [homeData, setHomeData] = useState<HomeData | null>(null);
    const [orderedSections, setOrderedSections] = useState<Section[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Homepage Data (homepage is always id=1)
                const pageRes = await fetch('/api/pages?id=1');
                const pageData = await pageRes.json();

                if (pageData.success && pageData.page?.home_sections) {
                    try {
                        const parsed = JSON.parse(pageData.page.home_sections);
                        setHomeData(parsed);

                        // Handle Sections Logic
                        if (parsed.sections && Array.isArray(parsed.sections)) {
                            setOrderedSections(parsed.sections);
                        } else {
                            // Migration / Fallback for old data structure
                            const legacySections: Section[] = [];

                            if (parsed.about_section) {
                                legacySections.push({ id: 'about', type: 'about', enabled: parsed.about_section.enabled ?? true, data: parsed.about_section });
                            }
                            if (parsed.features) {
                                legacySections.push({ id: 'features', type: 'features', enabled: true, data: { features: parsed.features } });
                            }
                            // Combine challenge banner and foto wyzwanie effect
                            if (parsed.challenge_banner || parsed.foto_wyzwanie_effect) {
                                legacySections.push({
                                    id: 'challenge',
                                    type: 'challenge_banner',
                                    enabled: parsed.challenge_banner?.enabled ?? true,
                                    data: {
                                        ...parsed.challenge_banner,
                                        effect: parsed.foto_wyzwanie_effect || 'none',
                                        photos: parsed.foto_wyzwanie_photos || []
                                    }
                                });
                            }
                            if (parsed.parallax1) {
                                legacySections.push({ id: 'parallax1', type: 'parallax', enabled: parsed.parallax1.enabled ?? true, data: parsed.parallax1 });
                            }
                            if (parsed.info_band) {
                                legacySections.push({ id: 'info_band', type: 'info_band', enabled: parsed.info_band.enabled ?? true, data: parsed.info_band });
                            }
                            if (parsed.parallax2) {
                                legacySections.push({ id: 'parallax2', type: 'parallax', enabled: parsed.parallax2.enabled ?? true, data: parsed.parallax2 });
                            }

                            setOrderedSections(legacySections);
                        }

                    } catch (e) {
                        console.error('Error parsing home sections');
                    }
                }

                // 2. Fetch Testimonials
                const testRes = await fetch('/api/testimonials');
                const testData = await testRes.json();
                if (Array.isArray(testData)) {
                    const featured = testData.filter((t: Testimonial) => t.is_featured);
                    setTestimonials(featured.length > 0 ? featured : testData.slice(0, 5));
                }
            } catch (error) {
                console.error('Failed to fetch data');
            }
        };
        fetchData();
    }, []);

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
            case 'white': return 'bg-white text-black';
            case 'zinc-800': return 'bg-zinc-800';
            case 'zinc-900': return 'bg-zinc-900';
            case 'gold-900': return 'bg-gradient-to-br from-gold-900/30 to-black';
            case 'black':
            default: return 'bg-black';
        }
    };

    const getTextColorClass = (variant?: string, bgColor?: string) => {
        // If variant is explicitly set, use it
        if (variant === 'dark') {
            return {
                heading: 'text-zinc-900',
                body: 'text-zinc-700'
            };
        }
        if (variant === 'light') {
            return {
                heading: 'text-gold-400',
                body: 'text-zinc-300'
            };
        }

        // Auto-detect based on background
        if (bgColor === 'white') {
            return {
                heading: 'text-zinc-900',
                body: 'text-zinc-700'
            };
        }
        return {
            heading: 'text-gold-400',
            body: 'text-zinc-300'
        };
    };

    const renderSection = (section: Section) => {
        if (!section.enabled) return null;
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

                                        <h2 className={`text-3xl md:text-4xl font-display font-bold ${textColors.heading} mb-6`}>
                                            {section.data.title}
                                        </h2>
                                        <div
                                            className={`prose prose-invert ${textColors.body} mb-8 text-base md:text-lg max-w-none`}
                                            dangerouslySetInnerHTML={{ __html: section.data.content }}
                                        />
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
                return (
                    <section key={section.id} className="py-20 px-6 bg-black">
                        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
                            {section.data.features?.map((feature: any, index: number) => (
                                feature.enabled && (
                                    <div key={index} className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800 hover:border-gold-500/30 transition-colors">
                                        <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
                                        <ul className="space-y-3">
                                            {feature.items.map((item: string, i: number) => (
                                                <li key={i} className="flex items-start gap-3 text-zinc-400">
                                                    <Check className="w-5 h-5 text-gold-500 shrink-0 mt-0.5" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
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
                    <ParallaxBand
                        key={section.id}
                        imageSrc={section.data.image}
                        image={section.data.image}
                        image_desktop={section.data.image_desktop}
                        image_mobile={section.data.image_mobile}
                        title={section.data.title}
                        height="min-h-[60vh] md:min-h-[80vh] lg:min-h-screen"
                        floatingImage={section.data.floatingImage ?? true}
                        parallaxSpeed={section.data.parallaxSpeed ?? 0.5}
                        imageOffset={section.data.imageOffset ?? 20}
                        textOpacity={section.data.textOpacity ?? 1}
                        textColor={section.data.textColor ?? '#FFFFFF'}
                        textAnimation={section.data.textAnimation ?? 'slide-up'}
                        overlayOpacity={0.4}
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
                                            <h2 className={`text-4xl font-display font-bold ${textColors.heading} mb-4`}>
                                                {block.title}
                                            </h2>
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
                                                "{testimonial.testimonial_text}"
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

            default:
                return null;
        }
    };

    return (
        <main className="min-h-screen bg-black text-white">
            {/* Gift Card Promo Bar */}
            <GiftCardPromoBar />

            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@graph": [
                            {
                                "@type": ["LocalBusiness", "PhotographyBusiness"],
                                "@id": "https://wlasniewski.pl/#business",
                                "name": "Przemysław Właśniewski — Fotograf",
                                "description": "Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna. Naturalne zdjęcia w Toruniu, Wąbrzeźnie, Płużnicy i okolicach.",
                                "image": "https://wlasniewski.pl/og-image.jpg",
                                "telephone": "+48 530 788 694",
                                "email": "przemyslaw@wlasniewski.pl",
                                "url": "https://wlasniewski.pl",
                                "priceRange": "$$",
                                "address": {
                                    "@type": "PostalAddress",
                                    "addressLocality": "Toruń",
                                    "addressRegion": "kujawsko-pomorskie",
                                    "addressCountry": "PL"
                                },
                                "geo": {
                                    "@type": "GeoCoordinates",
                                    "latitude": "53.0138",
                                    "longitude": "18.5984"
                                },
                                "areaServed": [
                                    { "@type": "City", "name": "Toruń" },
                                    { "@type": "City", "name": "Wąbrzeźno" },
                                    { "@type": "City", "name": "Płużnica" },
                                    { "@type": "City", "name": "Lisewo" },
                                    { "@type": "City", "name": "Grudziądz" }
                                ],
                                "sameAs": [
                                    "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
                                    "https://www.instagram.com/wlasniewski.pl/"
                                ],
                                "openingHoursSpecification": {
                                    "@type": "OpeningHoursSpecification",
                                    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                                    "opens": "08:00",
                                    "closes": "20:00"
                                },
                                "hasOfferCatalog": {
                                    "@type": "OfferCatalog",
                                    "name": "Usługi fotograficzne",
                                    "itemListElement": [
                                        {
                                            "@type": "Offer",
                                            "itemOffered": {
                                                "@type": "Service",
                                                "name": "Fotografia rodzinna",
                                                "description": "Naturalne sesje rodzinne w plenerze lub studio"
                                            }
                                        },
                                        {
                                            "@type": "Offer",
                                            "itemOffered": {
                                                "@type": "Service",
                                                "name": "Fotografia ślubna",
                                                "description": "Kompleksowa obsługa fotograficzna ślubu i wesela"
                                            }
                                        },
                                        {
                                            "@type": "Offer",
                                            "itemOffered": {
                                                "@type": "Service",
                                                "name": "Fotografia komunijna",
                                                "description": "Pamiątkowe zdjęcia z Pierwszej Komunii Świętej"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "@type": "Person",
                                "@id": "https://wlasniewski.pl/#person",
                                "name": "Przemysław Właśniewski",
                                "jobTitle": "Fotograf",
                                "image": "https://wlasniewski.pl/og-image.jpg",
                                "url": "https://wlasniewski.pl",
                                "telephone": "+48 530 788 694",
                                "email": "przemyslaw@wlasniewski.pl",
                                "sameAs": [
                                    "https://www.facebook.com/przemyslaw.wlasniewski.fotografia",
                                    "https://www.instagram.com/wlasniewski.pl/"
                                ]
                            },
                            {
                                "@type": "WebSite",
                                "@id": "https://wlasniewski.pl/#website",
                                "name": "Przemysław Właśniewski — Fotograf",
                                "url": "https://wlasniewski.pl",
                                "description": "Profesjonalna fotografia rodzinna, ślubna, portretowa i komunijna w Toruniu i okolicach",
                                "publisher": { "@id": "https://wlasniewski.pl/#person" }
                            }
                        ]
                    })
                }}
            />

            {/* Hero Slider - Always First */}
            <HeroSlider slides={homeData?.hero_slider || []} />

            {/* Dynamic Sections */}
            {orderedSections.map(section => renderSection(section))}
        </main>
    );
}
