
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function debugHomeData() {
    try {
        const page = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });

        if (page) {
            console.log("Page found. Processing...");
            const data = {
                id: page.id,
                slug: page.slug,
                home_sections: page.home_sections ? JSON.parse(page.home_sections) : null,
                sections: page.sections ? JSON.parse(page.sections) : null,
                content: page.content
            };

            fs.writeFileSync('home_data_debug.json', JSON.stringify(data, null, 2));
            console.log("Data saved to home_data_debug.json");

            if (data.home_sections && data.home_sections.hero_slider) {
                console.log(`Hero Slider has ${data.home_sections.hero_slider.length} slides.`);
            } else {
                console.log("Hero Slider is missing in home_sections.");
            }
        } else {
            console.log("Page 'strona-glowna' not found.");
        }
    } catch (error: any) {
        console.error("Error:", error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugHomeData();
