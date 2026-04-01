import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== FIXING INTERNAL LINKS (remove /b2b/ prefix) ===\n');

    const cities = ['grudziadz', 'inowroclaw', 'brodnica', 'swiecie', 'chelmno', 'mogilno'];

    for (const city of cities) {
        const page = await prisma.page.findUnique({
            where: { slug: city }
        });

        if (!page) continue;

        const sections = JSON.parse(page.sections as string);
        let changed = false;

        sections.forEach((s: any) => {
            if (s.buttonLink && s.buttonLink.startsWith('/b2b/')) {
                console.log(`  Fixing: ${s.buttonLink} → ${s.buttonLink.replace('/b2b/', '/')}`);
                s.buttonLink = s.buttonLink.replace('/b2b/', '/');
                changed = true;
            }
        });

        if (changed) {
            await prisma.page.update({
                where: { slug: city },
                data: {
                    sections: JSON.stringify(sections),
                    updated_at: new Date()
                }
            });
            console.log(`✅ ${city} updated\n`);
        } else {
            console.log(`✓ ${city} already clean\n`);
        }
    }

    console.log('🎯 All links fixed! Now URLs are clean:');
    console.log('   aeroanaliza.pl/grudziadz');
    console.log('   aeroanaliza.pl/inowroclaw');
    console.log('   etc...');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
