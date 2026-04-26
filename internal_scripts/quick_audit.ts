import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
(async () => {
    const all = await p.user.findMany({
        where: { role: 'CLIENT' },
        select: { id: true, name: true, email: true, created_at: true },
        orderBy: { id: 'asc' }
    });
    console.log('LIVE CLIENTS:', all.length);
    for (const c of all) console.log(`  [${c.id}] ${c.name} <${c.email}>`);
    console.log('OFFERS:', await p.offer.count());
    console.log('ALBUMS:', await p.nphotoAlbum.count());
    console.log('RECS:', await p.offerRecommendedAlbum.count());
    const offer57 = await p.offer.findUnique({ where: { id: 57 }, include: { sections: true } });
    console.log('\nOFFER 57:', offer57 ? `EXISTS (slug=${offer57.slug}, title=${offer57.title}, sections=${offer57.sections.length})` : 'NOT FOUND');
    await p.$disconnect();
})();
