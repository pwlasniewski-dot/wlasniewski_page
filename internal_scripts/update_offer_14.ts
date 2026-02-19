
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Updating Offer 14 category to "komunia"...');
        await prisma.offer.update({
            where: { id: 14 },
            data: { category: 'komunia' }
        });
        console.log('Updated successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
