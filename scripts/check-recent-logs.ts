import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- CHECKING LOGS FROM LAST 30 MINS ---');
    const logs = await prisma.systemLog.findMany({
        where: {
            created_at: {
                gte: new Date(Date.now() - 30 * 60 * 1000)
            }
        },
        orderBy: { created_at: 'desc' },
        take: 20
    });

    if (logs.length === 0) {
        console.log('No recent logs found.');
    } else {
        console.log(JSON.stringify(logs.map(l => ({
            id: l.id,
            level: l.level,
            module: l.module,
            message: l.message,
            created_at: l.created_at
        })), null, 2));
    }
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
