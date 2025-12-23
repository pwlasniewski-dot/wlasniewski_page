
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPayU() {
    try {
        const s = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        console.log('--- Before Fix ---');
        console.log('POS ID:', s?.payu_merchant_pos_id);
        console.log('Client ID:', s?.payu_client_id);
        console.log('MD5 Key:', s?.payu_md5_key ? '(Present)' : 'NULL');

        // Apply Fix: If POS ID is missing, copy Client ID
        if (!s?.payu_merchant_pos_id && s?.payu_client_id) {
            console.log(`Copying Client ID ${s.payu_client_id} to merchant_pos_id...`);
            await prisma.setting.updateMany({
                data: {
                    payu_merchant_pos_id: s.payu_client_id
                }
            });
            console.log('Update done.');
        } else {
            console.log('POS ID already exists or Client ID missing. No change.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fixPayU();
