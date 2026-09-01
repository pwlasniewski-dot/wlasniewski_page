
import HomeContent from "./HomeContent";
import { loadPublicPricingSnapshot, publicPriceLabel } from '@/lib/publicPackagePricing';
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

import prisma from "@/lib/db/prisma";
import { unstable_cache } from 'next/cache';
import { parsePublicGuideCmsData } from '@/lib/publicGuideCms';
import {
    HOMEPAGE_PRODUCTION_FALLBACK_SECTIONS,
    HOMEPAGE_PRODUCTION_FALLBACK_TESTIMONIALS,
} from '@/data/homepageProductionFallback';

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
    let page: Awaited<ReturnType<typeof getCachedHomeMetadata>> = null;
    try {
        page = await getCachedHomeMetadata();
    } catch (error) {
        console.warn('[home] Metadata CMS unavailable, using defaults.');
    }

    const defaultTitle = "Fotograf Toruń | Sesje rodzinne i śluby — Właśniewski";
    const defaultDescription = "Fotograf w Toruniu: sesje rodzinne, reportaże ślubne i rodzinne uroczystości. Zobacz pakiety, ceny i wolne terminy. Rezerwacja online z PayU.";
    const defaultKeywords = "fotograf Toruń, sesja rodzinna Toruń, fotograf ślubny Toruń, fotografia rodzinna Toruń, reportaż ślubny Toruń";

    // Use DB values only if they're meaningful (not generic placeholder text)
    const dbTitle = page?.meta_title;
    const dbDesc = page?.meta_description;
    const legacyTitle = "Fotograf Toruń – Właśniewski | Śluby, sesje rodzinne";
    const legacyDescription = "Fotograf Toruń – naturalne sesje ślubne, rodzinne i komunijne. Toruń, Grudziądz, Chełmno, Wąbrzeźno i okolice. Reportaże pełne emocji. ☎ 530 788 694";
    const isGenericTitle = !dbTitle || dbTitle.length < 35 || dbTitle.toLowerCase().includes('strona główna') || dbTitle === legacyTitle;
    const isGenericDesc = !dbDesc || dbDesc.length < 60 || dbDesc.toLowerCase().includes('strona główna') || dbDesc === legacyDescription;

    const title = isGenericTitle ? defaultTitle : dbTitle;
    const description = isGenericDesc ? defaultDescription : dbDesc;

    return {
        title,
        description,
        keywords: page?.meta_keywords || defaultKeywords,
        alternates: { canonical: 'https://wlasniewski.pl/' },
        robots: { index: true, follow: true },
        openGraph: {
            type: 'website',
            locale: 'pl_PL',
            url: 'https://wlasniewski.pl/',
            siteName: 'Przemysław Właśniewski — Fotograf',
            title,
            description,
            images: [{
                url: '/assets/slider/fotografia-rodzinna-grudziadz-01.webp',
                alt: 'Naturalna fotografia rodzinna — Przemysław Właśniewski',
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ['/assets/slider/fotografia-rodzinna-grudziadz-01.webp'],
        },
    };
}

async function getHomePageData() {
    let page: { home_sections: string | null; sections: string | null } | null = null;
    let cmsUnavailable = false;
    let testimonialsUnavailable = false;

    try {
        page = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' },
            select: { home_sections: true, sections: true },
        });
        cmsUnavailable = page === null;
    } catch {
        cmsUnavailable = true;
        console.warn('[home] CMS unavailable, rendering resilient homepage fallback.');
    }

    let finalTestimonials: any[] = [];
    try {
        const testimonials = await prisma.testimonial.findMany({
            where: { is_featured: true },
            select: {
                id: true,
                client_name: true,
                testimonial_text: true,
                rating: true,
                is_featured: true,
                display_order: true,
                created_at: true,
                client_photo: { select: { id: true, file_path: true } },
            },
            orderBy: { display_order: 'asc' },
            take: 10,
        });

        finalTestimonials = testimonials.length > 0
            ? testimonials
            : await prisma.testimonial.findMany({
                select: {
                    id: true,
                    client_name: true,
                    testimonial_text: true,
                    rating: true,
                    is_featured: true,
                    display_order: true,
                    created_at: true,
                    client_photo: { select: { id: true, file_path: true } },
                },
                orderBy: { created_at: 'desc' },
                take: 5,
            });
    } catch {
        testimonialsUnavailable = true;
        console.warn('[home] Testimonials unavailable; using preview fallback only.');
    }

    return { page, testimonials: finalTestimonials, cmsUnavailable, testimonialsUnavailable };
}

async function getPublicGuidePromo() {
    const homepageImage = '/images/home/session-guide-family-v2.webp';
    const homepageImageAlt = 'Rodzina w skoordynowanych, jasnych ubraniach podczas sesji w Toruniu';
    try {
        const page = await prisma.page.findUnique({
            where: { slug: 'jak-sie-ubrac' },
            select: { title: true, content: true, is_published: true },
        });
        const data = parsePublicGuideCmsData(page?.content);
        if (data && !page?.is_published) return null;
        return {
            title: page?.title || 'Jak się ubrać i pozować do sesji?',
            image: homepageImage,
            imageAlt: homepageImageAlt,
        };
    } catch {
        return { title: 'Jak się ubrać i pozować do sesji?', image: homepageImage, imageAlt: homepageImageAlt };
    }
}

