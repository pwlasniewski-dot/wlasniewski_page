import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const page = await prisma.page.findUnique({
        where: { slug: 'b2b' }
    });

    if (!page) {
        console.log('Page not found');
        return;
    }

    const sections = JSON.parse(page.sections as string);
    const heroSection = sections.find((s: any) => s.type === 'b2b_hero');

    if (!heroSection) {
        console.log('Hero section not found');
        return;
    }

    console.log('BEFORE:', heroSection.buttonLink);

    // Fix the anchor - change from #RFQ to #rfq
    heroSection.buttonLink = '#rfq';

    console.log('AFTER:', heroSection.buttonLink);

    await prisma.page.update({
        where: { slug: 'b2b' },
        data: {
            sections: JSON.stringify(sections),
            updated_at: new Date()
        }
    });

    console.log('✅ Button anchor fixed! Hero button now links to #rfq');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
