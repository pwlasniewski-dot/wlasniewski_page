const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateStats() {
    try {
        console.log('🔄 Migracja statystyk "O Mnie"...');

        const stats = [
            { id: `card-${Date.now()}-1`, title: "500+", description: "Sesji zdjęciowych", icon: "sun", enabled: true },
            { id: `card-${Date.now()}-2`, title: "10+", description: "Lat doświadczenia", icon: "sun", enabled: true },
            { id: `card-${Date.now()}-3`, title: "100%", description: "Zadowolonych klientów", icon: "sun", enabled: true },
            { id: `card-${Date.now()}-4`, title: "∞", description: "Pięknych wspomnień", icon: "sun", enabled: true }
        ];

        const updated = await prisma.page.update({
            where: { slug: 'o-mnie' },
            data: {
                content_cards: JSON.stringify(stats)
            }
        });

        console.log('✅ Zaktualizowano stronę:', updated.title);
        console.log('✅ Dodano statystyki:', stats.length);

    } catch (error) {
        console.error('❌ Błąd migracji:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateStats();