export default async function HomePage() {
    const [{ page, testimonials, cmsUnavailable, testimonialsUnavailable }, publicPricing, publicGuidePromo] = await Promise.all([
        getHomePageData(),
        loadPublicPricingSnapshot(),
        getPublicGuidePromo(),
    ]);

    let homeData: any = null;
    let orderedSections: any[] = [];
    let sectionParseFailed = false;

    // Always parse legacy home_sections when present (it contains hero_slider used on the homepage).
    if (page?.home_sections) {
        try {
            homeData = JSON.parse(page.home_sections);
        } catch (e) {
            sectionParseFailed = true;
            console.warn('[home] Invalid home_sections; using the resilient fallback.');
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
            sectionParseFailed = true;
            console.warn('[home] Invalid page.sections; using the resilient fallback.');
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

    // Keep the full director preview useful when the local database is unavailable.
    // Published CMS data always wins, so every production block remains editable in admin.
    if (orderedSections.length === 0 && (cmsUnavailable || sectionParseFailed)) {
        orderedSections = JSON.parse(JSON.stringify(HOMEPAGE_PRODUCTION_FALLBACK_SECTIONS));
    }


    // Preserve the photographs and copy authored in the admin panel. The concise copy
    // below is only a resilient fallback for incomplete legacy slides.
    const heroSlides = (homeData?.hero_slider || []).map((slide: any) => {
        const source = `${slide?.title || ''} ${slide?.subtitle || ''} ${slide?.description || ''}`
            .replace(/<[^>]+>/g, ' ')
            .toLocaleLowerCase('pl');

        let copy = {
            title: 'Zdjęcia, do których chce się wracać',
            subtitle: 'Sesje rodzinne, śluby i uroczystości. Sprawdź ceny oraz wolne terminy.',
            buttonText: 'Zobacz pakiety i terminy',
            buttonLink: '/rezerwacja?source=hero&service=Sesja'
        };

        if (source.includes('komun')) {
            copy = {
                title: 'Fotografia komunijna w Toruniu i regionie',
                subtitle: 'Spokojny reportaż z ceremonii i rodzinnego spotkania.',
                buttonText: 'Sprawdź ofertę komunijną',
                buttonLink: '/rezerwacja?source=hero&service=Przyjęcie'
            };
        } else if (source.includes('ślub') || source.includes('slub') || source.includes('wese')) {
            copy = {
                title: 'Reportaż ślubny w Toruniu i regionie',
                subtitle: 'Od ceremonii po wesele — jasny zakres, ceny i rezerwacja online.',
                buttonText: 'Zobacz pakiety ślubne',
                buttonLink: '/rezerwacja?source=hero&service=Ślub'
            };
        } else if (source.includes('rodzin') || source.includes('dzieci') || source.includes('ciąż')) {
            copy = {
                title: 'Sesja rodzinna w Toruniu',
                subtitle: 'Zdjęcia bez pośpiechu, z gotową galerią dla całej rodziny.',
                buttonText: 'Zobacz sesje rodzinne',
                buttonLink: '/rezerwacja?source=hero&service=Sesja'
            };
        } else if (source.includes('urodzin') || source.includes('przyję') || source.includes('jubile')) {
            copy = {
                title: 'Reportaż z rodzinnej uroczystości',
                subtitle: 'Urodziny, jubileusz lub przyjęcie — zobacz dostępne warianty.',
                buttonText: 'Sprawdź pakiety',
                buttonLink: '/rezerwacja?source=hero&service=Urodziny'
            };
        }

        return {
            ...slide,
            title: slide?.title?.trim() || copy.title,
            subtitle: slide?.subtitle?.trim() || copy.subtitle,
            description: slide?.description || '',
            buttonText: slide?.buttonText?.trim() || slide?.button_text?.trim() || copy.buttonText,
            buttonLink: slide?.buttonLink?.trim() || slide?.button_link?.trim() || copy.buttonLink,
            button_text: slide?.buttonText?.trim() || slide?.button_text?.trim() || copy.buttonText,
            button_link: slide?.buttonLink?.trim() || slide?.button_link?.trim() || copy.buttonLink
        };
    });

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
            console.warn('[home] Hero interval unavailable; using the default value.');
        }
    }
    const heroSliderInterval = intervalSetting?.setting_value ? parseInt(intervalSetting.setting_value) : 6000;

    return (
        <HomeContent
            heroSlides={heroSlides}
            sections={sections}
            homeData={homeData}
            orderedSections={orderedSections}
            testimonials={testimonialsUnavailable
                ? JSON.parse(JSON.stringify(HOMEPAGE_PRODUCTION_FALLBACK_TESTIMONIALS))
                : testimonials}
            heroSliderInterval={heroSliderInterval}
            publicPriceLabels={{
                Sesja: publicPriceLabel(publicPricing.minimumPrices, 'Sesja'),
                'Ślub': publicPriceLabel(publicPricing.minimumPrices, 'Ślub'),
                Urodziny: publicPriceLabel(publicPricing.minimumPrices, 'Urodziny'),
            }}
            featuredPromotions={publicPricing.featuredPromotions}
            publicGuidePromo={publicGuidePromo}
        />
    );
}
