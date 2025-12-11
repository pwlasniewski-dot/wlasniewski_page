const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('\n=== NAPRAWIANIE USTAWIEŃ ===\n');
  
  // Włącz promo bar
  await prisma.setting.upsert({
    where: { setting_key: 'gift_card_promo_enabled' },
    update: { setting_value: 'true' },
    create: { setting_key: 'gift_card_promo_enabled', setting_value: 'true' }
  });
  console.log('✅ gift_card_promo_enabled: true');
  
  // Upewnij się że shop jest enabled
  await prisma.setting.upsert({
    where: { setting_key: 'gift_card_shop_enabled' },
    update: { setting_value: 'true' },
    create: { setting_key: 'gift_card_shop_enabled', setting_value: 'true' }
  });
  console.log('✅ gift_card_shop_enabled: true');
  
  // Sprawdzenie
  const settings = await prisma.setting.findMany({
    where: {
      setting_key: { in: ['gift_card_promo_enabled', 'gift_card_shop_enabled'] }
    }
  });
  
  console.log('\n📊 Teraz ustawienia:');
  settings.forEach(s => console.log(`  ${s.setting_key}: ${s.setting_value}`));
  
  await prisma.$disconnect();
}

fix().catch(console.error);
