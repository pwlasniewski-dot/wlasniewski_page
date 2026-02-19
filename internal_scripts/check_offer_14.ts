
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: 14 },
        });
        console.log('OFFER 14:', JSON.stringify(offer, null, 2));

        if (offer) {
            console.log('Category:', offer.category);
            if (offer.category !== 'komunia') {
                console.log('Offer 14 is NOT categorized as "komunia". This explains the missing input.');
            } else {
                console.log('Offer 14 IS categorized as "komunia". The input should be visible.');
            }
        } else {
            console.log('Offer 14 not found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
