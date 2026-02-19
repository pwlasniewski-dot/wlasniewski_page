import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- SEARCHING FOR ICLOUD USERS ---');
    const icloudUsers = await prisma.user.findMany({
        where: {
            email: {
                contains: 'icloud',
                mode: 'insensitive'
            }
        }
    });
    console.log(JSON.stringify(icloudUsers, null, 2));

    console.log('\n--- LATEST 10 SYSTEM LOGS ---');
    const logs = await prisma.systemLog.findMany({
        orderBy: { created_at: 'desc' },
        take: 10
    });
    console.log(JSON.stringify(logs, null, 2));
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
