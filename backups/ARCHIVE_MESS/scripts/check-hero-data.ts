
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkHeroData() {
    try {
        console.log("--- CHECKING RELATIONAL HERO SLIDES ---");
        const slides = await prisma.heroSlide.findMany({
            include: { image: true },
            orderBy: { display_order: 'asc' }
        });

        console.log(`Found ${slides.length} relational hero slides.`);
        slides.forEach(s => {
            console.log(`- [${s.id}] Title: ${s.title}`);
            console.log(`  Image ID: ${s.image_id}`);
            console.log(`  Image URL: ${s.image?.url}`);
            console.log(`  Active: ${s.is_active}`);
        });

        console.log("\n--- CHECKING HOMEPAGE JSON CONTENT ---");
        const homepage = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });

        if (homepage) {
            console.log("Homepage found.");
            try {
                const content = JSON.parse(homepage.content);
                console.log("Root blocks keys:", Object.keys(content));

                // Look for hero-related blocks
                if (Array.isArray(content)) {
                    const heroBlock = content.find((b: any) => b.type === 'hero' || b.id === 'hero-slider');
                    if (heroBlock) {
                        console.log("Found Hero Block in JSON:", JSON.stringify(heroBlock, null, 2));
                    } else {
                        console.log("No specific 'hero' block found in content array.");
                    }
                } else if (content.blocks) {
                    const heroBlock = content.blocks.find((b: any) => b.type === 'hero' || b.id === 'hero-slider');
                    if (heroBlock) {
                        console.log("Found Hero Block in JSON (blocks):", JSON.stringify(heroBlock, null, 2));
                    }
                }

            } catch (e) {
                console.log("Error parsing homepage content JSON:", e.message);
                console.log("Raw content sample:", homepage.content.substring(0, 200));
            }
        } else {
            console.log("❌ Homepage (strona-glowna) NOT FOUND.");
        }

    } catch (error) {
        console.error('Error checking hero data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHeroData();
