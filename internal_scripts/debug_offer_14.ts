
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: 14 },
        });
        console.log('OFFER 14 DATA:', JSON.stringify(offer, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
