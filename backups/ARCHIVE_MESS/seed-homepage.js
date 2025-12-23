const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    console.log('Tworzę stronę główną...');

    await prisma.page.upsert({
        where: { slug: 'strona-glowna' },
        update: {},
        create: {
            slug: 'strona-glowna',
            title: 'Strona główna',
            content: '',
            is_published: true,
            home_sections: JSON.stringify({
                hero_slider: [],
                about_section: {
                    title: 'Cześć! Jestem Przemek.',
                    content: '',
                    image: '',
                    enabled: true
                },
                features: []
            })
        }
    });

    console.log('✅ Strona główna utworzona!');
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
