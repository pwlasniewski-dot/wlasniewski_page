const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixContent() {
    try {
        console.log('🔄 Naprawianie treści strony "O Mnie"...');

        const page = await prisma.page.findUnique({
            where: { slug: 'o-mnie' }
        });

        console.log('Obecna treść:', JSON.stringify(page.content));

        // Reset content to empty string if it looks like JSON garbage
        // or just reset it effectively to remove artifacts.
        // User can re-enter content via Admin.

        await prisma.page.update({
            where: { slug: 'o-mnie' },
            data: {
                content: ''
            }
        });

        console.log('✅ Wyczyszczono pole `content`.');

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixContent();
