const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    
    const logs = await prisma.systemLog.findMany({
        where: {
            module: { in: ['BOOKING', 'EMAIL'] }
        },
        orderBy: { created_at: 'desc' },
        take: 30
    });
    
    console.log('Recent BOOKING and EMAIL logs:');
    logs.forEach(log => {
        console.log(`\n[${log.created_at.toISOString()}] ${log.level} - ${log.module}`);
        console.log(`Message: ${log.message}`);
        if (log.metadata) {
            try {
                const meta = JSON.parse(log.metadata);
                console.log(`Metadata: ${JSON.stringify(meta, null, 2)}`);
            } catch {
                console.log(`Metadata: ${log.metadata}`);
            }
        }
    });
    
    await prisma.$disconnect();
}

main().catch(console.error);
