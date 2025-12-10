import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, getPortfolioCategories } from "@/lib/portfolio";
import SessionGrid from "@/components/SessionGrid";
import CategoryHeroSlider from "@/components/CategoryHeroSlider";
import type { Metadata } from "next";

type Props = {
    params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category: categorySlug } = await params;

    // Use slug directly for metadata to avoid DB calls during build
    const title = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

    return {
        title: `${title} | Portfolio`,
        description: `Galeria zdjęć: ${title}`,
    };
}

// Completely disable static generation to prevent DB access during build
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Return empty array to prevent any build-time generation
export async function generateStaticParams() {
    return [];
}

export default async function CategoryPage({ params }: Props) {
    const { category: categorySlug } = await params;
    const category = await getCategory(categorySlug);

    if (!category) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white selection:bg-amber-500 selection:text-black">
            {/* Hero Slider */}
            <CategoryHeroSlider
                sessions={category.sessions}
                title={category.title}
                description={category.description}
            />

            <div className="mx-auto max-w-7xl px-4">
                {/* Back Link */}
                <div className="mb-12">
                    <Link
                        href="/portfolio"
                        className="inline-flex items-center text-zinc-500 hover:text-gold-400 transition-colors group font-sans text-sm tracking-widest uppercase"
                    >
                        <svg className="w-4 h-4 mr-2 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Powrót do portfolio
                    </Link>
                </div>

                {/* Session Grid */}
                <SessionGrid sessions={category.sessions} />

                {/* CTA Footer */}
                <div className="mt-20 pt-10 border-t border-zinc-800 text-center">
                    <p className="text-zinc-400 mb-6">Podoba Ci się to co widzisz?</p>
                    <Link
                        href="/rezerwacja"
                        className="inline-flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-full font-bold hover:bg-amber-400 transition-colors"
                    >
                        Zapytaj o termin
                    </Link>
                </div>
            </div>
        </main>
    );
}
