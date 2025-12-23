
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHomeContent() {
    try {
        const page = await prisma.page.findFirst({
            where: { slug: 'strona-glowna' }
        });

        console.log('--- PAGE: strona-glowna ---');
        if (!page) {
            console.log('Page not found!');
            return;
        }

        console.log('ID:', page.id);
        console.log('Title:', page.title);

        console.log('\n--- LEGACY FIELDS ---');
        console.log('Parallax Sections (Raw):', page.parallax_sections ? page.parallax_sections.substring(0, 100) + '...' : 'NULL');
        console.log('Content Cards (Raw):', page.content_cards ? page.content_cards.substring(0, 100) + '...' : 'NULL');
        console.log('Color Palettes (Raw):', page.content_images ? page.content_images.substring(0, 100) + '...' : 'NULL');
        console.log('About Photo:', page.about_photo);
        console.log('About Text Side:', page.about_text_side);

        // Attempt parse
        try { if (page.parallax_sections) console.log('Parsed Parallax Count:', JSON.parse(page.parallax_sections).length); } catch (e) { console.log('Parallax Parse Error'); }
        try { if (page.content_cards) console.log('Parsed Cards Count:', JSON.parse(page.content_cards).length); } catch (e) { console.log('Cards Parse Error'); }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHomeContent();
