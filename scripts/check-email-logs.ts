import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- EMAIL LOG CHECK ---');
    const logs = await prisma.systemLog.findMany({
        where: { module: 'EMAIL' },
        orderBy: { created_at: 'desc' },
        take: 10
    });

    if (logs.length === 0) {
        console.log('No email logs found.');
    } else {
        console.log(JSON.stringify(logs.map(l => ({
            id: l.id,
            message: l.message,
            metadata: l.metadata,
            created_at: l.created_at
        })), null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
