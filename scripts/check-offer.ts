
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: 12 },
        });
        console.log(JSON.stringify(offer, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
