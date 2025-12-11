const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('\n=== FIXING GIFT CARD SHOP ===\n');
  
  // Enable shop
  await prisma.setting.upsert({
    where: { setting_key: 'gift_card_shop_enabled' },
    update: { setting_value: 'true' },
    create: { setting_key: 'gift_card_shop_enabled', setting_value: 'true' }
  });
  console.log('✅ gift_card_shop_enabled set to true');
  
  // Check current cards
  const cards = await prisma.giftCard.findMany({
    select: { code: true, value: true, theme: true, status: true }
  });
  console.log('\nCurrent gift cards in database:');
  cards.forEach(c => console.log(`  - ${c.code}: ${c.value} PLN (${c.theme}, ${c.status})`));
  
  if (cards.length <= 1) {
    console.log('\n⚠️ Niewystarczająco kart! Dodaję domyślne karty...');
    
    const defaultCards = [
      { code: 'SWIETA2025', value: 1000, theme: 'christmas', status: 'available' },
      { code: 'BDBND', value: 100, theme: 'birthday', status: 'available' },
      { code: 'WEDDING500', value: 500, theme: 'wedding', status: 'available' },
      { code: 'UNIVERSAL250', value: 250, theme: 'universal', status: 'available' },
    ];
    
    for (const card of defaultCards) {
      const exists = cards.some(c => c.code === card.code);
      if (!exists) {
        await prisma.giftCard.create({
          data: {
            code: card.code,
            value: card.value,
            amount: card.value,
            theme: card.theme,
            status: card.status,
            recipient_email: 'shop@example.com',
            recipient_name: 'Recipient',
            card_title: `Karta podarunkowa ${card.value} PLN`,
            card_description: `Wyjątkowy prezent wartości ${card.value} PLN`
          }
        });
        console.log(`  ✅ Created: ${card.code}`);
      }
    }
  }
  
  console.log('\n✅ Shop fixed and ready!');
  await prisma.$disconnect();
}

fix().catch(console.error);
