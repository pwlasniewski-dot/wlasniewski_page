const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
    const all = await p.workshop.findMany({ orderBy: { id: 'desc' }, take: 10 });
    console.log(JSON.stringify(all, null, 2));
    await p.$disconnect();
})();
