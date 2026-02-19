import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    const errorLog = await prisma.systemLog.findFirst({
        where: { level: 'ERROR' },
        orderBy: { created_at: 'desc' }
    });

    if (errorLog) {
        console.log('ID:', errorLog.id);
        console.log('Message:', errorLog.message);
        console.log('Metadata (Raw):');
        console.log(errorLog.metadata);

        try {
            const meta = JSON.parse(errorLog.metadata || '{}');
            console.log('--- ERROR STACK/DETAILS ---');
            console.log(meta.error || 'No error field in metadata');
            console.log(meta.stack || 'No stack field in metadata');
        } catch (e) {
            console.log('Could not parse metadata as JSON');
        }
    } else {
        console.log('No error logs found.');
    }
}

debug()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
