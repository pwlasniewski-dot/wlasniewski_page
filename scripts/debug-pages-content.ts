
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const slugs = ['karta-podarunkowa', 'o-mnie'];

    console.log('--- DEBUGGING PAGES CONTENT ---');

    for (const slug of slugs) {
        const page = await prisma.page.findUnique({
            where: { slug }
        });

        if (!page) {
            console.log(`❌ Page NOT FOUND: ${slug}`);
        } else {
            console.log(`✅ Page FOUND: ${slug}`);
            console.log(`   ID: ${page.id}`);
            console.log(`   Is Published: ${page.is_published}`);

            if (!page.sections) {
                console.log(`   ⚠️ Sections: NULL`);
            } else {
                try {
                    const sections = JSON.parse(page.sections);
                    console.log(`   📦 Sections count: ${sections.length}`);
                    sections.forEach((s: any, i: number) => {
                        console.log(`      [${i}] Type: ${s.type}`);
                        // Log key data for Hero sections
                        if (s.type === 'hero' || s.type === 'parallax' || s.type === 'about') {
                            console.log(`          Data:`, JSON.stringify(s.data || s).substring(0, 100) + '...');
                        }
                    });
                } catch (e) {
                    console.log(`   ❌ Sections JSON Parse Error:`, e);
                    console.log(`   Raw Content:`, page.sections.substring(0, 500));
                }
            }
        }
        console.log('-----------------------------------');
    }
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
