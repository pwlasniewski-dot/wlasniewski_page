const { PrismaClient } = require('@prisma/client');
(async () => {
    const p = new PrismaClient();
    await p.setting.update({ where: { id: 130 }, data: { payu_md5_key: null } });
    console.log('Cleared payu_md5_key from row id=130');
    await p.$disconnect();
})();
