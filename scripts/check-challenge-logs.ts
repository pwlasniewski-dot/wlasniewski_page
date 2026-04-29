import prisma from '../src/lib/db/prisma';

(async () => {
    const logs = await prisma.systemLog.findMany({
        where: {
            OR: [
                { message: { contains: 'przem091' } },
                { message: { contains: 'pwlasniewski' } },
                { message: { contains: 'Challenge' } },
                { module: 'EMAIL' },
            ],
        },
        orderBy: { created_at: 'desc' },
        take: 20,
    });
    console.log(`Found ${logs.length} logs:`);
    for (const l of logs) {
        console.log(`[${l.created_at.toISOString()}] [${l.module}/${l.level}] ${l.message}`);
    }
    await prisma.$disconnect();
})();
