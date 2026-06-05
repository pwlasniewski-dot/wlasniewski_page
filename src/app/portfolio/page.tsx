import React from "react";
import Link from "next/link";
import { getPortfolioCategories } from "@/lib/portfolio";
import type { Metadata } from "next";
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
    // 1. Fetch Categories and Flatten to Hero Sessions
    const categories = await getPortfolioCategories();

    // Flatten logic: Extract all sessions that are marked as hero
    // We Map them to a structure compatible with the view
    const heroSessions = categories.flatMap(cat => cat.sessions)
        .filter(session => session.isCategoryHero === true) // Strict check
        .map(session => ({
            slug: session.slug, // Link to session, not category
            title: session.title,
            coverImage: session.coverImage,
            imageCount: session.imageCount,
            id: session.id
        }));

    // Fallback: If no hero sessions defined, maybe show categories?
    // User requirement: "If 10 sessions, show 10". If 0, show 0?
    // Let's assume if 0 hero sessions, we might fall back to categories to not show empty page.
    // BUT user was specific about "Okładka kategorii".
    // If heroSessions is empty, we fall back to old behavior?
    // Let's keep it consistent: always pass the items list.
    const displayItems = heroSessions.length > 0 ? heroSessions : categories;
    const isSessionMode = heroSessions.length > 0;

    // 2. Fetch Page Logic (Portfolio & Homepage for fallback)
    const prisma = (await import("@/lib/db/prisma")).default;

    // Fetch Portfolio Page Data
    const portfolioPage = await prisma.page.findUnique({
        where: { slug: 'portfolio' },
        select: {
            sections: true,
            content_images: true
        }
    });

    // Fetch Homepage Data (for fallback Hero Slider)
    const homePage = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' },
        select: {
            home_sections: true
        }
    });

    // Parse Portfolio Dynamic Sections
    let portfolioSections: any[] = [];
    if (portfolioPage?.sections) {
        try {
            portfolioSections = JSON.parse(portfolioPage.sections);
        } catch (e) {
            console.error("Failed to parse portfolio sections", e);
        }
    }

    // Parse Custom Portfolio Hero Slides (saved in content_images via Admin)
    let customHeroSlides: any[] = [];
    if (portfolioPage?.content_images) {
        try {
            const parsed = JSON.parse(portfolioPage.content_images);
            if (Array.isArray(parsed)) {
                customHeroSlides = parsed.map((s: any, i: number) => ({
                    id: s.id || `custom-${i}`,
                    image: s.url || s.image,
                    title: s.title || "",
                    subtitle: "",
                    buttonText: s.buttonText || "Zobacz Galerię",
                    buttonLink: "#portfolio-content",
                    buttonStyle: s.buttonStyle || 'gold',
                    enabled: true,
                    textAnimation: 'fade'
                }));
            }
        } catch (e) {
            console.error("Failed to parse custom portfolio slides", e);
        }
    }

    // Parse Homepage Data for Fallback Helper
    let homeData: any = null;
    if (homePage?.home_sections) {
        try {
            homeData = JSON.parse(homePage.home_sections);
        } catch (e) { console.error("Failed to parse home sections", e); }
    }

    return (
        <PortfolioContent
            categories={displayItems}
            sections={portfolioSections}
            fallbackHeroSlides={homeData?.hero_slider || []}
            showFallbackHero={portfolioPage?.hero_subtitle === '1'}
            customHeroSlides={customHeroSlides}
            isSessionMode={isSessionMode}
        />
    );
}
