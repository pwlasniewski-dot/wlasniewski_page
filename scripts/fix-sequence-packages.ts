import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixSequence() {
    try {
        console.log('Fixing packages_id_seq...');

        // 1. Get Max ID
        const maxIdResult = await prisma.$queryRaw`SELECT MAX(id) as max_id FROM "packages"`;
        const maxId = (maxIdResult as any)[0]?.max_id || 0;
        console.log('Current MAX ID:', maxId);

        // 2. Reset Sequence
        // Note: In Neon/Postgres, checking if sequence name is standard.
        // Usually "packages_id_seq".
        const nextId = Number(maxId) + 1;
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE packages_id_seq RESTART WITH ${nextId}`);

        console.log(`Sequence reset to ${nextId}.`);
    } catch (e) {
        console.error('Error fixing sequence:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixSequence();
