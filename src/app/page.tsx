
import HomeContent from "./HomeContent";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

import prisma from "@/lib/db/prisma";
import { unstable_cache } from 'next/cache';

// Cached function for homepage metadata
const getCachedHomeMetadata = unstable_cache(
    async () => {
        return await prisma.page.findUnique({
            where: { slug: 'strona-glowna' },
            select: {
                meta_title: true,
                meta_description: true,
                meta_keywords: true
            }
        });
    },
    ['home-metadata'],
    { revalidate: 3600, tags: ['pages', 'home'] }
);

export async function generateMetadata(): Promise<Metadata> {
    const page = await getCachedHomeMetadata();

    const defaultTitle = "Przemysław Właśniewski — Fotograf Toruń | Sesje rodzinne, ślubne, portretowe i komunijne";
    const defaultDescription = "Profesjonalny fotograf z Torunia. Naturalne sesje rodzinne, ślubne, portretowe i komunijne w Toruniu, Grudziądzu, Chełmnie, Wąbrzeźnie i okolicach. Reportaże pełne emocji i ujęcia z drona.";
    const defaultKeywords = "fotograf toruń, fotograf grudziądz, fotograf płużnica, zdjęcia ślubne, sesja rodzinna, fotograf komunijny toruń, fotograf biznesowy, dron kujawsko pomorskie";

    // Use DB values only if they're meaningful (not generic placeholder text)
    const dbTitle = page?.meta_title;
    const dbDesc = page?.meta_description;
    const isGenericTitle = !dbTitle || dbTitle.length < 35 || dbTitle.toLowerCase().includes('strona główna');
    const isGenericDesc = !dbDesc || dbDesc.length < 60 || dbDesc.toLowerCase().includes('strona główna');

    return {
        title: isGenericTitle ? defaultTitle : dbTitle,
        description: isGenericDesc ? defaultDescription : dbDesc,
        keywords: page?.meta_keywords || defaultKeywords
    };
}

async function getHomePageData() {
    const page = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' },
        select: {
            home_sections: true,
            sections: true
        }
    });

    // Testimonials - optimized query with select instead of include
    const testimonials = await prisma.testimonial.findMany({
        where: {
            is_featured: true // Only get featured testimonials
        },
        select: {
            id: true,
            client_name: true,
            text: true,
            rating: true,
            location: true,
            is_featured: true,
            display_order: true,
            created_at: true,
            client_photo: {
                select: {
                    id: true,
                    file_path: true,
                    alt_text: true
                }
            }
        },
        orderBy: { display_order: 'asc' },
        take: 10 // Limit to max 10 testimonials
    });

    // If no featured testimonials, get the latest 5
    const finalTestimonials = testimonials.length > 0 
        ? testimonials 
        : await prisma.testimonial.findMany({
            select: {
                id: true,
                client_name: true,
                text: true,
                rating: true,
                location: true,
                is_featured: true,
                display_order: true,
                created_at: true,
                client_photo: {
                    select: {
                        id: true,
                        file_path: true,
                        alt_text: true
                    }
                }
            },
            orderBy: { created_at: 'desc' },
            take: 5
        });

    return { page, testimonials: finalTestimonials };
}

export default async function HomePage() {
    const { page, testimonials } = await getHomePageData();

    let homeData: any = null;
    let orderedSections: any[] = [];

    // Always parse legacy home_sections when present (it contains hero_slider used on the homepage).
    if (page?.home_sections) {
        try {
            homeData = JSON.parse(page.home_sections);
        } catch (e) {
            console.error('Failed to parse home_sections', e);
        }
    }

    // Prefer new PageBuilder sections when present; fallback to legacy home_sections.
    if (page?.sections) {
        try {
            const parsedSections = JSON.parse(page.sections);
            if (Array.isArray(parsedSections)) {
                orderedSections = parsedSections;
            }
        } catch (e) {
            console.error('Failed to parse page.sections', e);
        }
    }

    if (orderedSections.length === 0 && homeData) {
        // Logic replicated from previous client component
        if (homeData.sections && Array.isArray(homeData.sections)) {
            orderedSections = homeData.sections;
        } else {
            // Fallback / Migration logic for old structure
            const legacySections = [];
            if (homeData.about_section) {
                legacySections.push({ id: 'about', type: 'about', enabled: homeData.about_section.enabled ?? true, data: homeData.about_section });
            }
            if (homeData.features) {
                legacySections.push({ id: 'features', type: 'features', enabled: true, data: { features: homeData.features } });
            }
            if (homeData.challenge_banner || homeData.foto_wyzwanie_effect) {
                legacySections.push({
                    id: 'challenge',
                    type: 'challenge_banner',
                    enabled: homeData.challenge_banner?.enabled ?? true,
                    data: {
                        ...homeData.challenge_banner,
                        effect: homeData.foto_wyzwanie_effect || 'none',
                        photos: homeData.foto_wyzwanie_photos || []
                    }
                });
            }
            if (homeData.parallax1) {
                legacySections.push({ id: 'parallax1', type: 'parallax', enabled: homeData.parallax1.enabled ?? true, data: homeData.parallax1 });
            }
            if (homeData.info_band) {
                legacySections.push({ id: 'info_band', type: 'info_band', enabled: homeData.info_band.enabled ?? true, data: homeData.info_band });
            }
            if (homeData.parallax2) {
                legacySections.push({ id: 'parallax2', type: 'parallax', enabled: homeData.parallax2.enabled ?? true, data: homeData.parallax2 });
            }
            orderedSections = legacySections;
        }
    }


    // Extract hero_slider explicitly to ensure proper serialization
    const heroSlides = homeData?.hero_slider || [];

    // Extract sections explicitly to ensure proper serialization
    const sections = JSON.parse(JSON.stringify(orderedSections));

    // Fetch Hero Slider Interval (fallback to 6000ms)
    // We check both specific KV setting and generic settings if needed
    let intervalSetting = null;
    try {
        intervalSetting = await prisma.setting.findFirst({
            where: { setting_key: 'hero_slider_interval' }
        });
    } catch (e: any) {
        // If column missing (P2022), ignore and use fallback
        if (e.code === 'P2022') {
            console.warn('Settings column missing (theme_mode?), using default interval.');
        } else {
            console.error('Failed to fetch hero slider interval', e);
        }
    }
    const heroSliderInterval = intervalSetting?.setting_value ? parseInt(intervalSetting.setting_value) : 6000;

    // SEO: deterministic SSR <h1> — guarantees Google sees the primary heading
    // even when first section uses h2 (magazine_layout, narrative_text, etc.)
    const heroSection = orderedSections.find((s: any) => s?.type === 'hero' && (s.image || s.data?.image));
    const seoH1 = (heroSection?.title || heroSection?.data?.title) ||
                  'Fotograf Toruń — Przemysław Właśniewski. Sesje rodzinne, ślubne i komunijne';

    return (
        <>
            {/* Visually hidden but indexed by search engines */}
            <h1 className="sr-only">{seoH1}</h1>
            <HomeContent
                heroSlides={heroSlides}
                sections={sections}
                homeData={homeData}
                orderedSections={orderedSections}
                testimonials={testimonials}
                heroSliderInterval={heroSliderInterval}
            />
        </>
    );
}
