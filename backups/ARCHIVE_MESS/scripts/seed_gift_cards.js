const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding initial gift cards...');

    const cards = [
        {
            code: 'VOUCHER-300',
            amount: 300,
            value: 300,
            discount_type: 'fixed',
            recipient_email: 'placeholder@example.com',
            recipient_name: 'Placeholder',
            status: 'active',
            card_template: 'gold',
            theme: 'gold',
            card_title: 'Złoty Voucher',
            card_description: 'Voucher na sesję zdjęciową o wartości 300 zł'
        },
        {
            code: 'VOUCHER-500',
            amount: 500,
            value: 500,
            discount_type: 'fixed',
            recipient_email: 'placeholder@example.com',
            recipient_name: 'Placeholder',
            status: 'active',
            card_template: 'classic',
            theme: 'wedding',
            card_title: 'Voucher Ślubny',
            card_description: 'Voucher na sesję ślubną o wartości 500 zł'
        }
    ];

    for (const card of cards) {
        const exists = await prisma.giftCard.findUnique({ where: { code: card.code } });
        if (!exists) {
            await prisma.giftCard.create({ data: card });
            console.log(`Created card: ${card.code}`);
        } else {
            console.log(`Card ${card.code} already exists.`);
        }
    }

    // Also enable the shop setting if not enabled
    const shopSetting = await prisma.setting.findFirst({ where: { setting_key: 'gift_card_shop_enabled' } });
    if (!shopSetting) {
        await prisma.setting.create({
            data: { setting_key: 'gift_card_shop_enabled', setting_value: 'true' }
        });
        console.log('Enabled gift card shop setting.');
    } else if (shopSetting.setting_value !== 'true') {
        await prisma.setting.update({
            where: { id: shopSetting.id },
            data: { setting_value: 'true' }
        });
        console.log('Updated gift card shop setting to true.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
