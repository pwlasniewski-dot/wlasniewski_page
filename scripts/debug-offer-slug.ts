import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- OFFER DEBUG: offer-1771439410155 ---');
    try {
        const offer = await prisma.offer.findUnique({
            where: { slug: 'offer-1771439410155' },
            include: {
                sections: {
                    include: {
                        items: true
                    }
                }
            }
        });

        if (offer) {
            console.log(JSON.stringify(offer, null, 2));
        } else {
            console.log('Offer not found.');
        }
    } catch (e: any) {
        console.error('Error fetching offer:', e.message);
    }
}

debug()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
