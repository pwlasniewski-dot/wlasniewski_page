import prisma from "@/lib/db/prisma";
import GuideContent from "./GuideContent";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

export async function generateMetadata(): Promise<Metadata> {
    const page = await prisma.page.findUnique({
        where: { slug: 'jak-sie-ubrac' }
    });

    return {
        title: page?.meta_title || "Jak się ubrać na sesję? - Przemysław Właśniewski | Poradnik",
        description: page?.meta_description || "Praktyczne porady dotyczące ubioru na sesję zdjęciową. Kolory, fasony i wskazówki dla par i rodzin.",
    };
}

async function getPageData() {
    return await prisma.page.findUnique({
        where: { slug: 'jak-sie-ubrac' }
    });
}

export default async function GuidePage() {
    const pageData = await getPageData();

    let parallaxSections = [];
    let contentCards = [];
    let colorPalettes = [];

    if (pageData) {
        if (pageData.parallax_sections) {
            try {
                parallaxSections = JSON.parse(pageData.parallax_sections).filter((s: any) => s.enabled);
            } catch { }
        }
        if (pageData.content_cards) {
            try {
                contentCards = JSON.parse(pageData.content_cards).filter((c: any) => c.enabled);
            } catch { }
        }
        if (pageData.content_images) {
            try {
                colorPalettes = JSON.parse(pageData.content_images);
            } catch { }
        }
    }

    return (
        <GuideContent
            pageData={pageData}
            parallaxSections={parallaxSections}
            contentCards={contentCards}
            colorPalettes={colorPalettes}
        />
    );
}
