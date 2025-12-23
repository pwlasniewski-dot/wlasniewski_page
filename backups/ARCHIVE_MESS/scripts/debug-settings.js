const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
    console.log("--- Checking Settings in DB ---");
    const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });

    if (settings) {
        console.log("--- Main Settings Record (Columns) ---");
        console.log(`ID: ${settings.id}`);
        console.log(`payu_environment: '${settings.payu_environment}'`);
        console.log(`payu_merchant_pos_id: '${settings.payu_merchant_pos_id}'`);
        console.log(`payu_client_id: '${settings.payu_client_id ? 'SET' : 'NULL'}'`);
        console.log(`payu_client_secret: '${settings.payu_client_secret ? 'SET' : 'NULL'}'`);
    } else {
        console.log("❌ No settings record found.");
    }

    console.log("\n--- Checking for potential PayU duplicates ---");
    const payuRows = await prisma.setting.findMany({
        where: {
            setting_key: {
                in: ['payu_test_mode', 'payu_environment', 'payu_pos_id', 'payu_merchant_pos_id']
            }
        }
    });
    payuRows.forEach(row => {
        console.log(`Row ID ${row.id}: Key=${row.setting_key}, Value=${row.setting_value}`);
    });
}

checkSettings()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
