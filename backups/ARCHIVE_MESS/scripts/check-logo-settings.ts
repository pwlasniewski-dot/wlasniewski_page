
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLogo() {
    try {
        const settings = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });
        console.log('--- Logo Settings ---');
        console.log('logo_url:', settings?.logo_url);
        console.log('logo_dark_url:', settings?.logo_dark_url);
        console.log('logo_size:', settings?.logo_size);

        // Also check if any key-value overrides exist
        const kvLogo = await prisma.setting.findUnique({ where: { setting_key: 'logo_url' } });
        console.log('KV logo_url:', kvLogo?.setting_value);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkLogo();
