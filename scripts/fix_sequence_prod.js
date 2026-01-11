const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔌 Connecting to Production Database...');
    console.log('🛠️  Fixing sequence for "media_library"...');

    try {
        // Find the max ID
        const result = await prisma.$queryRaw`SELECT MAX(id) as max_id FROM "media_library"`;
        const maxId = result[0]?.max_id || 0;
        console.log(`ℹ️  Current Max ID: ${maxId}`);

        // Reset sequence to Max ID + 1
        await prisma.$executeRawUnsafe(`
            SELECT setval(pg_get_serial_sequence('media_library', 'id'), ${maxId} + 1, false);
        `);

        console.log('✅ Sequence updated successfully.');
        console.log('🎉 Uploads should work now!');
    } catch (e) {
        console.error('❌ ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
