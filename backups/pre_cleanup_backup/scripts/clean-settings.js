const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanSettings() {
    console.log("--- Cleaning Zombie Settings ---");

    // Delete rows that should be columns or are deprecated
    const keysToDelete = ['payu_test_mode', 'payu_environment', 'payu_pos_id'];

    const result = await prisma.setting.deleteMany({
        where: {
            setting_key: {
                in: keysToDelete
            }
        }
    });

    console.log(`Deleted ${result.count} zombie rows.`);

    // Force update the main row to secure if it's currently stuck (optional, but helpful for user)
    // Actually, let's just log what it is.
    const mainSettings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    if (mainSettings) {
        console.log(`Current Main Row ID: ${mainSettings.id}`);
        console.log(`Current payu_environment: ${mainSettings.payu_environment}`);
    }
}

cleanSettings()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
