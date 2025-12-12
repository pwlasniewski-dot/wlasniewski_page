import { prisma } from "@/lib/prisma";
import HomeContent from "./HomeContent";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
    title: "Paweł Wwaśniewski - Fotograf Kujawsko-Pomorskie | Śluby, Rodzina, Biznes",
    description: "Profesjonalny fotograf z Płużnicy. Sesje ślubne, rodzinne i wizerunkowe w Toruniu, Grudziądzu i całym województwie. Naturalne zdjęcia i ujęcia z drona.",
    keywords: "fotograf toruń, fotograf grudziądz, fotograf płużnica, zdjęcia ślubne, sesja rodzinna, fotograf biznesowy, dron kujawsko pomorskie"
};

async function getHomePageData() {
    const page = await prisma.page.findUnique({
        where: { id: 1 }
    });

    // Testimonials
    const testimonials = await prisma.testimonial.findMany({
        include: { client_photo: true },
        orderBy: { created_at: 'desc' }
    });

    const featuredTestimonials = testimonials.filter(t => t.is_featured);
    const finalTestimonials = featuredTestimonials.length > 0 ? featuredTestimonials : testimonials.slice(0, 5);

    return { page, testimonials: finalTestimonials };
}

export default async function HomePage() {
    const { page, testimonials } = await getHomePageData();

    let homeData: any = null;
    let orderedSections: any[] = [];

    if (page && page.home_sections) {
        try {
            homeData = JSON.parse(page.home_sections);

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
        } catch (e) {
            console.error('Failed to parse home_sections', e);
        }
    }

    return (
        <HomeContent
            homeData={homeData}
            orderedSections={orderedSections}
            testimonials={testimonials}
        />
    );
}
