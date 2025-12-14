import React from "react";
import Link from "next/link";
import { getPortfolioCategories } from "@/lib/portfolio";
import type { Metadata } from "next";
import PortfolioContent from "./PortfolioContent";

export async function generateMetadata(): Promise<Metadata> {
    const prisma = (await import("@/lib/db/prisma")).default;
    const page = await prisma.page.findUnique({
        where: { slug: 'portfolio' }
    });

    return {
        title: page?.meta_title || "Portfolio | Fotografia Ślubna i Rodzinna",
        description: page?.meta_description || "Zobacz moje portfolio. Fotografia ślubna, rodzinna, biznesowa i więcej.",
    };
}

// PERFORMANCE: Use force-dynamic for Portfolio to ensure instant updates for settings
export const dynamic = 'force-dynamic';

export default async function PortfolioHome() {
    // 1. Fetch Categories
    const categories = await getPortfolioCategories();

    // 2. Fetch Page Logic (Portfolio & Homepage for fallback)
    const prisma = (await import("@/lib/db/prisma")).default;

    // Fetch Portfolio Page Data
    const portfolioPage = await prisma.page.findUnique({
        where: { slug: 'portfolio' }
    });

    // Fetch Homepage Data (for fallback Hero Slider)
    const homePage = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' } // or id: 1
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
            categories={categories}
            sections={portfolioSections}
            fallbackHeroSlides={homeData?.hero_slider || []}
            showFallbackHero={portfolioPage?.hero_subtitle === '1'}
            customHeroSlides={customHeroSlides}
        />
    );
}
