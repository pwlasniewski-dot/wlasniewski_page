require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.setting.findFirst().then(s => {
    // Wypisz wszystkie klucze i wartości (ukryj hasła częściowo)
    for (const [k, v] of Object.entries(s || {})) {
        if (k.includes('secret') || k.includes('key') || k.includes('password')) {
            console.log(`  ${k}: ${v ? v.slice(0,4) + '****' : 'NULL'}`);
        } else {
            console.log(`  ${k}: ${v}`);
        }
    }
    p.$disconnect();
});
