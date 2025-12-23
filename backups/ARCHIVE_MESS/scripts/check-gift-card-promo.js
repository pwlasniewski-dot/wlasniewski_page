/**
 * Check Gift Card Promo Banner Status
 * Diagnoses why GiftCardPromoBar is not visible
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Gift Card Promo Banner Status...\n');

    // 1. Check settings
    console.log('1️⃣ Checking settings table...');
    const settings = await prisma.setting.findFirst({
        select: {
            gift_card_promo_enabled: true,
            gift_card_promo_title: true,
            gift_card_promo_description: true,
            gift_card_promo_rotation_interval: true
        }
    });

    console.log('   gift_card_promo_enabled:', settings?.gift_card_promo_enabled);
    console.log('   Type:', typeof settings?.gift_card_promo_enabled);
    console.log('   Title:', settings?.gift_card_promo_title || '(not set)');
    console.log('   Interval:', settings?.gift_card_promo_rotation_interval || '(not set)');

    // 2. Check gift cards
    console.log('\n2️⃣ Checking gift cards...');
    const cards = await prisma.giftCard.findMany({
        where: {
            status: { in: ['active', 'available', 'sent'] }
        },
        take: 5,
        select: {
            id: true,
            card_title: true,
            value: true,
            theme: true,
            status: true
        }
    });

    console.log(`   Found ${cards.length} active gift cards:`);
    cards.forEach(card => {
        console.log(`   - ID ${card.id}: ${card.card_title || 'Untitled'} (${card.value} PLN, ${card.theme}, ${card.status})`);
    });

    // 3. Determine visibility
    console.log('\n3️⃣ Visibility analysis:');
    const explicitlyDisabled = settings?.gift_card_promo_enabled === false;
    const hasCards = cards.length > 0;
    const shouldShow = explicitlyDisabled ? false : (settings?.gift_card_promo_enabled ?? hasCards);

    console.log('   Explicitly disabled?', explicitlyDisabled);
    console.log('   Has cards?', hasCards);
    console.log('   Should show banner?', shouldShow ? '✅ YES' : '❌ NO');

    if (!shouldShow) {
        console.log('\n⚠️  Banner will NOT show because:');
        if (explicitlyDisabled) {
            console.log('   - gift_card_promo_enabled is explicitly set to false');
        } else if (!hasCards) {
            console.log('   - No active gift cards found in database');
        }

        console.log('\n💡 To fix:');
        if (explicitlyDisabled) {
            console.log('   1. Go to /admin/settings');
            console.log('   2. Toggle "Włącz pasek promocyjny" to ON');
            console.log('   3. Click "Zapisz wszystkie zmiany"');
        }
        if (!hasCards) {
            console.log('   1. Go to /admin/gift-cards');
            console.log('   2. Create at least one gift card');
            console.log('   3. Ensure status is "active", "available", or "sent"');
        }
    } else {
        console.log('\n✅ Banner SHOULD be visible!');
        console.log('\n   If not visible on frontend, check:');
        console.log('   1. Browser localStorage: giftCardPromoClosed (clear it)');
        console.log('   2. Page URL: banner hides on /karta-podarunkowa and /sklep pages');
        console.log('   3. Browser console for JavaScript errors');
        console.log('   4. Component is in AppShell.tsx (only for !isAdmin)');
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('\n✅ Check complete.');
        process.exit(0);
    })
    .catch(async (e) => {
        console.error('\n❌ Error:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
