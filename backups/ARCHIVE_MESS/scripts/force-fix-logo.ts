
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceUpdate() {
    try {
        console.log('Updating ALL settings records...');
        const result = await prisma.setting.updateMany({
            data: {
                logo_url: '/uploads/logo-wgrane.png',
                logo_dark_url: '/uploads/logo-wgrane.png'
            }
        });
        console.log(`Updated ${result.count} records.`);

        // Force KV update too
        const kv = await prisma.setting.findUnique({ where: { setting_key: 'logo_url' } });
        if (kv) {
            await prisma.setting.update({
                where: { setting_key: 'logo_url' },
                data: { setting_value: '/uploads/logo-wgrane.png' }
            });
            console.log('Updated KV logo_url');
        }

        // Verify
        const settings = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        console.log('VERIFICATION FIRST RECORD:', settings?.logo_url);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

forceUpdate();
