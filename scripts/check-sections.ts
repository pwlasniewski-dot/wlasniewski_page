import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.page.findUnique({ where: { slug: 'strona-glowna' } })
    .then(d => {
        if (!d || !d.home_sections) {
            console.log('No home_sections data');
            return;
        }
        const j = JSON.parse(d.home_sections);
        console.log('Root keys:', Object.keys(j));
        console.log('\n--- SECTIONS ---');
        if (j.sections && Array.isArray(j.sections)) {
            console.log(`Found ${j.sections.length} sections:`);
            j.sections.forEach((s, i) => {
                console.log(`\n[${i}] Type: ${s.type}, ID: ${s.id}, Enabled: ${s.enabled !== false}`);
                if (s.type === 'about') {
                    console.log('  About data:', JSON.stringify(s.data).substring(0, 150));
                }
            });
        } else {
            console.log('No sections array found or not an array');
        }
    })
    .finally(() => prisma.$disconnect());
