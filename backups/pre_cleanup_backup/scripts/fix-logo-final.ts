
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLogoFinal() {
    try {
        console.log('Updating logo to logo-final.png...');
        await prisma.setting.updateMany({
            data: {
                logo_url: '/uploads/logo-final.png',
                logo_dark_url: '/uploads/logo-final.png'
            }
        });

        // Ensure KV is consistent
        await prisma.setting.upsert({
            where: { setting_key: 'logo_url' },
            create: { setting_key: 'logo_url', setting_value: '/uploads/logo-final.png' },
            update: { setting_value: '/uploads/logo-final.png' }
        });

        console.log('DONE. Logo set to /uploads/logo-final.png on ALL records.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

updateLogoFinal();
