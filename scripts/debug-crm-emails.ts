import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- LATEST 5 CLIENTS ---');
    const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        orderBy: { created_at: 'desc' },
        take: 5
    });
    console.log(JSON.stringify(clients, null, 2));

    console.log('\n--- LATEST 10 EMAIL LOGS ---');
    const logs = await prisma.systemLog.findMany({
        where: { module: 'EMAIL' },
        orderBy: { created_at: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(logs, null, 2));
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
