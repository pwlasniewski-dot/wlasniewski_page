
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHeroSlides() {
    try {
        const slides = await prisma.heroSlide.findMany({
            orderBy: { order: 'asc' }
        });

        console.log(`Found ${slides.length} hero slides.`);
        slides.forEach(s => {
            console.log(`- [${s.id}] Title: ${s.title}`);
            console.log(`  Desktop: ${s.desktop_image_url}`);
            console.log(`  Mobile: ${s.mobile_image_url}`);
            console.log(`  Fallback: ${s.image_url}`);
            console.log(`  Active: ${s.is_active}`);
        });

    } catch (error) {
        console.error('Error checking slides:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHeroSlides();
