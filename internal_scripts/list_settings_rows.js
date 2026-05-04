require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.setting.findMany({
    select: {
      id: true,
      setting_key: true,
      updated_at: true,
      payu_client_id: true,
      payu_merchant_pos_id: true,
      payu_environment: true,
      payu_notify_url: true,
      p24_pos_id: true,
      p24_merchant_id: true,
      booking_payment_method: true,
    },
    orderBy: { id: 'asc' },
  });

  console.log('Settings rows:', rows.length);
  for (const r of rows) {
    console.log('---');
    console.log('id:', r.id, 'key:', r.setting_key, 'updated_at:', r.updated_at.toISOString());
    console.log('payu_client_id:', r.payu_client_id || 'NULL');
    console.log('payu_merchant_pos_id:', r.payu_merchant_pos_id || 'NULL');
    console.log('payu_environment:', r.payu_environment || 'NULL');
    console.log('payu_notify_url:', r.payu_notify_url || 'NULL');
    console.log('p24_pos_id:', r.p24_pos_id || 'NULL');
    console.log('p24_merchant_id:', r.p24_merchant_id || 'NULL');
    console.log('booking_payment_method:', r.booking_payment_method || 'NULL');
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
