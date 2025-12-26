import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('=== VERIFYING PAGES ===');
    const slugs = ['strona-glowna', 'o-mnie', 'karta-podarunkowa', 'rezerwacja'];

    for (const slug of slugs) {
        const page = await prisma.page.findUnique({ where: { slug } });
        if (page) {
            const hasSections = page.sections && JSON.parse(page.sections).length > 0;
            console.log(`Page: ${slug} | Published: ${page.is_published} | Sections: ${hasSections ? 'YES (' + JSON.parse(page.sections).length + ')' : 'NO'}`);
            if (hasSections) {
                const sections = JSON.parse(page.sections);
                sections.forEach((s: any, i: number) => {
                    console.log(`  - Section ${i}: ${s.type}`);
                });
            }
        } else {
            console.log(`Page: ${slug} | NOT FOUND`);
        }
    }
}

main().finally(() => prisma.$disconnect());
