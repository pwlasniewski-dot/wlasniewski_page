const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreHomepage() {
    try {
        console.log('Restoring homepage structure...');

        const defaultSections = {
            hero_slider: [
                {
                    id: 'slide-1',
                    image: '/assets/hero/hero-1.jpg', // Placeholder
                    title: 'Nowoczesna Fotografia',
                    subtitle: 'Utrwalamy najważniejsze momenty',
                    buttonText: 'Zobacz Portfolio',
                    buttonLink: '/portfolio',
                    enabled: true,
                    order: 0
                }
            ],
            sections: [
                {
                    id: 'about',
                    type: 'about',
                    label: 'Sekcja "O mnie"',
                    enabled: true,
                    data: {
                        image: '/assets/about.jpg',
                        title: 'Cześć, jestem Przemek',
                        content: '<p>Tu wpisz swój tekst "O mnie"...</p>',
                        cta1Text: 'Moje Portfolio',
                        cta1Link: '/portfolio',
                        imageShape: 'square',
                        imageSize: 100,
                        textPosition: 'right'
                    }
                },
                {
                    id: 'features',
                    type: 'features',
                    label: 'Kafelki (Features)',
                    enabled: true,
                    data: {
                        features: [
                            { id: 'f1', title: 'Profesjonalizm', items: ['Sprzęt najwyższej klasy', 'Wieloletnie doświadczenie'], enabled: true },
                            { id: 'f2', title: 'Atmosfera', items: ['Luźna atmosfera', 'Bez stresu'], enabled: true },
                            { id: 'f3', title: 'Szybkość', items: ['Zdjęcia w 7 dni', 'Galeria online'], enabled: true }
                        ]
                    }
                },
                {
                    id: 'parallax1',
                    type: 'parallax',
                    label: 'Parallax 1 (Środek)',
                    enabled: true,
                    data: {
                        image: '/assets/parallax1.jpg',
                        title: 'Fotografia to emocje'
                    }
                },
                {
                    id: 'info_band',
                    type: 'info_band',
                    label: 'Sekcja Informacyjna',
                    enabled: true,
                    data: {
                        title: 'Oferta',
                        content: '<p>Sprawdź moją ofertę sesji zdjęciowych...</p>',
                        image: '/assets/info.jpg',
                        position: 'left'
                    }
                },
                {
                    id: 'challenge',
                    type: 'challenge_banner',
                    label: 'Baner Foto Wyzwanie',
                    enabled: true,
                    data: {
                        title: 'Podejmij wyzwanie',
                        content: 'Sprawdź swoje umiejętności',
                        buttonText: 'Sprawdź',
                        buttonLink: '/wyzwanie',
                        effect: 'carousel',
                        photos: []
                    }
                },
                {
                    id: 'testimonials',
                    type: 'testimonials',
                    label: 'Opinie',
                    enabled: true,
                    data: {
                        title: 'Co mówią klienci',
                        subtitle: 'Zaufali mi'
                    }
                }
            ]
        };

        const updated = await prisma.page.upsert({
            where: { slug: 'strona-glowna' },
            update: {
                home_sections: JSON.stringify(defaultSections),
                is_published: true
            },
            create: {
                slug: 'strona-glowna',
                title: 'Strona Główna',
                page_type: 'home',
                home_sections: JSON.stringify(defaultSections),
                is_published: true,
                content: ''
            }
        });

        console.log('Homepage restored successfully:', updated.id);
    } catch (e) {
        console.error('Error restoring homepage:', e);
    } finally {
        await prisma.$disconnect();
    }
}

restoreHomepage();
