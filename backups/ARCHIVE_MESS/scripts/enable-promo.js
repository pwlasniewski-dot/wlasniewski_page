
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enablePromo() {
    try {
        const setting = await prisma.setting.findFirst({
            orderBy: { id: 'asc' }
        });

        if (setting) {
            const updated = await prisma.setting.update({
                where: { id: setting.id },
                data: { gift_card_promo_enabled: true }
            });
            console.log('Updated setting:', updated.gift_card_promo_enabled);
        } else {
            await prisma.setting.create({
                data: {
                    setting_key: 'system_init',
                    setting_value: 'true',
                    gift_card_promo_enabled: true
                }
            });
            console.log('Created setting with promo enabled');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

enablePromo();
