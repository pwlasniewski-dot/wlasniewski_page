const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('\n=== TESTING GIFT CARD ENDPOINT ===\n');
  
  // Test shop enabled
  const shopEnabled = await prisma.setting.findFirst({
    where: { setting_key: 'gift_card_shop_enabled' }
  });
  console.log('Shop enabled:', shopEnabled?.setting_value);
  
  // Test cards in DB
  const allCards = await prisma.giftCard.findMany({
    select: { code: true, value: true, theme: true, status: true }
  });
  console.log('\nAll cards in DB:', allCards);
  
  // Test cards with status filter
  const filteredCards = await prisma.giftCard.findMany({
    where: {
      status: { in: ['active', 'available', 'sent'] }
    },
    select: { code: true, value: true, theme: true, status: true }
  });
  console.log('\nFiltered cards (active/available/sent):', filteredCards);
  
  await prisma.$disconnect();
}

test().catch(console.error);
