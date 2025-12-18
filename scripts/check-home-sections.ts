
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHomeSections() {
    try {
        const page = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });

        if (page) {
            console.log(`Page Found: ${page.id}`);
            console.log(`Content (should be empty): '${page.content}'`);
            console.log(`Home Sections Length: ${page.home_sections?.length}`);

            if (page.home_sections) {
                try {
                    const data = JSON.parse(page.home_sections);
                    console.log("--- HERO SLIDER DATA ---");
                    if (data.hero_slider) {
                        console.log(JSON.stringify(data.hero_slider, null, 2));
                    } else {
                        console.log("❌ 'hero_slider' key missing in home_sections");
                    }
                } catch (e: any) {
                    console.log("❌ Error parsing home_sections JSON:", e.message);
                    console.log("Raw:", page.home_sections);
                }
            } else {
                console.log("❌ home_sections is NULL/Empty");
            }
        } else {
            console.log("❌ Page 'strona-glowna' not found");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHomeSections();
