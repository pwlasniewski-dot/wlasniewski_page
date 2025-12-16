
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setS3Logo() {
    try {
        const url = 'https://wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com/1765911970162-logo-(2).png';
        console.log(`Setting logo_url to ${url}...`);

        await prisma.setting.updateMany({
            data: {
                logo_url: url,
                logo_dark_url: url
            }
        });

        // Ensure KV
        await prisma.setting.upsert({
            where: { setting_key: 'logo_url' },
            create: { setting_key: 'logo_url', setting_value: url },
            update: { setting_value: url }
        });

        console.log('Done.');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

setS3Logo();
