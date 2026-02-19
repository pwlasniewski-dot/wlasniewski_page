
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.offer.update({
            where: { id: 14 },
            data: { status: 'sent' }
        });
        console.log('Offer 14 status updated to "sent". Buttons should be visible.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
