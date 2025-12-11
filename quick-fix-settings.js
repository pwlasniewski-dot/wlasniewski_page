const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('\n=== NAPRAWIANIE USTAWIEŃ ===\n');
  
  // 1. Włącz bajerek z kartami
  await prisma.setting.upsert({
    where: { setting_key: 'gift_card_promo_enabled' },
    update: { setting_value: 'true' },
    create: { setting_key: 'gift_card_promo_enabled', setting_value: 'true' }
  });
  console.log('✅ gift_card_promo_enabled: true');
  
  // 2. Włącz sklep
  await prisma.setting.upsert({
    where: { setting_key: 'gift_card_shop_enabled' },
    update: { setting_value: 'true' },
    create: { setting_key: 'gift_card_shop_enabled', setting_value: 'true' }
  });
  console.log('✅ gift_card_shop_enabled: true');
  
  // 3. Ustaw Halloween effect (December = brak, ale możesz zmienić na 'snow')
  await prisma.setting.upsert({
    where: { setting_key: 'seasonal_effect' },
    update: { setting_value: 'snow' },
    create: { setting_key: 'seasonal_effect', setting_value: 'snow' }
  });
  console.log('✅ seasonal_effect: snow (śnieg)');
  
  console.log('\n✅ Wszystkie ustawienia naprawione!\n');
  await prisma.$disconnect();
}

fix().catch(console.error);
