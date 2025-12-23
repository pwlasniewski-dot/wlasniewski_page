
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPayU() {
    try {
        const s = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        console.log('--- PayU DB Values ---');
        console.log('ID:', s?.id);
        console.log('Environment:', s?.payu_environment);
        console.log('POS ID (payu_merchant_pos_id):', s?.payu_merchant_pos_id);
        console.log('Client ID:', s?.payu_client_id);
        console.log('Client Secret:', s?.payu_client_secret ? '(Present)' : '(Empty)');

        // Check KV just in case
        const kvPos = await prisma.setting.findUnique({ where: { setting_key: 'payu_pos_id' } });
        console.log('KV payu_pos_id:', kvPos?.setting_value);

        const kvEnv = await prisma.setting.findUnique({ where: { setting_key: 'payu_environment' } });
        console.log('KV payu_environment:', kvEnv?.setting_value);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkPayU();
