import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing database sequences...');

    const tables = [
        { name: 'gift_cards', seq: 'gift_cards_id_seq' },
        { name: 'gift_card_orders', seq: 'gift_card_orders_id_seq' },
        { name: 'bookings', seq: 'bookings_id_seq' },
        { name: 'users', seq: 'users_id_seq' }, // Good measure
    ];

    for (const table of tables) {
        try {
            // Postgres specific: Set sequence to MAX(id) + 1
            // COALESCE(MAX(id), 0) + 1 ensures it works even if table is empty (starting at 1)
            const query = `SELECT setval('${table.seq}', (SELECT COALESCE(MAX(id), 0) + 1 FROM "${table.name}"), false);`;

            await prisma.$executeRawUnsafe(query);
            console.log(`✅ Sequence fixed for ${table.name}`);
        } catch (error) {
            console.error(`❌ Failed to fix sequence for ${table.name}:`, error);
        }
    }

    console.log('🏁 Sequence repair complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
