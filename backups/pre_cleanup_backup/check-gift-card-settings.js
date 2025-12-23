const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.setting.findMany({
    where: {
      setting_key: {
        in: ['gift_card_shop_enabled', 'gift_card_promo_enabled']
      }
    }
  });

  console.log('Current settings:');
  console.log(JSON.stringify(settings, null, 2));

  if (settings.length === 0) {
    console.log('\n⚠️ No settings found! Creating them...');
    
    // Create the settings
    const created = await prisma.setting.createMany({
      data: [
        { setting_key: 'gift_card_shop_enabled', setting_value: 'true' },
        { setting_key: 'gift_card_promo_enabled', setting_value: 'true' }
      ],
      skipDuplicates: true
    });

    console.log('Created:', created);

    const updated = await prisma.setting.findMany({
      where: {
        setting_key: {
          in: ['gift_card_shop_enabled', 'gift_card_promo_enabled']
        }
      }
    });
    console.log('After creation:');
    console.log(JSON.stringify(updated, null, 2));
  }
}

main().catch(console.error).finally(() => process.exit(0));
