
import { PrismaClient } from '@prisma/client';

// PROD Connection - Try modifying SSL mode or removing it for test
// Using "no-verify" or relaxed SSL might help if pooler cert is generic
const PROD_URL = process.env.DATABASE_URL || '';

const LOCAL_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/fotograf_local";

async function main() {
    console.log('🔄 Starting Content Sync (Retry SSL)...');
    // Bypass SSL validation for potential certificate mismatches on poolers
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const prismaProd = new PrismaClient({ datasources: { db: { url: PROD_URL } } });
    const prismaLocal = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });

    try {
        const prodCount = await prismaProd.page.count();
        console.log(`✅ PROD Connected. Pages: ${prodCount}`);

        // Sync Logic Repeated...
        const slides = await prismaProd.heroSlide.findMany();
        if (slides.length > 0) {
            await prismaLocal.heroSlide.deleteMany();
            await prismaLocal.heroSlide.createMany({ data: slides });
            console.log(`✅ ${slides.length} Hero Slides synced.`);
        }

        // Settings
        const settings = await prismaProd.setting.findMany();
        if (settings.length > 0) {
            await prismaLocal.setting.deleteMany();
            await prismaLocal.setting.createMany({ data: settings });
            console.log(`✅ Settings synced.`);
        }

        // Pages
        const pages = await prismaProd.page.findMany();
        for (const page of pages) {
            await prismaLocal.page.upsert({
                where: { slug: page.slug },
                update: {
                    content: page.content,
                    sections: page.sections,
                    home_sections: page.home_sections,
                    title: page.title,
                    hero_image: page.hero_image,
                    hero_subtitle: page.hero_subtitle,
                    meta_title: page.meta_title,
                    meta_description: page.meta_description
                },
                create: page
            });
        }
        console.log('✅ Pages synced.');

    } catch (e: any) {
        console.error('❌ Sync Failed:', e.message);
    } finally {
        await prismaProd.$disconnect();
        await prismaLocal.$disconnect();
    }
}

main();
