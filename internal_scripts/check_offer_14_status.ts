
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: 14 },
            select: { id: true, status: true, negotiation_enabled: true }
        });
        console.log('OFFER 14 STATUS:', offer);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
