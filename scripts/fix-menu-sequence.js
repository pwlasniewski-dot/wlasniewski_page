
// Force use of local DB to match app environment
process.env.DATABASE_URL = "postgresql://postgres:zWMWbkFpBt@localhost:5432/test_neon";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Diagnosing menu_items sequence issue...');

    try {
        // Check current max ID
        const maxIdResult = await prisma.$queryRaw`SELECT MAX(id) as max_id FROM "menu_items"`;
        const maxId = maxIdResult[0].max_id || 0;
        console.log(`Current MAX(id) in menu_items: ${maxId}`);

        // Reset sequence
        // Note: We use executeRaw for the update operation
        const result = await prisma.$executeRawUnsafe(`
            SELECT setval(pg_get_serial_sequence('"menu_items"', 'id'), COALESCE((SELECT MAX(id) + 1 FROM "menu_items"), 1), false);
        `);

        console.log('Sequence reset command executed.');
        console.log('Trying to create a test item to verify fix...');

        // Verify by creating a dummy item (and then deleting it)
        const testItem = await prisma.menuItem.create({
            data: {
                title: 'Test Sequence Fix',
                url: '#',
                order: 9999,
                menu_type: 'b2c'
            }
        });

        console.log(`Successfully created test item with ID: ${testItem.id}`);

        await prisma.menuItem.delete({
            where: { id: testItem.id }
        });
        console.log('Test item deleted. Fix verified.');

    } catch (e) {
        console.error('Error fixing sequence:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
