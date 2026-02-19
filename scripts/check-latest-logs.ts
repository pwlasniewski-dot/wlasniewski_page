import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('\n--- ABSOLUTE LATEST 20 LOGS (ANY LEVEL) ---');
    const logs = await prisma.systemLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 20
    });
    console.log(JSON.stringify(logs, null, 2));
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
