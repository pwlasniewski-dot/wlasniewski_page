import React from "react";
import { getPortfolioCategories } from "@/lib/portfolio";
import type { Metadata } from "next";
import PortfolioIndexViews, { type PortfolioIndexLayout } from "@/components/portfolio/PortfolioIndexViews";
import PortfolioContent from "./PortfolioContent";

export async function generateMetadata(): Promise<Metadata> {
    const prisma = (await import("@/lib/db/prisma")).default;
    const page = await prisma.page.findUnique({
        where: { slug: 'portfolio' },
        select: {
            meta_title: true,
            meta_description: true
        }
    });

    return {
        title: page?.meta_title || 'Portfolio Fotografa — Sesje Ślubne i Rodzinne | Fotograf Toruń',
        description: page?.meta_description || 'Portfolio Przemysława Właśniewskiego — fotografia ślubna, rodzinna, portretowa i biznesowa z Torunia i okolic. Naturalne sesje plenerowe, galeria zdjęć premium.',
        alternates: {
            canonical: 'https://wlasniewski.pl/portfolio',
        },
    };
}

// PERFORMANCE: Use force-dynamic for Portfolio to ensure instant updates for settings
export const dynamic = 'force-dynamic';

export default async function PortfolioHome() {
    const categories = await getPortfolioCategories();
    const heroSessions = categories.flatMap(cat => cat.sessions)
        .filter(session => session.isCategoryHero === true)
        .map(session => ({
            slug: session.slug,
            title: session.title,
            coverImage: session.coverImage,
            imageCount: session.imageCount,
            id: session.id,
            category: session.category,
            description: session.description,
        }));

    const displayItems = heroSessions.length > 0 ? heroSessions : categories;
    const isSessionMode = heroSessions.length > 0;
    const prisma = (await import("@/lib/db/prisma")).default;

    const [portfolioPage, layoutSetting, homePage] = await Promise.all([
        prisma.page.findUnique({
            where: { slug: 'portfolio' },
            select: { content_images: true, sections: true, hero_subtitle: true }
        }),
        prisma.setting.findUnique({
            where: { setting_key: 'portfolio_index_layout' },
            select: { setting_value: true }
        }),
        prisma.page.findUnique({
            where: { slug: 'strona-glowna' },
            select: { home_sections: true }
        }),
    ]);

    const layout: PortfolioIndexLayout = layoutSetting?.setting_value === 'cinematic_contact'
        ? 'cinematic_contact'
        : 'chapters';

    let customHero: { image?: string; title?: string } = {};
    let heroSlides: Array<{ id?: string | number; image?: string; image_desktop?: string; image_mobile?: string; title?: string; enabled?: boolean }> = [];
    if (portfolioPage?.content_images) {
        try {
            const parsed = JSON.parse(portfolioPage.content_images);
            const firstEnabled = Array.isArray(parsed) ? parsed.find((item: any) => item?.enabled !== false) : null;
            if (Array.isArray(parsed)) {
                heroSlides = parsed.map((item: any, index: number) => {
                    const rawImage = item.url || item.image;
                    const rawDesktop = item.image_desktop;
                    const rawMobile = item.image_mobile;
                    return {
                        id: item.id || `portfolio-hero-${index}`,
                        image: typeof rawImage === 'string' ? rawImage : rawImage?.file_path,
                        image_desktop: typeof rawDesktop === 'string' ? rawDesktop : rawDesktop?.file_path,
                        image_mobile: typeof rawMobile === 'string' ? rawMobile : rawMobile?.file_path,
                        title: item.title,
                        enabled: item.enabled,
                    };
                });
            }
            if (firstEnabled) {
                customHero = {
                    image: firstEnabled.url || firstEnabled.image,
                    title: firstEnabled.title || undefined,
                };
            }
        } catch (error) {
            console.warn('[portfolio] Nie udało się odczytać niestandardowej okładki.', error);
        }
    }

    if (heroSlides.filter(slide => slide.enabled !== false && (slide.image_desktop || slide.image)).length === 0 && portfolioPage?.hero_subtitle === '1' && homePage?.home_sections) {
        try {
            const parsedHome = JSON.parse(homePage.home_sections);
            const fallbackSlides = Array.isArray(parsedHome?.hero_slider) ? parsedHome.hero_slider : [];
            heroSlides = fallbackSlides.map((item: any, index: number) => ({
                id: item.id || `home-hero-${index}`,
                    image: typeof item.image === 'string' ? item.image : item.image?.file_path,
                    image_desktop: typeof item.image_desktop === 'string' ? item.image_desktop : item.image_desktop?.file_path,
                    image_mobile: typeof item.image_mobile === 'string' ? item.image_mobile : item.image_mobile?.file_path,
                title: item.title,
                enabled: item.enabled,
            }));
        } catch (error) {
            console.warn('[portfolio] Nie udało się odczytać zapasowych slajdów strony głównej.', error);
        }
    }

    let portfolioSections: any[] = [];
    if (portfolioPage?.sections) {
        try {
            const parsedSections = JSON.parse(portfolioPage.sections);
            portfolioSections = Array.isArray(parsedSections) ? parsedSections : [];
        } catch (error) {
            console.warn('[portfolio] Nie udało się odczytać bloków CMS.', error);
        }
    }

    return (
        <PortfolioIndexViews
            items={displayItems}
            layout={layout}
            isSessionMode={isSessionMode}
            heroImage={customHero.image}
            heroTitle={customHero.title}
            heroSlides={heroSlides}
            supplementalContent={portfolioSections.length > 0 ? (
                <PortfolioContent
                    categories={[]}
                    sections={portfolioSections}
                    fallbackHeroSlides={[]}
                    sectionsOnly
                />
            ) : null}
        />
    );
}
