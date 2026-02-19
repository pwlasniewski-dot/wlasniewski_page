import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    const emailLog = await prisma.systemLog.findUnique({
        where: { id: 753 }
    });

    if (emailLog) {
        console.log('--- EMAIL LOG 753 METADATA ---');
        console.log(JSON.stringify(emailLog, null, 2));
    } else {
        console.log('Email log not found.');
    }
}

debug()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
