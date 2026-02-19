
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log("Starting debug script...");

async function main() {
    try {
        const offer = await prisma.offer.findUnique({
            where: { id: 5 },
            select: { id: true, template_data: true }
        });

        if (!offer) {
            console.log('Offer 5 not found');
        } else {
            console.log('Offer 5 template_data:');
            console.log(JSON.stringify(offer.template_data, null, 2));
        }
    } catch (error) {
        console.error('Error fetching offer:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
