
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing media_library sequence...');

    try {
        // Standard Postgres sequence fix
        await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('media_library', 'id'), coalesce(max(id), 0) + 1, false) FROM media_library;
    `);
        console.log('Successfully updated media_library_id_seq');
    } catch (error) {
        console.error('Error fixing sequence:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
