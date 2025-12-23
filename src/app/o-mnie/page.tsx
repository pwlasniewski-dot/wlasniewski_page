
import OMnieContent from "./OMnieContent";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

import prisma from "@/lib/db/prisma";

export async function generateMetadata(): Promise<Metadata> {
    const page = await prisma.page.findUnique({
        where: { slug: 'o-mnie' }
    });

    return {
        title: page?.meta_title || "Przemysław Właśniewski — Fotograf Sony A7 Full Frame | Toruń, Bydgoszcz",
        description: page?.meta_description || "Poznaj moją pasję. Profesjonalny fotograf Sony A7 pełna klatka. Sesje rodzinne i biznesowe: Toruń, Bydgoszcz, Grudziądz i Chełmno.",
    };
}

async function getPageData() {
    return await prisma.page.findUnique({
        where: { slug: 'o-mnie' }
    });
}

export default async function OMniePage() {
    const pageData = await getPageData();

    let parallaxSections = [];
    let contentCards: any[] = [];

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
    }

    return <OMnieContent pageData={pageData} parallaxSections={parallaxSections} contentCards={contentCards} />;
}
