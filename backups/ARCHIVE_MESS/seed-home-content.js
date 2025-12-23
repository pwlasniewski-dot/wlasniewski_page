
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHomeContent() {
    try {
        const page = await prisma.page.findFirst({
            where: { slug: 'strona-glowna' }
        });

        if (!page) {
            console.log('Page not found!');
            return;
        }

        // Default structures
        const parallax = [
            { id: 'parallax-default', title: 'Przykładowy Tytuł', subtitle: 'Opis sekcji', image: '', enabled: true }
        ];

        const cards = [
            { id: 'card-1', title: 'Usługa 1', description: 'Krótki opis', icon: 'camera', enabled: true },
            { id: 'card-2', title: 'Usługa 2', description: 'Krótki opis', icon: 'image', enabled: true },
            { id: 'card-3', title: 'Usługa 3', description: 'Krótki opis', icon: 'star', enabled: true }
        ];

        const palettes = [
            {
                id: 'palette-1',
                title: 'Kolorystyka',
                description: 'Przykładowa paleta',
                colors: [{ hex: '#E8D5B7', name: 'Złoty' }],
                tips: ''
            }
        ];

        await prisma.page.update({
            where: { id: page.id },
            data: {
                parallax_sections: JSON.stringify(parallax),
                content_cards: JSON.stringify(cards),
                content_images: JSON.stringify(palettes),
                about_photo: '', // Ensure it's not null to trigger UI
                about_text_side: 'Tutaj wpisz tekst o sobie...'
            }
        });

        console.log('Successfully seeded Home Page with default Legacy structures.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedHomeContent();
