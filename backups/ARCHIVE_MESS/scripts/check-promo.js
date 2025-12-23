
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
    try {
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });
        console.log('Settings:', settings);

        const cards = await prisma.giftCard.findMany({
            where: {
                status: { in: ['active', 'available', 'sent'] }
            },
            take: 5
        });
        console.log('Active Cards Count:', cards.length);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkSettings();
