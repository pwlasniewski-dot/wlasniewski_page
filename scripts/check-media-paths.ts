
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMedia() {
    try {
        console.log('--- Recent Media ---');
        const media = await prisma.mediaLibrary.findMany({
            orderBy: { created_at: 'desc' },
            take: 5
        });
        media.forEach(m => {
            console.log(`ID: ${m.id}, Name: ${m.file_name}, Path: ${m.file_path}`);
        });

        console.log('--- Current Settings ---');
        const s = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
        console.log('Main logo_url:', s?.logo_url);
        console.log('Main gift_card_hero_image:', s?.gift_card_hero_image); // Check this too

        const kv = await prisma.setting.findUnique({ where: { setting_key: 'logo_url' } });
        console.log('KV logo_url:', kv?.setting_value);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
checkMedia();
