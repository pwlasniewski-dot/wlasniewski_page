import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('\n--- LATEST 10 ERROR LOGS ---');
    const logs = await prisma.systemLog.findMany({
        where: { level: 'ERROR' },
        orderBy: { created_at: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(logs, null, 2));
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
