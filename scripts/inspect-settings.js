const { PrismaClient } = require('@prisma/client');
(async () => {
    const p = new PrismaClient();
    const all = await p.setting.findMany({ select: { id: true, setting_key: true, payu_md5_key: true } });
    console.log('total settings:', all.length);
    console.log('first 5:', all.slice(0, 5));
    const withKey = all.filter(r => r.payu_md5_key);
    console.log('rows with payu_md5_key:', withKey);
    await p.$disconnect();
})();
