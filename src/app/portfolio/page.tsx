import React from "react";
import Link from "next/link";
import { getPortfolioCategories } from "@/lib/portfolio";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Portfolio | Fotografia Ślubna i Rodzinna",
    description: "Zobacz moje portfolio. Fotografia ślubna, rodzinna, biznesowa i więcej.",
};

// PERFORMANCE: Enable ISR instead of force-dynamic (on-demand rendering)
// Revalidate every 3600 seconds (1 hour) for much faster initial page loads
export const revalidate = 3600;

export default async function PortfolioHome() {
    const categories = await getPortfolioCategories();

    return (
        <main className="min-h-screen bg-black text-white selection:bg-gold-500 selection:text-black">
            {/* Header Section - Minimalist */}
            <section className="pt-40 pb-20 px-6 text-center">
                <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter mb-6 font-display text-white">
                    PORTFOLIO
                </h1>
                <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light tracking-wide uppercase font-sans">
                    Wybrane historie
                </p>
            </section>

            {/* Cinematic List */}
            <section className="pb-32 px-0 md:px-8 max-w-[1920px] mx-auto">
                <div className="flex flex-col gap-1">
                    {categories.map((category, index) => (
                        <Link
                            key={category.slug}
                            href={`/portfolio/${category.slug}`}
                            className="group relative block w-full h-[60vh] md:h-[80vh] overflow-hidden"
                        >
                            {/* Background Image with Parallax-like scaling */}
                            {category.coverImage ? (
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.5s] ease-out group-hover:scale-105 image-warm"
                                    style={{ backgroundImage: `url('${category.coverImage}')` }}
                                />
                            ) : (
                                <div className="absolute inset-0 bg-zinc-900" />
                            )}

                            {/* Dark Overlay - lighter on hover */}
                            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-700" />

                            {/* Content - Centered */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-10">
                                {/* Decorative Line */}
                                <div className="w-px h-16 bg-gold-400 mb-6 transform origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-700 delay-100" />

                                <h2 className="text-5xl md:text-8xl font-medium text-white mb-4 font-display tracking-tight uppercase text-center opacity-90 group-hover:opacity-100 transition-opacity duration-500">
                                    {category.title}
                                </h2>

                                <p className="text-gold-200 text-sm md:text-lg tracking-[0.3em] uppercase opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-200 font-sans">
                                    Zobacz Galerię
                                </p>

                                {/* Image Count Badge - Subtle */}
                                <div className="absolute bottom-8 right-8 text-xs font-mono text-gold-500/50">
                                    {category.imageCount} ZDJĘĆ
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Empty State */}
                {categories.length === 0 && (
                    <div className="text-center py-32">
                        <p className="text-zinc-500 text-xl">Ładowanie portfolio...</p>
                    </div>
                )}
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-zinc-950 border-t border-white/10">
                <div className="mx-auto max-w-4xl text-center px-6">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 font-display">
                        Stwórzmy razem coś pięknego
                    </h2>
                    <Link
                        href="/rezerwacja"
                        className="inline-block bg-white text-black px-10 py-4 rounded-full text-lg font-bold tracking-wide hover:bg-gold-400 transition-colors duration-300 font-sans"
                    >
                        ZAREZERWUJ TERMIN
                    </Link>
                </div>
            </section>
        </main>
    );
}
