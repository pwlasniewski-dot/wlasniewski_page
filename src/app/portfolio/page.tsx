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

// PERFORMANCE: Enable ISR instead of force-dynamic (on-demand rendering)
// Revalidate every 3600 seconds (1 hour) for much faster initial page loads
export const revalidate = 3600;

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
        />
    );
}
