
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLogo() {
    try {
        // Update first record
        const first = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        if (first) {
            await prisma.setting.update({
                where: { id: first.id },
                data: {
                    logo_url: '/uploads/logo-wgrane.png',
                    logo_dark_url: '/uploads/logo-wgrane.png'
                }
            });
            console.log('Updated logo_url in first record');
        }

        // Update KV if exists
        const kv = await prisma.setting.findUnique({ where: { setting_key: 'logo_url' } });
        if (kv) {
            await prisma.setting.update({
                where: { setting_key: 'logo_url' },
                data: { setting_value: '/uploads/logo-wgrane.png' }
            });
            console.log('Updated logo_url KV');
        } else {
            await prisma.setting.create({
                data: {
                    setting_key: 'logo_url',
                    setting_value: '/uploads/logo-wgrane.png',
                    setting_type: 'string',
                    is_public: true
                }
            });
            console.log('Created logo_url KV');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

updateLogo();
