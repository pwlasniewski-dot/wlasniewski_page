
const { PrismaClient } = require('@prisma/client');

// PROD Connection
const PROD_URL = process.env.DATABASE_URL || '';

async function main() {
    const prisma = new PrismaClient({ datasources: { db: { url: PROD_URL } } });
    try {
        console.log('🔍 Checking PROD data...');

        // Check HeroSlide count
        const slides = await prisma.heroSlide.findMany();
        console.log(`PROD Hero Slides Count: ${slides.length}`);
        if (slides.length > 0) console.log('First Slide:', slides[0]);

        // Check Home Page content (sometimes hero is in JSON sections)
        const homePage = await prisma.page.findUnique({ where: { slug: 'home' } });
        console.log('PROD Home Page:', homePage ? 'Found' : 'Not Found');
        if (homePage) {
            console.log('Home Page Title:', homePage.hero_title);
            console.log('Home Page Hero Image:', homePage.hero_image);
            console.log('Home Page Sections (Snippet):', JSON.stringify(homePage.sections).substring(0, 200));
        }

    } catch (e) {
        console.error('PROD Check Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
