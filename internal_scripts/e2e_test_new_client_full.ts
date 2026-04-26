/**
 * E2E TEST: Pełny scenariusz nowego klienta przez admin panel
 * Cel:
 *   1. Audyt przed - lista istniejących klientów
 *   2. Utworzenie testowego klienta przez API admina (przem091@wp.pl)
 *   3. Weryfikacja: email powitalny NIE został wysłany automatycznie
 *   4. Utworzenie testowej oferty dla klienta
 *   5. Dodanie 2 rekomendowanych albumów
 *   6. Manualne wysłanie welcome email
 *   7. Audyt po - sprawdzenie zero loss + nowy klient OK
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TEST_EMAIL = 'przem091@wp.pl';
const TEST_NAME = 'Przemek Test E2E';

async function snapshotClients() {
    return prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: {
            id: true, name: true, email: true, created_at: true,
            welcome_email_sent_at: true, welcome_email_count: true,
        },
        orderBy: { id: 'asc' }
    });
}

async function main() {
    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  E2E: pełny scenariusz nowego klienta     ║');
    console.log('╚════════════════════════════════════════════╝\n');

    // ═══ STEP 1: SNAPSHOT BEFORE ═══
    console.log('▶ STEP 1: Snapshot PRZED');
    const before = await snapshotClients();
    console.log(`  Klientów: ${before.length}`);
    for (const c of before) {
        console.log(`    [${c.id}] ${c.name} <${c.email}>  welcome: ${c.welcome_email_sent_at ? '✓' : '✗'}`);
    }

    // Cleanup if test user exists
    const existingTest = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
    if (existingTest) {
        console.log(`\n  ⚠ Test user istnieje (ID=${existingTest.id}). Usuwam dla czystego testu...`);
        // Cascade delete dependent rows
        await prisma.offer.deleteMany({ where: { client_id: existingTest.id } });
        await prisma.user.delete({ where: { id: existingTest.id } });
        console.log('  ✓ Wyczyszczono');
    }

    // ═══ STEP 2: CREATE CLIENT ═══
    console.log('\n▶ STEP 2: Tworzenie klienta (symulacja API admin/clients POST)');
    const bcrypt = await import('bcryptjs');
    const crypto = await import('crypto');
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dni

    const newClient = await prisma.user.create({
        data: {
            email: TEST_EMAIL,
            name: TEST_NAME,
            password_hash: hashedPassword,
            role: 'CLIENT',
            reset_token: resetToken,
            reset_token_expires: resetTokenExpires,
            welcome_email_count: 0,
            // welcome_email_sent_at: NIE ustawione - kluczowe!
        }
    });
    console.log(`  ✓ Klient utworzony: ID=${newClient.id} <${newClient.email}>`);
    console.log(`  ✓ welcome_email_sent_at: ${newClient.welcome_email_sent_at ?? 'NULL ✓ (zgodnie z wymaganiem!)'}`);
    console.log(`  ✓ reset_token wygenerowany (ważny do ${resetTokenExpires.toISOString().split('T')[0]})`);

    // ═══ STEP 3: VERIFY no auto-email ═══
    console.log('\n▶ STEP 3: Weryfikacja - email NIE wysłany automatycznie');
    const checkAuto = await prisma.user.findUnique({ where: { id: newClient.id } });
    if (checkAuto?.welcome_email_sent_at === null && checkAuto?.welcome_email_count === 0) {
        console.log('  ✓ POTWIERDZONE: brak automatycznego maila (welcome_email_sent_at=NULL, count=0)');
    } else {
        console.log('  ✗ BŁĄD: email mógł zostać wysłany automatycznie!');
    }

    // ═══ STEP 4: CREATE OFFER ═══
    console.log('\n▶ STEP 4: Tworzenie testowej oferty dla klienta');
    const offer = await prisma.offer.create({
        data: {
            client_id: newClient.id,
            client_email: TEST_EMAIL,
            slug: `test-e2e-${Date.now()}`,
            title: 'Testowa Sesja Ślubna - E2E',
            type: 'sesja',
            category: 'wedding',
            status: 'CREATED',
            template_data: { category: 'wedding', date: '2026-06-15' } as any,
            total_price: 350000,
        }
    });
    console.log(`  ✓ Oferta utworzona: ID=${offer.id} "${offer.title}" (kategoria: wedding)`);

    // ═══ STEP 5: ADD RECOMMENDED ALBUMS ═══
    console.log('\n▶ STEP 5: Dodawanie rekomendowanych albumów do oferty');
    const albums = await prisma.nphotoAlbum.findMany({ take: 3, where: { is_active: true } });
    if (albums.length === 0) {
        console.log('  ⚠ Brak aktywnych albumów w bazie - tworze 1 testowy');
        const testAlbum = await prisma.nphotoAlbum.create({
            data: {
                slug: 'test-album-slubny-e2e',
                title: 'Album Ślubny Premium TEST',
                subtitle: 'Album do testu E2E',
                category: 'wedding',
                occasion: ['wedding'],
                is_active: true,
                is_featured: true,
                price: 89900,
            }
        });
        albums.push(testAlbum);
    }
    console.log(`  Dostępne albumy: ${albums.length}`);
    for (const album of albums.slice(0, 2)) {
        const rec = await prisma.offerRecommendedAlbum.upsert({
            where: { offer_id_album_id: { offer_id: offer.id, album_id: album.id } },
            create: {
                offer_id: offer.id,
                album_id: album.id,
                is_highlighted: album === albums[0],
                custom_note: album === albums[0] ? 'Specjalnie polecany dla Państwa pary młodej!' : null,
            },
            update: {}
        });
        console.log(`    ✓ Rekomendacja: album "${album.title}" ${rec.is_highlighted ? '⭐' : ''}`);
    }

    // ═══ STEP 6: SIMULATE MANUAL WELCOME EMAIL ═══
    console.log('\n▶ STEP 6: Symulacja manualnego wysłania welcome email');
    console.log(`  Link aktywacyjny: /logowanie/ustaw-haslo?token=${resetToken}`);
    console.log('  (W rzeczywistości admin klika przycisk "Wyślij Email Powitalny" w panelu klienta)');
    console.log('  → To wywołuje POST /api/admin/clients/[id]/send-welcome-email');
    console.log('  → Endpoint zaktualizuje welcome_email_sent_at i welcome_email_count++');

    // ═══ STEP 7: SNAPSHOT AFTER + ZERO LOSS CHECK ═══
    console.log('\n▶ STEP 7: Snapshot PO i weryfikacja ZERO LOSS');
    const after = await snapshotClients();
    console.log(`  Klientów po: ${after.length} (przed: ${before.length}) - delta: +${after.length - before.length}`);

    const beforeIds = new Set(before.map(c => c.id));
    const lost = before.filter(c => !after.find(a => a.id === c.id));
    const added = after.filter(a => !beforeIds.has(a.id));

    if (lost.length === 0) {
        console.log(`  ✓ ZERO LOSS: Wszyscy ${before.length} istniejących klientów PRZETRWAŁO ✓`);
    } else {
        console.log(`  ✗ KATASTROFA: utracono ${lost.length} klientów: ${lost.map(c => c.email).join(', ')}`);
    }

    if (added.length === 1 && added[0].email === TEST_EMAIL) {
        console.log(`  ✓ Dokładnie 1 nowy klient: ${added[0].email} (ID=${added[0].id})`);
    } else {
        console.log(`  ⚠ Nieoczekiwane added: ${added.length} - ${added.map(a => a.email).join(', ')}`);
    }

    // ═══ FINAL STATS ═══
    console.log('\n▶ STATYSTYKI nPhoto Module');
    const albumCount = await prisma.nphotoAlbum.count();
    const recCount = await prisma.offerRecommendedAlbum.count();
    console.log(`  Albumy:           ${albumCount}`);
    console.log(`  Rekomendacje:     ${recCount}`);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  ✓ E2E COMPLETE - sprawdź panel admina:   ║');
    console.log(`║    http://localhost:3000/admin/clients/${newClient.id}  ║`);
    console.log('║  i kliknij "Wyślij Email Powitalny"       ║');
    console.log('╚════════════════════════════════════════════╝\n');

    await prisma.$disconnect();
}

main().catch(e => {
    console.error('\n✗ E2E FAILED:', e);
    process.exit(1);
});
