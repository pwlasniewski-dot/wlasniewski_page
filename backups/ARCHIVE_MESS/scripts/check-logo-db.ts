
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const s = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        console.log('DB logo_url:', s?.logo_url);

        const kv = await prisma.setting.findUnique({ where: { setting_key: 'logo_url' } });
        console.log('KV logo_url:', kv?.setting_value);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
