const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    console.log('Tworzę początkowe strony...');

    await prisma.page.upsert({
        where: { slug: 'jak-sie-ubrac' },
        update: {},
        create: {
            slug: 'jak-sie-ubrac',
            title: 'Jak się ubrać na sesję?',
            content: '<p>Podstawowe wskazówki dotyczące ubioru na sesję zdjęciową.</p>',
            hero_image: 'https://wlasniewski.pl/assets/portfolio/Rodzinnie/Sesja%20w%20mie%C5%9Bcie%20Toru%C5%84/sesja-rodzinna-torun-bulwar-filadelfijski-kadr-szeroki-2025-06.webp',
            hero_subtitle: 'Praktyczny przewodnik po stylizacjach',
            is_published: true,
            content_images: JSON.stringify([
                {
                    id: 'meadow',
                    title: 'Sesja na łące',
                    description: 'Naturalne, ciepłe kolory harmonizujące z zielenią',
                    colors: [
                        { hex: '#E8D5B7', name: 'Kremowy beż' },
                        { hex: '#C9A87C', name: 'Piaskowy brąz' },
                        { hex: '#A8B89A', name: 'Miętowa zieleń' },
                    ],
                    tips: 'Stonowane kolory ziemi idealnie komponują się z zielenią.'
                },
                {
                    id: 'city',
                    title: 'Sesja w mieście',
                    description: 'Kontrastowe kolory dla miejskiego klimatu',
                    colors: [
                        { hex: '#4A5568', name: 'Granatowy' },
                        { hex: '#718096', name: 'Stalowy szary' },
                        { hex: '#CBD5E0', name: 'Jasny szary' },
                    ],
                    tips: 'Mocne kolory świetnie wyglądają na tle architektury.'
                }
            ])
        }
    });

    await prisma.page.upsert({
        where: { slug: 'o-mnie' },
        update: {},
        create: {
            slug: 'o-mnie',
            title: 'O mnie',
            content: '<p>Cześć! Jestem Przemysław, fotografem z pasją.</p>',
            hero_image: 'https://wlasniewski.pl/assets/portfolio/Sesje%20indywidualne/Miej%20swoje%205%20minut/IMG_4925.webp',
            hero_subtitle: 'Fotograf rodzinny i ślubny',
            is_published: true
        }
    });

    console.log('✅ Strony utworzone!');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
