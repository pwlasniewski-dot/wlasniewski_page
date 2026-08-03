import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getPortfolioCategories } from "@/lib/portfolio";

import type { Metadata } from "next";

type Props = {
    params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category: categorySlug } = await params;

    // Use slug directly for metadata to avoid DB calls during build
    const decodedSlug = decodeURIComponent(categorySlug);
    const title = decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1);

    return {
        title: `${title} | Portfolio`,
        description: `Galeria zdjęć: ${title}`,
        alternates: {
            canonical: `https://wlasniewski.pl/portfolio/${categorySlug}`,
        },
        robots: { index: true, follow: true },
    };
}

// PERFORMANCE: Enable ISR (revalidate every hour) instead of force-dynamic
// This allows static generation at build time + revalidation
export const revalidate = 3600;

export async function generateStaticParams() {
    try {
        const categories = await getPortfolioCategories();
        return categories.map((cat: any) => ({
            category: cat.slug
        }));
    } catch (error) {
        console.error('Failed to generate static params:', error);
        // Fallback to empty array - new categories will be generated on first access (ISR)
        return [];
    }
}

import CategoryColumnView from "@/components/portfolio/CategoryColumnView";
import CategoryFullSlider from "@/components/portfolio/CategoryFullSlider";

import LightboxGallery from "@/components/LightboxGallery";
import prisma from "@/lib/db/prisma";

export default async function CategoryPage({ params }: Props) {
    const { category: categorySlug } = await params;

    // Parallel data fetching
    const [category, settings] = await Promise.all([
        getCategory(categorySlug),
        prisma.setting.findFirst({
            orderBy: { id: 'asc' },
            select: { portfolio_layout: true }
        })
    ]);

    if (!category) {
        notFound();
    }

    const layout = (settings as any)?.portfolio_layout || 'slider';

    // Aggregate Starred Photos for Level 2 Feed
    const starredItems: Array<{ src: string; alt: string; link: string; linkLabel: string }> = [];

    // Process sessions to find starred photos
    category.sessions.forEach((session: any) => {
        if (session.highlightedPhotos && session.highlightedPhotos.length > 0) {
            session.highlightedPhotos.forEach((photoUrl: string) => {
                starredItems.push({
                    src: photoUrl,
                    alt: session.title,
                    link: `/portfolio/${session.category}/${session.slug}`,
                    linkLabel: session.title
                });
            });
        }
    });

    // If we have starred photos, show the "Best Of" Feed (Level 2)
    if (starredItems.length > 0) {
        // Generate indices array [0, 1, 2, ... length-1] to mark ALL as highlighted (Full Width)
        const allIndices = Array.from({ length: starredItems.length }, (_, i) => i);

        return (
            <main className="min-h-screen bg-black">
                <h1 className="sr-only">{category.title} — portfolio fotograficzne</h1>
                <div className="w-full">
                    <LightboxGallery
                        photos={starredItems}
                        highlightedIndices={allIndices}
                        fitMode="blur"
                    />
                </div>
            </main>
        );
    }

    // Fallback: If no stars, show standard layout (Slider or Column)
    return (
        <main className="min-h-screen bg-black">
            {layout === 'column' ? (
                <>
                    <h1 className="sr-only">{category.title} — portfolio fotograficzne</h1>
                    <CategoryColumnView sessions={category.sessions} />
                </>
            ) : (
                <CategoryFullSlider
                    sessions={category.sessions}
                    title={category.title}
                    description={category.description}
                />
            )}
        </main>
    );
}
