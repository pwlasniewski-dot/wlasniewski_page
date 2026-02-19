
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: 12 },
        });
        console.log('OFFER 12:', JSON.stringify(offer, null, 2));

        if (offer && offer.category !== 'komunia') {
            console.log('Updating category to komunia...');
            await prisma.offer.update({
                where: { id: 12 },
                data: { category: 'komunia' }
            });
            console.log('Updated.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
