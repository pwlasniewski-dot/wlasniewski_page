import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
    const c = await p.nphotoAlbum.count();
    const a = await p.nphotoAlbum.findMany({
        select: { id: true, title: true, slug: true, is_active: true, is_featured: true, category: true, price: true, occasion: true },
        take: 20,
    });
    console.log('Total albumów:', c);
    console.table(a);
    await p.$disconnect();
})();
