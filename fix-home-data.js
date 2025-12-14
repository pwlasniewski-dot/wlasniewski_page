
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Check if strona-glowna exists
    const home = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' }
    });

    if (!home) {
        console.log('Strona główna not found. Creating...');

        const defaultHero = [
            {
                id: 'default-1',
                image: '/uploads/hero1.jpg', // Placeholder, user will update
                title: 'Fotografia z Pasją',
                subtitle: 'Utrwalamy najpiękniejsze momenty',
                buttonText: 'Zobacz Portfolio',
                buttonLink: '/portfolio',
                enabled: true,
                order: 0
            }
        ];

        const defaultSections = {}; // Empty initially

        await prisma.page.create({
            data: {
                slug: 'strona-glowna',
                title: 'Strona Główna',
                page_type: 'home',
                content: '',
                is_published: true,
                home_sections: JSON.stringify({
                    hero_slider: defaultHero,
                    sections: []
                })
            }
        });
        console.log('Created strona-glowna with default Hero Slider.');
    } else {
        console.log('Strona główna exists.');
        // Optional: If home_sections is missing/null, update it
        if (!home.home_sections) {
            const defaultHero = [
                {
                    id: 'default-1',
                    image: '/uploads/hero1.jpg',
                    title: 'Fotografia z Pasją',
                    subtitle: 'Utrwalamy najpiękniejsze momenty',
                    buttonText: 'Zobacz Portfolio',
                    buttonLink: '/portfolio',
                    enabled: true,
                    order: 0
                }
            ];
            await prisma.page.update({
                where: { slug: 'strona-glowna' },
                data: {
                    home_sections: JSON.stringify({
                        hero_slider: defaultHero,
                        sections: []
                    })
                }
            });
            console.log('Updated strona-glowna with default home_sections.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
