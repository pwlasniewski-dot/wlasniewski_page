import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

(async () => {
    console.log('▶ CLEANUP TESTOWYCH DANYCH (PRODUKCJA)\n');

    // Snapshot przed
    const before = {
        clients: await p.user.count({ where: { role: 'CLIENT' } }),
        offers: await p.offer.count(),
        albums: await p.nphotoAlbum.count(),
        recs: await p.offerRecommendedAlbum.count(),
    };
    console.log('PRZED:', before);

    // 1. Usuń rekomendacje dla oferty 57
    const delRecs = await p.offerRecommendedAlbum.deleteMany({ where: { offer_id: 57 } });
    console.log(`✓ Usunięto rekomendacji: ${delRecs.count}`);

    // 2. Usuń ofertę 57 (cascade usuwa też sections/negotiations)
    try {
        const offer = await p.offer.findUnique({ where: { id: 57 } });
        if (offer) {
            // Usuń zależne ręcznie żeby nie strzelił constraint
            await p.offerSection.deleteMany({ where: { offer_id: 57 } });
            await p.negotiation.deleteMany({ where: { offer_id: 57 } });
            await p.offer.delete({ where: { id: 57 } });
            console.log(`✓ Usunięto ofertę 57: "${offer.title}"`);
        } else {
            console.log('  Oferta 57 już nie istnieje');
        }
    } catch (e: any) {
        console.log(`  ⚠ Oferta 57: ${e.message}`);
    }

    // 3. Usuń klienta przem091@wp.pl (#27)
    const test = await p.user.findUnique({ where: { email: 'przem091@wp.pl' } });
    if (test) {
        // Skasuj jego wszystkie oferty na wszelki wypadek
        const otherOffers = await p.offer.findMany({ where: { client_id: test.id }, select: { id: true } });
        const otherOfferIds = otherOffers.map(o => o.id);
        if (otherOfferIds.length > 0) {
            await p.offerRecommendedAlbum.deleteMany({ where: { offer_id: { in: otherOfferIds } } });
            await p.offerSection.deleteMany({ where: { offer_id: { in: otherOfferIds } } });
            await p.negotiation.deleteMany({ where: { offer_id: { in: otherOfferIds } } });
        }
        await p.offer.deleteMany({ where: { client_id: test.id } });
        await p.user.delete({ where: { id: test.id } });
        console.log(`✓ Usunięto klienta: ${test.name} <${test.email}> (ID=${test.id})`);
    } else {
        console.log('  Klient przem091@wp.pl już nie istnieje');
    }

    // 4. Usuń testowy album
    const testAlbum = await p.nphotoAlbum.findUnique({ where: { slug: 'test-album-slubny-e2e' } });
    if (testAlbum) {
        await p.offerRecommendedAlbum.deleteMany({ where: { album_id: testAlbum.id } });
        await p.nphotoAlbum.delete({ where: { id: testAlbum.id } });
        console.log(`✓ Usunięto testowy album: "${testAlbum.title}"`);
    } else {
        console.log('  Testowy album już nie istnieje');
    }

    // Snapshot po
    const after = {
        clients: await p.user.count({ where: { role: 'CLIENT' } }),
        offers: await p.offer.count(),
        albums: await p.nphotoAlbum.count(),
        recs: await p.offerRecommendedAlbum.count(),
    };
    console.log('\nPO:    ', after);
    console.log('\nDelta: clients', after.clients - before.clients,
        '| offers', after.offers - before.offers,
        '| albums', after.albums - before.albums,
        '| recs', after.recs - before.recs);

    // Lista pozostałych klientów - weryfikacja zero loss
    const remaining = await p.user.findMany({
        where: { role: 'CLIENT' },
        select: { id: true, name: true, email: true },
        orderBy: { id: 'asc' }
    });
    console.log('\n▶ POZOSTALI KLIENCI:');
    for (const c of remaining) console.log(`  [${c.id}] ${c.name} <${c.email}>`);

    await p.$disconnect();
    console.log('\n✓ CLEANUP COMPLETE');
})();
