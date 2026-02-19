import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- ALL USERS COUNT ---');
    const totalUsers = await prisma.user.count();
    console.log('Total users in DB:', totalUsers);

    console.log('\n--- CLIENTS COUNT ---');
    const clientCount = await prisma.user.count({ where: { role: 'CLIENT' } });
    console.log('Users with role CLIENT:', clientCount);

    console.log('\n--- LATEST 5 CLIENTS DETAILS ---');
    const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
            id: true,
            email: true,
            role: true,
            name: true,
            created_at: true
        }
    });
    console.log(JSON.stringify(clients, null, 2));
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
