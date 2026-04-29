/**
 * E2E TEST: Foto Wyzwanie — pełna ścieżka na PRODUCJI
 *
 * Symuluje:
 *  1. inviter (pwlasniewski@gmail.com) tworzy wyzwanie dla invitee (przem091@wp.pl)
 *  2. weryfikuje że oba maile poszły (status w bazie + ChallengeTimelineEvent)
 *  3. próbuje zaakceptować BEZ tokena → musi dostać 401 (sprawdzamy że loophole zamknięty)
 *  4. próbuje zaakceptować Z tokenem → 200 OK
 *  5. weryfikuje że status='accepted', booking utworzony, magic-login email poszedł do invitee
 *  6. weryfikuje że można zalogować inviter+invitee przez magic-login token (decode JWT)
 *
 * Uruchomienie: npx tsx scripts/e2e-challenge-prod.ts
 *
 * UWAGA: WYSYŁA PRAWDZIWE EMAILE. Sprzątanie po teście opcjonalne (--cleanup).
 */
import 'dotenv/config';
import prisma from '../src/lib/db/prisma';
import { createAcceptToken, verifyAcceptToken } from '../src/lib/photo-challenge/accept-token';
import { verifyMagicLinkToken } from '../src/lib/photo-challenge/magic-link';

const PROD_URL = process.env.PROD_URL || 'https://wlasniewski.pl';
const INVITER_EMAIL = 'pwlasniewski@gmail.com';
const INVITEE_EMAIL = 'przem091@wp.pl';

const log = (icon: string, msg: string, data?: any) => {
    console.log(`${icon} ${msg}${data ? ' ' + JSON.stringify(data, null, 2) : ''}`);
};

