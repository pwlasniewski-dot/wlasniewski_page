const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnose() {
  console.log('\n=== DIAGNOSTYKA STRON I SLUGÓW ===\n');
  
  // 1. Sprawdzenie strony "sklep-karty-podarunkowe"
  const shopPage = await prisma.page.findFirst({
    where: {
      slug: { contains: 'sklep' }
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      is_published: true,
      is_in_menu: true
    }
  });
  
  console.log('📄 Strona sklep:');
  if (shopPage) {
    console.log(`  ✅ Znaleziona: ${shopPage.title}`);
    console.log(`  Slug: /${shopPage.slug}`);
    console.log(`  Published: ${shopPage.is_published}`);
    console.log(`  W menu: ${shopPage.is_in_menu}`);
    console.log(`  Content preview: ${shopPage.content?.substring(0, 100) || 'BRAK'}`);
  } else {
    console.log('  ❌ Strona nie znaleziona!');
  }
  
  // 2. Sprawdzenie wszystkich stron
  console.log('\n📋 Wszystkie strony w bazie:');
  const allPages = await prisma.page.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      is_published: true
    },
    orderBy: { title: 'asc' }
  });
  
  allPages.forEach(p => {
    console.log(`  ${p.is_published ? '✅' : '❌'} /${p.slug} - ${p.title}`);
  });
  
  // 3. Sprawdzenie GiftCardPromoBar
  console.log('\n📊 Gift Card Settings:');
  const settings = await prisma.setting.findMany({
    where: {
      setting_key: { in: ['gift_card_promo_enabled', 'gift_card_shop_enabled'] }
    },
    select: { setting_key: true, setting_value: true }
  });
  
  settings.forEach(s => {
    console.log(`  ${s.setting_key}: ${s.setting_value}`);
  });
  
  // 4. Sprawdzenie danych w bazie
  console.log('\n🎁 Gift Cards w bazie:');
  const cards = await prisma.giftCard.findMany({
    take: 5,
    select: { code: true, value: true, status: true }
  });
  console.log(`  Found: ${cards.length}`);
  cards.forEach(c => console.log(`    - ${c.code}: ${c.value} PLN (${c.status})`));
  
  await prisma.$disconnect();
}

diagnose().catch(console.error);
