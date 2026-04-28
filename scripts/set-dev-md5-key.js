const { PrismaClient } = require('@prisma/client');
(async () => {
    const p = new PrismaClient();
    const s = await p.setting.findFirst({ select: { id: true, payu_md5_key: true } });
    console.log('current:', s);
    if (!s.payu_md5_key) {
        await p.setting.update({ where: { id: s.id }, data: { payu_md5_key: 'TEST_MD5_KEY_FOR_E2E_DEV_ONLY' } });
        console.log('Set test md5 key');
    }
    await p.$disconnect();
})();
