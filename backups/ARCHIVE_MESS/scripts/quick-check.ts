import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

prisma.page.findUnique({ where: { slug: 'strona-glowna' } })
    .then(d => {
        if (!d || !d.home_sections) {
            console.log('No data');
            return;
        }
        const j = JSON.parse(d.home_sections);
        console.log('Keys:', Object.keys(j));
        console.log('hero_slider exists:', !!j.hero_slider);
        console.log('hero_slider is array:', Array.isArray(j.hero_slider));
        console.log('hero_slider length:', j.hero_slider?.length);
        if (j.hero_slider && j.hero_slider[0]) {
            console.log('First slide sample:', JSON.stringify(j.hero_slider[0]).substring(0, 200));
        }
    })
    .finally(() => prisma.$disconnect());
