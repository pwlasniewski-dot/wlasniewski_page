import prisma from '../src/lib/db/prisma';

async function main() {
    try {
        const clients = await prisma.user.findMany({
            where: { role: 'CLIENT' },
            take: 10,
            select: { id: true, email: true, name: true, role: true }
        });

        console.log('--- CLIENTS ---');
        console.log(JSON.stringify(clients, null, 2));

        const admins = await prisma.adminUser.findMany({
            take: 5
        });
        console.log('--- ADMINS ---');
        console.log(JSON.stringify(admins, null, 2));

        const offers = await prisma.offer.findMany({
            take: 5,
            select: { id: true, title: true, status: true, client_id: true, pdf_url: true }
        });
        console.log('--- OFFERS ---');
        console.log(JSON.stringify(offers, null, 2));

        const contracts = await prisma.contract.findMany({
            take: 5,
            select: { id: true, status: true, client_id: true, pdf_url: true }
        });
        console.log('--- CONTRACTS ---');
        console.log(JSON.stringify(contracts, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
