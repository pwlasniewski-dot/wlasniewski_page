import { prisma } from "@/lib/prisma";
import GuideContent from "./GuideContent";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
    title: "Jak się ubrać na sesję? - Paweł Wwaśniewski | Poradnik",
    description: "Praktyczne porady dotyczące ubioru na sesję zdjęciową. Kolory, fasony i wskazówki dla par i rodzin.",
};

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
