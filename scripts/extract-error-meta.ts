import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    const errorLog = await prisma.systemLog.findFirst({
        where: { level: 'ERROR' },
        orderBy: { id: 'desc' }
    });

    if (errorLog) {
        console.log('ID:', errorLog.id);
        console.log('Timestamp:', errorLog.created_at);
        console.log('Message:', errorLog.message);
        console.log('Metadata:');
        console.log(errorLog.metadata);
    } else {
        console.log('No error logs found.');
    }
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
