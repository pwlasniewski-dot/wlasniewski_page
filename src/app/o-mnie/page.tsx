import { prisma } from "@/lib/prisma";
import OMnieContent from "./OMnieContent";
import { Metadata } from "next";

export const revalidate = 3600; // Cache for 1 hour

export const metadata: Metadata = {
    title: "O mnie - Paweł Wwaśniewski | Fotograf Płużnica, Toruń, Grudziądz",
    description: "Poznaj mnie lepiej. Fotograf ślubny i rodzinny z pasją. Inżynier z duszą artysty. Działam w Płużnicy i całym kujawsko-pomorskim.",
};

async function getPageData() {
    return await prisma.page.findUnique({
        where: { slug: 'o-mnie' }
    });
}

export default async function OMniePage() {
    const pageData = await getPageData();

    let parallaxSections = [];
    if (pageData?.parallax_sections) {
        try {
            parallaxSections = JSON.parse(pageData.parallax_sections).filter((s: any) => s.enabled);
        } catch { }
    }

    return <OMnieContent pageData={pageData} parallaxSections={parallaxSections} />;
}
