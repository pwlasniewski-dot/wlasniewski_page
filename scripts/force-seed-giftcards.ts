
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GIFT_CARDS = [
    {
        code: 'BRONZE-STARTER',
        card_title: 'Karta Podarunkowa BRONZE',
        card_description: 'Idealny prezent na start. Obejmuje krótką sesję zdjęciową plenerową lub studyjną.',
        amount: 300,
        value: 300,
        // image_path -> not in schema, ignoring or mapping if needed? No field for image path in schema snippet above?
        // Wait, schema has NO image_path? Let's check schema again. 
        // Schema has NO image_path visible in lines 421-448. It has `card_template` or maybe logic uses ID?
        // Let's stick to required fields.
        is_active: true,
        discount_type: 'amount'
    },
    {
        code: 'SILVER-CHOICE',
        card_title: 'Karta Podarunkowa SILVER',
        card_description: 'Najczęściej wybierany pakiet. Pełna sesja zdjęciowa z pakietem 20 zdjęć.',
        amount: 500,
        value: 500,
        is_active: true,
        discount_type: 'amount'
    },
    {
        code: 'GOLD-VIP',
        card_title: 'Karta Podarunkowa GOLD',
        card_description: 'Ekskluzywna sesja VIP z wizażem i 40 zdjęciami w albumie.',
        amount: 1000,
        value: 1000,
        is_active: true,
        discount_type: 'amount'
    }
];

const MENU_ITEMS = [
    { title: 'Start', url: '/', order: 0, menu_type: 'b2c' },
    { title: 'Portfolio', url: '/portfolio', order: 1, menu_type: 'b2c' },
    { title: 'O mnie', url: '/o-mnie', order: 2, menu_type: 'b2c' },
    { title: 'Oferta', url: '/oferta', order: 3, menu_type: 'b2c' },
    { title: 'Rezerwacja', url: '/rezerwacja', order: 4, menu_type: 'b2c' },
    { title: 'Voucher', url: '/karta-podarunkowa', order: 5, menu_type: 'b2c' },
    { title: 'Blog', url: '/blog', order: 6, menu_type: 'b2c' },
    { title: 'Kontakt', url: '/kontakt', order: 7, menu_type: 'b2c' },

    // B2B Menu
    { title: 'Home B2B', url: '/b2b', order: 0, menu_type: 'b2b' },
    { title: 'Dron / Inspekcje', url: '/dron', order: 1, menu_type: 'b2b' },
    { title: 'Termowizja', url: '/b2b/audyty-termowizyjne', order: 2, menu_type: 'b2b' },
    { title: 'Monitoring', url: '/b2b/monitoring-inwestycji', order: 3, menu_type: 'b2b' },
    { title: 'Kontakt B2B', url: '/b2b/kontakt', order: 4, menu_type: 'b2b' }
];

async function seedMissingData() {
    console.log('🌱 Checking and Seeding Missing Data...');

    // 1. Gift Cards
    const countCards = await prisma.giftCard.count();
    if (countCards === 0) {
        console.log('⚠️ No Gift Cards found. Seeding defaults...');
        for (const card of GIFT_CARDS) {
            await prisma.giftCard.create({ data: card });
        }
        console.log('✅ Seeded 3 Gift Cards.');
    } else {
        console.log('ℹ️ Gift Cards already exist. Skipping.');
    }

    // 2. Menu Items
    const countMenu = await prisma.menuItem.count();
    // Start fresh for menu to fix "zjebany navbar"
    if (countMenu < 5) {
        console.log('⚠️ Menu items look incomplete. Reseeding...');
        // Optional: truncate? No, safe add.
        for (const item of MENU_ITEMS) {
            // Check duplications via url/title combo?
            const existing = await prisma.menuItem.findFirst({
                where: { url: item.url, menu_type: item.menu_type }
            });
            if (!existing) {
                await prisma.menuItem.create({ data: item });
            }
        }
        console.log('✅ Seeded Menu Items.');
    } else {
        console.log('ℹ️ Menu items present. Skipping.');
    }
}

seedMissingData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
