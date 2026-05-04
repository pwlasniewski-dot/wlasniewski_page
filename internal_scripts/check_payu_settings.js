require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.setting.findFirst({
    select: {
        payu_merchant_pos_id: true,
        payu_client_id: true,
        payu_client_secret: true,
        payu_md5_key: true,
        payu_environment: true,
        payu_notify_url: true
    }
}).then(s => {
    console.log('PayU settings in DB:');
    console.log('  payu_merchant_pos_id:', s?.payu_merchant_pos_id || '❌ BRAK');
    console.log('  payu_client_id      :', s?.payu_client_id || '❌ BRAK');
    console.log('  payu_client_secret  :', s?.payu_client_secret ? '✅ ustawiony' : '❌ BRAK');
    console.log('  payu_md5_key        :', s?.payu_md5_key ? '✅ ustawiony' : '❌ BRAK');
    console.log('  payu_environment    :', s?.payu_environment || '❌ BRAK');
    console.log('  payu_notify_url     :', s?.payu_notify_url || '❌ BRAK');
    return p.$disconnect();
});
