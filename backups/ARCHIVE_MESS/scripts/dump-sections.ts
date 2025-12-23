import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.page.findUnique({ where: { slug: 'strona-glowna' } })
    .then(d => {
        if (!d || !d.home_sections) {
            console.log('No home_sections data');
            return;
        }
        const j = JSON.parse(d.home_sections);

        if (j.sections && Array.isArray(j.sections)) {
            console.log(`\nFound ${j.sections.length} sections.`);
            console.log('\n=== FULL SECTIONS DUMP ===\n');
            console.log(JSON.stringify(j.sections, null, 2));
        } else {
            console.log('ERROR: No sections array!');
            console.log('Available keys:', Object.keys(j));
        }
    })
    .finally(() => prisma.$disconnect());
