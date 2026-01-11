
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

async function main() {
    console.log('--- DEBUG SETTINGS TABLE ---');

    const envPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
    }

    const prisma = new PrismaClient();

    try {
        const allSettings = await prisma.setting.findMany();
        console.log(`Total Settings Records: ${allSettings.length}`);

        allSettings.forEach(s => {
            console.log(`\nID: ${s.id} | Key: ${s.setting_key}`);
            console.log(`SMTP Host: ${s.smtp_host} | User: ${s.smtp_user}`);
            console.log(`PayU POS: ${s.payu_merchant_pos_id} | Env: ${s.payu_environment}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
