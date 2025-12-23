const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkContent() {
    try {
        console.log('🔍 Sprawdzanie zawartości strony "O Mnie"...');

        const page = await prisma.page.findUnique({
            where: { slug: 'o-mnie' }
        });

        if (page) {
            console.log('\n--- CONTENT ---');
            console.log(page.content);
            console.log('\n--- ABOUT PHOTO TEXT ---');
            console.log(page.about_text_side);
            console.log('\n--- META DESCRIPTION ---');
            console.log(page.meta_description);
            console.log('\n--- CONTENT CARDS (JSON) ---');
            console.log(page.content_cards);
        } else {
            console.log('❌ Nie znaleziono strony.');
        }

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkContent();
