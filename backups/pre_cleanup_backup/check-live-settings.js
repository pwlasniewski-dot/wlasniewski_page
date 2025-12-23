const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('\n=== DIAGNOSTYKA USTAWIEŃ ===\n');
  
  // Sprawdź co jest w bazie
  const promoSettings = await prisma.setting.findMany({
    where: {
      setting_key: { in: ['gift_card_promo_enabled', 'gift_card_shop_enabled', 'seasonal_effect'] }
    }
  });
  
  console.log('📊 Bieżące ustawienia w bazie:');
  promoSettings.forEach(s => {
    console.log(`  ${s.setting_key}: "${s.setting_value}"`);
  });
  
  // Sprawdź Halloween setting
  const halloween = await prisma.setting.findFirst({
    where: { setting_key: 'seasonal_effect' }
  });
  
  console.log('\n🎃 Halloween effect:');
  console.log(`  Wartość: "${halloween?.setting_value}"`);
  console.log(`  Powinno być: "halloween" lub "snow" dla zimy`);
  
  await prisma.$disconnect();
}

check().catch(console.error);
