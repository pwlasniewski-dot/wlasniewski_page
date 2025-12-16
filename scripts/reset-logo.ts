
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetLogo() {
    try {
        console.log('Resetting logo_url to empty...');
        await prisma.setting.updateMany({
            data: {
                logo_url: '',
                logo_dark_url: ''
            }
        });

        await prisma.setting.upsert({
            where: { setting_key: 'logo_url' },
            create: { setting_key: 'logo_url', setting_value: '' },
            update: { setting_value: '' }
        });

        await prisma.setting.upsert({
            where: { setting_key: 'logo_dark_url' },
            create: { setting_key: 'logo_dark_url', setting_value: '' },
            update: { setting_value: '' }
        });

        console.log('Logo settings cleared.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

resetLogo();
