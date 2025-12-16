
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixEnv() {
    try {
        const s = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        if (s) {
            console.log(`Current Env: ${s.payu_environment}`);
            console.log('Forcing to "secure" (Production)...');
            await prisma.setting.update({
                where: { id: s.id },
                data: {
                    payu_environment: 'secure',
                    p24_test_mode: false // Also update boolean flag for consistency
                }
            });
            console.log('Update complete.');
        } else {
            console.log('No settings found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fixEnv();