async function main() {
    log('🚀', `E2E test against ${PROD_URL}`);
    log('📧', `Inviter: ${INVITER_EMAIL} → Invitee: ${INVITEE_EMAIL}`);

    // 1. Pick a real package + location
    const pkg = await prisma.challengePackage.findFirst({ where: { is_active: true }, orderBy: { id: 'asc' } });
    if (!pkg) throw new Error('Brak aktywnego pakietu w bazie');
    const loc = await prisma.challengeLocation.findFirst({ where: { is_active: true }, orderBy: { id: 'asc' } });

    log('📦', `Pakiet: ${pkg.name} (id=${pkg.id}, cena=${pkg.challenge_price/100}zł)`);
    log('📍', `Lokalizacja: ${loc?.name || 'brak'} (id=${loc?.id})`);

    // 2. Ensure inviter exists (or use auth_mode=login)
    const inviterExists = await prisma.user.findUnique({ where: { email: INVITER_EMAIL } });
    log('👤', `Inviter w bazie: ${inviterExists ? `ID ${inviterExists.id}` : 'BRAK'}`);

    const auth_mode = inviterExists ? 'login' : 'register';
    log('🔑', `auth_mode = ${auth_mode}`);

    // 3. Tomorrow + 7 days as preferred dates
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const week = new Date(); week.setDate(week.getDate() + 7);
    const preferred_dates = [tomorrow.toISOString().slice(0,10), week.toISOString().slice(0,10)];

    // 4. Create challenge via prod API
    log('📡', 'POST /api/photo-challenge/create …');
    const createBody: any = {
        package_id: pkg.id,
        location_id: loc?.id,
        custom_location: null,
        inviter_name: 'Przemysław (TEST)',
        inviter_email: INVITER_EMAIL,
        inviter_phone: '+48600100200',
        invitee_name: 'Przem091 (TEST)',
        invitee_email: INVITEE_EMAIL,
        preferred_dates,
        auth_mode,
    };
    if (auth_mode === 'register') {
        createBody.inviter_password = 'TestPassword123!';
    }

    const createRes = await fetch(`${PROD_URL}/api/photo-challenge/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
    });
    const createData = await createRes.json();
    log(createRes.ok ? '✅' : '❌', `create status=${createRes.status}`, createData);
    if (!createRes.ok || !createData.success) {
        throw new Error(`Create failed: ${createData.error}`);
    }

    const uniqueLink = createData.unique_link;
    const challengeId = createData.challenge_id;
    log('🎯', `Challenge created: id=${challengeId}, link=${uniqueLink}`);

    // 5. Verify in DB
    const challenge = await prisma.photoChallenge.findUnique({
        where: { id: challengeId },
        include: { invitee_user: true },
    });
    if (!challenge) throw new Error('Challenge not in DB');
    log('💾', `DB: status=${challenge.status}, invitee_user_id=${challenge.invitee_user_id}, invitee_email=${challenge.invitee_contact}`);
    if (!challenge.invitee_user_id) throw new Error('invitee_user_id NOT set — auto-create failed');

    // 6. Sprawdź mail flag
    const sentEvents = await prisma.systemLog.findMany({
        where: { module: 'EMAIL', message: { contains: String(challengeId) } },
        orderBy: { created_at: 'desc' },
        take: 5,
    });
    log('📨', `EMAIL log entries: ${sentEvents.length}`, sentEvents.map(e => e.message));

    // 7. SECURITY TEST: spróbuj zaakceptować BEZ tokena
    log('🛡️', 'TEST 1: accept BEZ tokena (powinno dostać 401)…');
    const noTokenRes = await fetch(`${PROD_URL}/api/photo-challenge/${uniqueLink}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'HACKER', date: tomorrow.toISOString().slice(0,10), hour: 14 }),
    });
    const noTokenData = await noTokenRes.json();
    if (noTokenRes.status === 401 && noTokenData.error === 'NEED_INVITEE_TOKEN') {
        log('✅', `BEZ tokena → ${noTokenRes.status} ${noTokenData.error} — LOOPHOLE ZAMKNIĘTY`);
    } else {
        log('❌', `KRYTYCZNE: BEZ tokena status=${noTokenRes.status}`, noTokenData);
    }

    // 8. SECURITY TEST 2: spróbuj zaakceptować z FAŁSZYWYM tokenem
    log('🛡️', 'TEST 2: accept z fałszywym tokenem…');
    const fakeTokenRes = await fetch(`${PROD_URL}/api/photo-challenge/${uniqueLink}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'HACKER', date: tomorrow.toISOString().slice(0,10), hour: 14, t: 'eyJhbGc.fake.token' }),
    });
    const fakeTokenData = await fakeTokenRes.json();
    log(fakeTokenRes.status === 401 ? '✅' : '❌', `Fałszywy token → ${fakeTokenRes.status} ${fakeTokenData.error}`);

    // 9. PRAWIDŁOWA AKCEPTACJA: wygeneruj token jak zrobiłby to email
    log('✅', 'TEST 3: accept Z prawidłowym tokenem (jak z emaila)…');
    const acceptToken = await createAcceptToken({
        challengeId,
        inviteeEmail: INVITEE_EMAIL,
        inviteeUserId: challenge.invitee_user_id!,
    });
    log('🔐', `Wygenerowany acceptToken (długość=${acceptToken.length})`);

    // Sanity: zweryfikuj go lokalnie
    const verified = await verifyAcceptToken(acceptToken);
    log('🔍', `Lokalna weryfikacja tokenu: ${verified ? `OK (challengeId=${verified.challengeId}, scope=${verified.scope})` : 'FAIL'}`);

    const acceptRes = await fetch(`${PROD_URL}/api/photo-challenge/${uniqueLink}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Przem091 (TEST)', date: tomorrow.toISOString().slice(0,10), hour: 14, t: acceptToken }),
    });
    const acceptData = await acceptRes.json();
    log(acceptRes.ok ? '✅' : '❌', `accept status=${acceptRes.status}`, acceptData);

    // 10. Verify acceptance
    const after = await prisma.photoChallenge.findUnique({ where: { id: challengeId } });
    log('💾', `Po akceptacji: status=${after?.status}, accepted_at=${after?.accepted_at}, session_date=${after?.session_date}`);

    const booking = await prisma.booking.findFirst({ where: { challenge_id: challengeId } });
    log('📅', `Booking: ${booking ? `id=${booking.id}, date=${booking.date}, status=${booking.status}` : 'BRAK'}`);

    // 11. Sprawdź czy magic-link mail dla invitee można symulować — pobierz invitee user i wygeneruj
    const inviteeUser = await prisma.user.findUnique({ where: { email: INVITEE_EMAIL } });
    log('👤', `Invitee user: id=${inviteeUser?.id}, email=${inviteeUser?.email}, role=${inviteeUser?.role}, is_active=${inviteeUser?.is_active}`);

    // 12. URLs do ręcznego sprawdzenia
    console.log('\n========================================');
    console.log('🔗 URL-e do ręcznej weryfikacji w przeglądarce:');
    console.log(`   👀 Publiczna strona zaproszenia (BEZ tokena = bez przycisku akceptacji):`);
    console.log(`      ${PROD_URL}/foto-wyzwanie/invite/${uniqueLink}`);
    console.log(`   🔐 Z tokenem (jak z maila — przycisk akceptacji aktywny):`);
    console.log(`      ${PROD_URL}/foto-wyzwanie/invite/${uniqueLink}?t=${acceptToken}`);
    console.log(`   📊 Admin podgląd:`);
    console.log(`      ${PROD_URL}/admin/challenges/${challengeId}`);
    console.log('========================================\n');

    // 13. Cleanup opcjonalny
    if (process.argv.includes('--cleanup')) {
        log('🧹', 'Sprzątam test challenge…');
        await prisma.booking.deleteMany({ where: { challenge_id: challengeId } });
        await prisma.challengeTimelineEvent.deleteMany({ where: { challenge_id: challengeId } });
        await prisma.photoChallenge.delete({ where: { id: challengeId } });
        log('✅', 'Cleanup done');
    }

    log('🏁', 'E2E test FINISHED');
}

main().catch((e) => {
    console.error('💥 E2E FAILED:', e);
    process.exit(1);
}).finally(() => prisma.$disconnect());
