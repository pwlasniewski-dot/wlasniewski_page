
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deepCheckHero() {
    try {
        const page = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });

        if (!page || !page.home_sections) {
            console.log("❌ No home_sections found.");
            return;
        }

        const data = JSON.parse(page.home_sections);
        const slides = data.hero_slider;

        console.log(`Type of hero_slider: ${Array.isArray(slides) ? 'Array' : typeof slides}`);

        if (Array.isArray(slides)) {
            console.log(`Count: ${slides.length}`);
            slides.forEach((s, i) => {
                console.log(`Slide #${i + 1}:`);
                console.log(`- ID: ${s.id}`);
                console.log(`- Enabled: ${s.enabled}`);
                console.log(`- Image: ${s.image ? s.image.substring(0, 50) + '...' : 'MISSING'}`);
                console.log(`- Desktop: ${s.image_desktop ? s.image_desktop.substring(0, 50) + '...' : 'MISSING'}`);
                console.log(`- Mobile: ${s.image_mobile ? s.image_mobile.substring(0, 50) + '...' : 'MISSING'}`);
            });
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

deepCheckHero();
