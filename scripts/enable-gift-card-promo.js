/**
 * Enable Gift Card Promo Banner
 * Sets gift_card_promo_enabled to true
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Enabling Gift Card Promo Banner...\n');

    const firstSetting = await prisma.setting.findFirst({
        orderBy: { id: 'asc' }
    });

    if (!firstSetting) {
        console.log('❌ No settings record found!');
        return;
    }

    console.log('Current value:', firstSetting.gift_card_promo_enabled);

    await prisma.setting.update({
        where: { id: firstSetting.id },
        data: {
            gift_card_promo_enabled: true
        }
    });

    console.log('✅ Updated to: true');

    // Verify
    const updated = await prisma.setting.findFirst({
        select: { gift_card_promo_enabled: true }
    });

    console.log('\n✅ Verified: gift_card_promo_enabled =', updated.gift_card_promo_enabled);
    console.log('\n🎉 Gift Card Promo Banner is now ENABLED!');
    console.log('   It should appear on the homepage and other pages (except /sklep and /karta-podarunkowa)');
}

main()
    .then(async () => {
        await prisma.$disconnect();
        process.exit(0);
    })
    .catch(async (e) => {
        console.error('❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
