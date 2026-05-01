/**
 * AUDYT CHAOS SIMULATION — symulacja katastrofy biznesowej.
 *
 * Scenariusz: ruszyła promocja, weszło 8 klientów + admin. System się sypie.
 * Klienci narzekają na: bezpieczeństwo (numer dowodu!), wolne logowanie,
 * wolne zdjęcia, słabe dopasowania, brak edycji zdjęć, brak refundów,
 * niejasny regulamin, RODO, consent na publikację, niezadowolenie z sesji.
 *
 * Skrypt:
 *   1. Tworzy 8 wirtualnych klientów (różne miasta, gender, doświadczenie)
 *      + 1 admina, prowadzi przez pełen flow.
 *   2. Po każdym etapie sprawdza czy system obsługuje brzegowy przypadek.
 *   3. Raportuje WSZYSTKIE znalezione luki z konkretnymi rekomendacjami.
 *
 * Uruchom:  npx tsx internal_scripts/audit_chaos_simulation.ts
 * KEEP=1   — nie czyść danych testowych
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const PREFIX = 'CHAOS_';
const KEEP = process.env.KEEP === '1';

// ============================================================
// HELPERS
// ============================================================
type Sev = 'CRIT' | 'HIGH' | 'MED' | 'LOW' | 'INFO';
const issues: { sev: Sev; area: string; msg: string; fix?: string }[] = [];

function bug(sev: Sev, area: string, msg: string, fix?: string) {
    issues.push({ sev, area, msg, fix });
    const sym = sev === 'CRIT' ? '💣' : sev === 'HIGH' ? '🔥' : sev === 'MED' ? '⚠️ ' : sev === 'LOW' ? '🟡' : 'ℹ️ ';
    console.log(`  ${sym} [${sev}] ${area}: ${msg}`);
    if (fix) console.log(`     → FIX: ${fix}`);
}
function ok(msg: string) { console.log(`  ✅ ${msg}`); }
function header(s: string) { console.log(`\n${'='.repeat(60)}\n  ${s}\n${'='.repeat(60)}`); }

function fileContains(relPath: string, needle: string | RegExp): boolean {
    const abs = path.join(process.cwd(), relPath);
    if (!fs.existsSync(abs)) return false;
    try {
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) {
            // Rekurencyjnie sprawdź pliki w katalogu (tylko *.ts/*.tsx)
            const walk = (dir: string): boolean => {
                for (const entry of fs.readdirSync(dir)) {
                    const full = path.join(dir, entry);
                    const s = fs.statSync(full);
                    if (s.isDirectory()) { if (walk(full)) return true; }
                    else if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
                        const c = fs.readFileSync(full, 'utf8');
                        if (typeof needle === 'string' ? c.includes(needle) : needle.test(c)) return true;
                    }
                }
                return false;
            };
            return walk(abs);
        }
        const content = fs.readFileSync(abs, 'utf8');
        return typeof needle === 'string' ? content.includes(needle) : needle.test(content);
    } catch { return false; }
}
function fileExists(relPath: string): boolean {
    return fs.existsSync(path.join(process.cwd(), relPath));
}

// ============================================================
// AKTORZY
// ============================================================
const ACTORS = [
    { key: 'ania', email: 'chaos.ania@example.com', name: 'Ania', city: 'Toruń', gender: 'female', byear: 1996, exp: 'experienced', comf: 'open' },
    { key: 'beata', email: 'chaos.beata@example.com', name: 'Beata', city: 'Bydgoszcz', gender: 'female', byear: 1990, exp: 'few_times', comf: 'neutral' },
    { key: 'celina', email: 'chaos.celina@example.com', name: 'Celina', city: 'Toruń', gender: 'female', byear: 2002, exp: 'never_modeled', comf: 'shy' },
    { key: 'dorota', email: 'chaos.dorota@example.com', name: 'Dorota', city: 'Warszawa', gender: 'female', byear: 1985, exp: 'experienced', comf: 'open' },
    { key: 'edward', email: 'chaos.edward@example.com', name: 'Edward', city: 'Toruń', gender: 'male', byear: 1992, exp: 'experienced', comf: 'open' },
    { key: 'filip', email: 'chaos.filip@example.com', name: 'Filip', city: 'Bydgoszcz', gender: 'male', byear: 1998, exp: 'never_modeled', comf: 'shy' },
    { key: 'grzes', email: 'chaos.grzegorz@example.com', name: 'Grzegorz', city: 'Toruń', gender: 'male', byear: 1980, exp: 'few_times', comf: 'neutral' },
    { key: 'henio', email: 'chaos.henryk@example.com', name: 'Henryk', city: 'Warszawa', gender: 'male', byear: 1995, exp: 'experienced', comf: 'open' },
] as const;

const profiles: Record<string, any> = {};
const users: Record<string, any> = {};

// ============================================================
// SETUP
// ============================================================
async function setup() {
    header('SETUP — 8 klientów + admin');
    const pwd = await bcrypt.hash('Chaos!2026', 10);

    for (const a of ACTORS) {
        const u = await prisma.user.upsert({
            where: { email: a.email },
            update: {},
            create: {
                email: a.email,
                name: PREFIX + a.name,
                password_hash: pwd,
                phone: '+4850000000' + a.email.length,
                is_active: true,
            },
        });
        users[a.key] = u;
    }
    ok(`Utworzono ${ACTORS.length} userów`);

    // Włącz program globalnie + matching settings podstawowy
    await prisma.setting.updateMany({ data: { foto_match_enabled: true } });
    const ms = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    if (!ms) {
        bug('HIGH', 'SETUP', 'Brak FotoMatchMatchSettings rekordu — admin nigdy nie zapisał.', 'Seed defaultowy w setup admina lub auto-create przy GET.');
    }

    // Tworzę profile dla wszystkich (PENDING)
    for (const a of ACTORS) {
        const existing = await prisma.fotoMatchProfile.findUnique({ where: { user_id: users[a.key].id } });
        const p = existing ?? await prisma.fotoMatchProfile.create({
            data: {
                user_id: users[a.key].id,
                display_name: a.name,
                birth_year: a.byear,
                gender: a.gender,
                city: a.city,
                radius_km: 30,
                interests: ['portret', 'plener'],
                experience: a.exp,
                comfort_level: a.comf,
                status: 'PENDING',
                is_active: false,
                last_active: new Date(),
            },
        });
        profiles[a.key] = p;
    }
    ok(`Utworzono ${ACTORS.length} profili (PENDING)`);
}

// ============================================================
// SCENARIUSZ 1 — BEZPIECZEŃSTWO LOGOWANIA
// ============================================================
async function scenario_security_login() {
    header('1. BEZPIECZEŃSTWO LOGOWANIA — brute force + rate limit');

    if (!fileExists('src/app/api/auth/login/route.ts')) {
        bug('CRIT', 'AUTH', 'Brak endpointu /api/auth/login!');
        return;
    }
    const hasRateLimit = fileContains('src/app/api/auth/login/route.ts', /rate.?limit|throttle|429|RATE_LIMITED/i);
    if (!hasRateLimit) {
        bug('CRIT', 'AUTH', 'Login NIE ma rate-limit. Brute force atak nie wymaga żadnego narzędzia.',
            'Dodać in-memory rate-limit 5 prób / 15 min / email + 20 prób / 15 min / IP w /api/auth/login. Przy przekroczeniu HTTP 429.');
    } else {
        ok('Login ma rate-limit');
    }

    // Czy logujemy próby?
    const hasLogging = fileContains('src/app/api/auth/login/route.ts', /logger|log\(|writeLog|prisma\.log/);
    if (!hasLogging) {
        bug('HIGH', 'AUTH', 'Brak logowania prób loginu (nieudane też).',
            'Dodać writeLog AUTH success/fail z IP + user-agent. Bez tego śledzenie ataku niemożliwe.');
    }

    // Klienci narzekają że "logowanie za długie" — sprawdź czy jest 2FA / email link niedopełniony
    const hasMagicLink = fileExists('src/app/api/auth/magic-link/route.ts');
    if (!hasMagicLink) {
        bug('LOW', 'AUTH', 'Brak passwordless login / magic link — klienci muszą pamiętać hasło, narzekają.',
            'Dodać /api/auth/magic-link (email z one-time link, ważny 15 min).');
    }

    // Czy hasło ma minimalną siłę?
    const registerHasMinPwd = fileContains('src/app/api/auth/register/route.ts', /min\(8\)|min\(10\)|password.*length/i);
    if (!registerHasMinPwd) {
        bug('HIGH', 'AUTH', 'Rejestracja może akceptować hasło "123" — brak walidacji długości/siły.',
            'Walidacja zod: password.min(8).regex(/[A-Z]/).regex(/[0-9]/) w /api/auth/register.');
    }

    ok('Skan bezpieczeństwa loginu zakończony');
}

// ============================================================
// SCENARIUSZ 2 — RODO / DANE WRAŻLIWE (numer dowodu!)
// ============================================================
async function scenario_gdpr() {
    header('2. RODO — dane wrażliwe, retencja, prawo do usunięcia');

    // FotoMatchProfile.id_doc_url — to skan dowodu osobistego!
    bug('CRIT', 'RODO', 'FotoMatchProfile.id_doc_url — przechowujemy SKAN DOWODU OSOBISTEGO bez:\n' +
        '         a) consent klauzuli (osobne TOC dot. weryfikacji),\n' +
        '         b) szyfrowania at-rest,\n' +
        '         c) retencji (po weryfikacji można usunąć),\n' +
        '         d) ograniczenia dostępu (każdy admin widzi).',
        'Pole TYLKO PRZEZ ZAKODOWANE S3 URL z presigned signed URL ważnym 5 min. Po verified_at automatyczne usunięcie z S3 + null w DB. Wymagane consent_id_processing_at na profilu.');

    const hasConsent = fileContains('prisma/schema.prisma', /terms_accepted_at|gdpr_consent|consent_at|privacy_accepted/i);
    if (!hasConsent) {
        bug('HIGH', 'RODO', 'Brak terms_accepted_at / gdpr_consent_at na User i/lub FotoMatchProfile.',
            'Dodać pola: terms_accepted_at DateTime?, gdpr_consent_at DateTime?, marketing_consent_at DateTime? — checkbox podczas onboardingu, zapis IP/UA.');
    }

    const hasGdprExport = fileExists('src/app/api/account/gdpr/export/route.ts') || fileExists('src/app/api/gdpr/export/route.ts');
    if (!hasGdprExport) {
        bug('HIGH', 'RODO', 'Brak endpointu eksportu danych (Art. 20 RODO — przenoszenie danych).',
            'GET /api/account/gdpr/export — zwraca JSON z user + profile + photos + bookings + swipes. Email link do pobrania.');
    }

    const hasGdprDelete = fileExists('src/app/api/account/gdpr/delete/route.ts') || fileExists('src/app/api/account/delete/route.ts');
    if (!hasGdprDelete) {
        bug('HIGH', 'RODO', 'Brak endpointu prawa do usunięcia (Art. 17).',
            'POST /api/account/delete — soft-delete user + cascade FotoMatchProfile.status=DELETED, anonimizacja maila, S3 cleanup. Cron czyści po 30 dniach.');
    }

    // Logowanie dostępu admina do danych wrażliwych
    if (!fileContains('src/app/api/admin/foto-match/profiles/[id]/route.ts', /writeLog|logger.*FOTO_MATCH/i)) {
        bug('MED', 'RODO', 'Admin czyta id_doc_url BEZ audytu kto/kiedy.',
            'writeLog FOTO_MATCH "admin viewed id_doc_url" przy każdym odczycie pola.');
    }

    // Dziecko? 18+ check
    const validateAge = fileContains('src/app/api/foto-match/profile/route.ts', /min\(1920\).*getFullYear\(\) - 18/);
    if (validateAge) {
        ok('Walidacja 18+ na podstawie birth_year obecna');
    } else {
        bug('CRIT', 'RODO', 'Brak walidacji wieku 18+. Można podać dowolny rok.',
            'z.number().max(new Date().getFullYear() - 18).');
    }

    bug('MED', 'RODO', 'Brak weryfikacji wieku NA ZDJĘCIACH (AI age detection).',
        'Rekognition DetectFaces.AgeRange.Low >= 18; jeśli <18 ai_status=REJECTED automatycznie.');
}

// ============================================================
// SCENARIUSZ 3 — REGULAMIN / TERMS / WAITLIST
// ============================================================
async function scenario_terms() {
    header('3. REGULAMIN — niejasne zasady, brak akceptacji');

    if (!fileExists('src/app/regulamin/page.tsx')) {
        bug('CRIT', 'TERMS', 'Brak strony /regulamin (nawet generycznej).',
            'Strona /regulamin z sekcjami: rejestracja, opłaty, anulowanie, refundy 14 dni, RODO, kontakt do reklamacji.');
    }
    if (!fileExists('src/app/regulamin-foto-match/page.tsx')) {
        bug('HIGH', 'TERMS', 'Brak osobnego regulaminu Foto-Match (różne zasady niż foto-sesje).',
            'Strona /regulamin-foto-match z sekcjami: zasady moderacji, weryfikacja tożsamości, ban policy, reklamacje, brak gwarancji dopasowania.');
    }
    if (!fileExists('src/app/polityka-prywatnosci/page.tsx')) {
        bug('CRIT', 'TERMS', 'Brak /polityka-prywatnosci.',
            'Strona z opisem przetwarzania: nazwa Administratora, zakres danych, retencja, prawa, kontakt do IOD.');
    }
    if (!fileContains('src/app/foto-match/onboarding/OnboardingWizard.tsx', /regulamin|terms|akceptuję/i)) {
        bug('HIGH', 'TERMS', 'Onboarding NIE zmusza do akceptacji regulaminu (checkbox).',
            'Krok 1 wizarda: 2 checkboxy (regulamin + RODO). Bez nich submit zablokowany.');
    }
    ok('Skan regulaminu zakończony');
}

// ============================================================
// SCENARIUSZ 4 — UPLOAD ZDJĘĆ + EDYCJA + PERFORMANCE
// ============================================================
async function scenario_photos() {
    header('4. ZDJĘCIA — upload, edycja, kolejność, performance');

    // Reorder?
    const hasReorder = fileExists('src/app/api/foto-match/photos/reorder/route.ts')
        || fileContains('src/app/api/foto-match/photos/[id]/route.ts', /PATCH|PUT.*position/);
    if (!hasReorder) {
        bug('HIGH', 'PHOTOS', 'Brak endpointu reorder zdjęć (drag&drop kolejność).',
            'PATCH /api/foto-match/photos/reorder body {ids: [3,1,2]} — update position w transakcji.');
    }

    // Replace? PATCH na pojedyncze zdjęcie
    const hasReplace = fileContains('src/app/api/foto-match/photos/[id]/route.ts', /PATCH|PUT/);
    if (!hasReplace) {
        bug('MED', 'PHOTOS', 'Nie da się zamienić jednego zdjęcia — tylko delete + upload nowe (po jednym).',
            'PATCH /api/foto-match/photos/[id] body {url} — re-uploaded version, ai_status PENDING.');
    }

    // Set as main / cover photo?
    if (!fileContains('prisma/schema.prisma', /is_main|is_cover|cover_photo_id/)) {
        bug('LOW', 'PHOTOS', 'Brak pola is_main / cover_photo_id — discover zawsze pokazuje pierwsze po position.',
            'Dodać is_main Boolean lub cover_photo_id w FotoMatchProfile + endpoint set-main.');
    }

    // Limit zdjęć?
    if (!fileContains('src/app/api/foto-match/photos/route.ts', /max.*photos|10|MAX_PHOTOS|count.*>=.*\d/i)) {
        bug('MED', 'PHOTOS', 'Brak limitu maksymalnej liczby zdjęć — user może wgrać 1000.',
            'Sprawdzać count() przed uploadem, max 10. HTTP 400 PHOTO_LIMIT_EXCEEDED.');
    }

    // Sygnały performance: czy używamy CDN / signed URL / next/image?
    if (!fileContains('src/app/foto-match/odkryj/DiscoverClient.tsx', /next\/image|loading="lazy"/)) {
        bug('HIGH', 'PERF', 'Discover używa <img> bez next/image i bez lazy. 24 karty = 24 pełne zdjęcia naraz.',
            'Migrować do next/image z sizes lub min. dodać loading="lazy" + width/height. Najlepiej Image Optimization w Next.');
    }
    if (!fileContains('src/app/foto-match/u/[id]/ProfilePublicView.tsx', /next\/image|loading="lazy"/)) {
        bug('MED', 'PERF', 'Profil publiczny — wszystkie zdjęcia ładowane od razu (carousel).',
            'next/image lub loading="lazy" na thumbnailach.');
    }

    // Brak resize na uploadzie?
    if (!fileContains('src/app/api/foto-match/photos/route.ts', /sharp|resize|thumbnail/i)) {
        bug('HIGH', 'PERF', 'Upload nie tworzy thumbnaila — w discover ładujemy oryginały (np. 5MB).',
            'Sharp resize → 800x1067 jpg quality 80 + thumbnail 400x533. Zapisywać 2 URL w schema (url + thumb_url).');
    }

    ok('Skan zdjęć zakończony');
}

// ============================================================
// SCENARIUSZ 5 — DOPASOWANIA "DO DUPY"
// ============================================================
async function scenario_matching() {
    header('5. DOPASOWANIA — czy logika ma sens?');

    // Active matching settings — sprawdzam realne kombinacje
    const ms = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    if (!ms) {
        bug('HIGH', 'MATCH', 'Brak rekordu settings — discover zwróci wszystko bez filtrów.', '');
    } else {
        // Sprawdzenie wzajemnego wykluczania
        if (ms.opposite_gender_only && ms.same_gender_only) {
            bug('CRIT', 'MATCH', 'opposite_gender_only=true I same_gender_only=true RÓWNOCZEŚNIE — discover zwróci 0.',
                'Walidacja PATCH /api/admin/foto-match/match-settings: jeśli oba true → HTTP 400.');
        }
        if (ms.same_experience_level && ms.complementary_experience) {
            bug('HIGH', 'MATCH', 'same_experience_level i complementary_experience razem — sprzeczne, wynik 0.',
                'Walidacja PATCH: oba true → 400 INCOMPATIBLE_EXPERIENCE_FILTERS.');
        }
        if (ms.respect_search_radius && (ms.same_city || false)) {
            bug('LOW', 'MATCH', 'respect_search_radius + same_city — radius bezużyteczny (city ostrzejszy).',
                'Walidacja warning admin UI, nie błąd.');
        }
    }

    // Czy jest scoring (bo sam filter→listę zwraca byle kogo z kraju)?
    if (!fileContains('src/app/api/foto-match/discover/route.ts', /score|weight|sort.*shared/i)) {
        bug('HIGH', 'MATCH', 'Brak scoringu — kandydaci sortowani tylko po last_active. Klient widzi randomowy zestaw, nie "najlepiej dopasowany".',
            'Dodać score = shared_interests*3 + same_city*2 + verified*2 + complementary_exp*1 + 1/distance_km. orderBy score desc.');
    }

    // Czy filtruje SUSPENDED?
    if (!fileContains('src/app/api/foto-match/discover/route.ts', /status:.*'ACTIVE'/)) {
        bug('HIGH', 'MATCH', 'Discover może pokazywać SUSPENDED/REJECTED.', 'Dodać where.status=ACTIVE.');
    } else {
        ok('Discover filtruje status=ACTIVE');
    }

    // Symulacja: Edward (M, Toruń, exp, open) widzi kogo?
    if (profiles.ania && profiles.edward) {
        // Aktywuję wszystkich
        for (const k of Object.keys(profiles)) {
            await prisma.fotoMatchProfile.update({
                where: { id: profiles[k].id },
                data: { status: 'ACTIVE', is_active: true, verified_at: new Date() },
            });
        }
        const candidates = await prisma.fotoMatchProfile.findMany({
            where: {
                id: { not: profiles.edward.id },
                status: 'ACTIVE',
                is_active: true,
                gender: 'female',
                city: { equals: 'Toruń', mode: 'insensitive' },
            },
        });
        ok(`Edward (M, Toruń) widzi ${candidates.length} kobiet z Torunia (oczekiwane: 2 — Ania + Celina)`);
        if (candidates.length !== 2) {
            bug('MED', 'MATCH', `Symulacja zwraca ${candidates.length} zamiast 2 — coś źle z gender lub city.`);
        }
    }
}

// ============================================================
// SCENARIUSZ 6 — SWIPE / MATCH / NIECHCIANE INTERAKCJE
// ============================================================
async function scenario_swipe_safety() {
    header('6. SWIPE & MATCH — bezpieczeństwo interakcji');

    // Block list?
    if (!fileContains('prisma/schema.prisma', /FotoMatchBlock|blocks_sent|blocked_by/)) {
        bug('HIGH', 'SAFETY', 'Brak BLOCKLIST — user nie może zablokować nieprzyjemnej osoby.',
            'Model FotoMatchBlock {id, blocker_id, blocked_id, reason}. Discover/swipe musi wykluczać.');
    }

    // Report?
    if (!fileContains('prisma/schema.prisma', /FotoMatchReport|report_reason/)) {
        bug('CRIT', 'SAFETY', 'Brak ZGŁOSZEŃ (Report) — nie da się zgłosić wulgarnego/oszustwa.',
            'Model FotoMatchReport + endpoint POST /api/foto-match/report + admin queue /admin/foto-match/reports.');
    }

    // Super-like spam check?
    const swipeRoute = 'src/app/api/foto-match/swipe/route.ts';
    if (!fileContains(swipeRoute, /SUPER_LIKE.*limit|daily.*super/i)) {
        bug('MED', 'SAFETY', 'SUPER_LIKE bez limitu — można zalać wszystkich.',
            'Limit 1 super-like / 24h. Liczyć w DB count(action=SUPER_LIKE && created_at>now-1d).');
    }

    // Czy mogę swipe na nie-ACTIVE?
    if (fileContains(swipeRoute, /status:.*'ACTIVE'/) && fileContains(swipeRoute, /is_active:.*true/)) {
        ok('Swipe wymaga target.status=ACTIVE && is_active');
    } else {
        bug('HIGH', 'SAFETY', 'Swipe może targetować SUSPENDED/PENDING.', 'Dodać where.status=ACTIVE.is_active=true.');
    }

    // Czy match daje obu wiadomość/kanał? (fundament wiadomości)
    if (!fileExists('src/app/api/foto-match/messages/route.ts') && !fileExists('src/app/foto-match/wiadomosci/page.tsx')) {
        bug('HIGH', 'UX', 'Match się dzieje, ale BRAK MOŻLIWOŚCI WIADOMOŚCI. Klient: "i co teraz?"',
            'Model FotoMatchMessage {match_id, from_id, to_id, body, read_at} + page /foto-match/wiadomosci + endpoint POST/GET.');
    }

    // Symulacja: Ania likes Edward, Edward likes Ania → match
    if (profiles.ania && profiles.edward) {
        await prisma.fotoMatchSwipe.deleteMany({
            where: {
                OR: [
                    { from_profile_id: profiles.ania.id, to_profile_id: profiles.edward.id },
                    { from_profile_id: profiles.edward.id, to_profile_id: profiles.ania.id },
                ],
            },
        });
        await prisma.fotoMatchSwipe.create({ data: { from_profile_id: profiles.ania.id, to_profile_id: profiles.edward.id, action: 'LIKE' } });
        await prisma.fotoMatchSwipe.create({ data: { from_profile_id: profiles.edward.id, to_profile_id: profiles.ania.id, action: 'LIKE' } });
        // Match detection logika jest w endpoincie POST swipe — manualnie sprawdzamy DB
        const swipeAniaToEdward = await prisma.fotoMatchSwipe.findFirst({
            where: { from_profile_id: profiles.ania.id, to_profile_id: profiles.edward.id },
        });
        if (swipeAniaToEdward && !swipeAniaToEdward.is_match) {
            bug('LOW', 'SWIPE', 'Manualne wstawienie LIKE w DB nie triggeruje match — match dzieje się tylko via HTTP endpoint. OK dla prod, info dla audytu.');
        }
    }
}

// ============================================================
// SCENARIUSZ 7 — REZERWACJA SESJI + PŁATNOŚĆ + REFUND
// ============================================================
async function scenario_booking_refund() {
    header('7. REZERWACJA + REFUND — niezadowolony klient chce kasę');

    // Pole refund w Booking?
    const hasRefundFields = fileContains('prisma/schema.prisma', /refund_amount|refunded_at|cancellation_reason|refund_status/);
    if (!hasRefundFields) {
        bug('CRIT', 'REFUND', 'Booking NIE MA pól refund (refund_amount, refunded_at, refund_status, cancellation_reason).',
            'Migracja: ALTER TABLE bookings ADD refund_amount INT, refunded_at TIMESTAMP, refund_status VARCHAR(20), cancellation_reason TEXT.');
    }

    // Endpoint admin do refundu PayU?
    if (!fileExists('src/app/api/admin/bookings/[id]/refund/route.ts')) {
        bug('CRIT', 'REFUND', 'Brak endpointu admina do zwrotu pieniędzy. PayU refund API nie zaimplementowane.',
            'POST /api/admin/bookings/[id]/refund — wywołuje PayU /v2_1/orders/{orderId}/refunds, aktualizuje booking. Webhook obsłuży confirmation.');
    }

    // Endpoint client do anulowania?
    if (!fileExists('src/app/api/bookings/[id]/cancel/route.ts')) {
        bug('HIGH', 'REFUND', 'Klient nie może sam anulować — musi pisać maile.',
            'POST /api/bookings/[id]/cancel — sprawdza politykę (np. >7 dni przed sesją = 100% refund, 3-7 dni = 50%, <3 = 0%). Trigger admin notification.');
    }

    // Polityka anulowania w settings?
    if (!fileContains('prisma/schema.prisma', /cancellation_policy|refund_policy_days|cancellation_full_refund_days/)) {
        bug('HIGH', 'REFUND', 'Brak konfigurowalnej polityki anulowania w Setting.',
            'Setting fields: cancellation_full_refund_days INT default 7, cancellation_partial_days INT default 3, cancellation_partial_pct INT default 50.');
    }

    // Webhook PayU obsługuje refunded?
    if (!fileContains('src/app/api/payu/notify/route.ts', /refund|REFUNDED/i)) {
        bug('CRIT', 'REFUND', 'Webhook PayU nie obsługuje statusu REFUNDED — refund nie zostanie odnotowany.',
            'W /api/payu/notify dodać branch status=REFUNDED → booking.update {refund_status: COMPLETED, refunded_at: now}.');
    }

    // Klient narzeka: zdjęcia z sesji "do dupy" — czy fotograf ma SLA / klauzulę poprawek?
    if (!fileContains('prisma/schema.prisma', /complaint|reklamac/i)) {
        bug('HIGH', 'COMPLAINT', 'Brak modelu Complaint/Reklamacja — niezadowolony klient nie ma kanału.',
            'Model BookingComplaint {booking_id, body, status, admin_response} + page /strefa-klienta/reklamacja.');
    }

    // 14-dniowe prawo odstąpienia (konsument B2C)?
    if (!fileContains('src/app/regulamin/page.tsx', /14.*dn|odstąpieni/i) && fileExists('src/app/regulamin/page.tsx')) {
        bug('HIGH', 'CONSUMER', 'Regulamin nie wspomina 14-dniowego odstąpienia (Ustawa o prawach konsumenta).',
            'Sekcja w regulaminie + checkbox "wyrażam zgodę na rozpoczęcie świadczenia przed upływem 14 dni" przy rezerwacji.');
    }
}

// ============================================================
// SCENARIUSZ 8 — CONSENT NA PUBLIKACJĘ ZDJĘĆ Z SESJI
// ============================================================
async function scenario_publication_consent() {
    header('8. PUBLIKACJA ZDJĘĆ — zgoda obu stron');

    // FotoMatch jest about parowanie 2 osób → fotograf robi sesję 2 osobom → KAŻDA musi wyrazić zgodę osobno na publikację.
    if (!fileContains('prisma/schema.prisma', /publication_consent|publish_consent|model_release|gallery_consent/i)) {
        bug('CRIT', 'CONSENT', 'Brak Model Release / publication_consent. Fotograf nie wie czy może publikować zdjęcia z sesji "match-pair".',
            'Model FotoMatchSessionConsent {match_id, profile_id, consent_publish, consent_portfolio, consent_marketing, signed_at, ip}. Wymagany od OBU przed sesją.');
    }

    if (!fileExists('src/app/strefa-klienta/zgody/page.tsx')) {
        bug('HIGH', 'CONSENT', 'Brak panelu klienta /strefa-klienta/zgody — klient nie może wycofać/zmienić zgód.',
            'Strona z toggle dla każdej kategorii (publikacja/portfolio/marketing) + log_history.');
    }

    // Galeria publiczna z sesji match-pair: czy sprawdza czy OBA zaznaczyły zgodę?
    if (!fileContains('src/app/api/admin/galleries', /publication_consent|both_consents/i)) {
        bug('CRIT', 'CONSENT', 'Publikacja galerii NIE sprawdza zgód obu uczestników match-pair.',
            'Przy publish_at: assert wszystkie profile w match_id mają consent_publish=true. Inaczej HTTP 400 MISSING_CONSENTS.');
    }
}

// ============================================================
// SCENARIUSZ 9 — ADMIN OVERLOAD (parametryzacja, sypie się logika)
// ============================================================
async function scenario_admin_overload() {
    header('9. ADMIN PRZECIĄŻONY — UI parametryzacji, monitoring');

    // Admin panel: czy widzi MATCH count i swipe rate?
    if (!fileExists('src/app/admin/foto-match/dashboard/page.tsx') && !fileExists('src/app/admin/foto-match/page.tsx')) {
        bug('HIGH', 'ADMIN', 'Brak dashboardu Foto-Match z metrykami (active profiles, daily swipes, daily matches).',
            'Page /admin/foto-match z kafelkami: liczba ACTIVE, średnie zdjęć/profil, swipes/24h, matches/24h, top miasta.');
    } else {
        ok('Admin panel Foto-Match istnieje');
    }

    // Czy match-settings ma walidację mutually exclusive?
    if (!fileContains('src/app/api/admin/foto-match/match-settings/route.ts', /MUTUALLY_EXCLUSIVE|GENDER_MUTUALLY/i)) {
        bug('MED', 'ADMIN', 'Backend nie waliduje opposite_gender_only + same_gender_only razem — UI radio tylko, ale bez backend walidacji można wysłać złośliwy PATCH.',
            'Backend: jeśli body.opposite_gender_only && body.same_gender_only → HTTP 400.');
    }

    // Audyt zmian admina?
    if (!fileContains('src/app/api/admin/foto-match/match-settings/route.ts', /writeLog.*ADMIN|logger.*admin/i)) {
        bug('MED', 'ADMIN', 'PATCH match-settings bez audit-log. Nie wiadomo kto kiedy zmienił filtr i czemu klienci nie widzą nikogo.',
            'writeLog SYSTEM "admin {id} updated match-settings: {diff}".');
    }

    // Admin przeciążony: bulk akcje?
    if (!fileExists('src/app/api/admin/foto-match/profiles/bulk/route.ts')) {
        bug('LOW', 'ADMIN', 'Brak bulk approve/reject dla 50 profili naraz — admin klika ręcznie.',
            'POST /api/admin/foto-match/profiles/bulk body {ids, action}. UI: checkbox + button.');
    }
}

// ============================================================
// SCENARIUSZ 10 — MONITORING / ALERTY / SKALOWALNOŚĆ
// ============================================================
async function scenario_monitoring() {
    header('10. MONITORING — system się sypie, czy wiemy?');

    if (!fileExists('src/app/api/admin/health/route.ts')) {
        bug('HIGH', 'MONITORING', 'Brak /api/admin/health — nikt nie wie czy DB/S3/PayU/Email działają.',
            'GET /api/admin/health: prisma.$queryRaw SELECT 1, S3 ListBuckets, PayU OAuth ping, SendGrid get user. Cron co 5 min, alert email/Discord przy fail.');
    }

    if (!fileExists('src/app/api/cron/foto-match-stats/route.ts')) {
        bug('MED', 'MONITORING', 'Brak cron daily stats (matches_24h, signups_24h) → admin nie ma trendu.',
            'Cron 1/dzień, zapis do tabeli foto_match_daily_stats, query w admin dashboard.');
    }

    // Sentry / error tracking?
    if (!fileContains('package.json', /@sentry|datadog|logrocket/i)) {
        bug('HIGH', 'MONITORING', 'Brak Sentry/DataDog/LogRocket — produkcyjne błędy giną w console.',
            'npm install @sentry/nextjs; init w sentry.server.config.ts + client.config.ts. Free tier wystarczy na start.');
    }

    // Rate limit globalny (middleware)?
    if (!fileContains('src/middleware.ts', /rateLimit|rate-limit/i) && !fileExists('src/middleware.ts')) {
        bug('MED', 'MONITORING', 'Brak globalnego rate-limit middleware — atak DDoS/spam zalewa DB.',
            'Edge middleware z rate-limit per IP (Upstash/Redis lub in-memory).');
    }
}

// ============================================================
// SCENARIUSZ 11 — INDEKSY DB / N+1
// ============================================================
async function scenario_db_perf() {
    header('11. WYDAJNOŚĆ DB — indeksy, N+1');

    // Discover sortuje po last_active — czy ma indeks?
    const hasLastActiveIdx = fileContains('prisma/schema.prisma', /@@index\(\[last_active\]\)|last_active.*@@index/);
    const hasCityIdx = fileContains('prisma/schema.prisma', /@@index\(\[city\]\)/);
    if (!hasLastActiveIdx) {
        bug('HIGH', 'DB', 'Brak indeksu na FotoMatchProfile.last_active — orderBy bez indeksu = full scan.',
            '@@index([last_active]) w schema.prisma + migracja.');
    }
    if (hasCityIdx) ok('Indeks city OK');

    // Swipe — sprawdzamy czy lookup po (from_profile_id, action) ma indeks
    const hasSwipeIdx = fileContains('prisma/schema.prisma', /@@index\(\[from_profile_id, action\]\)/);
    if (hasSwipeIdx) ok('Indeks foto_match_swipe(from_profile_id,action) OK');
    else bug('MED', 'DB', 'Brak indeksu (from_profile_id,action) w foto_match_swipe.', '@@index([from_profile_id, action]).');

    // Composite indeks na (status, is_active, city)?
    if (!fileContains('prisma/schema.prisma', /@@index\(\[status, is_active/)) {
        bug('LOW', 'DB', 'Discover filtruje status+is_active+city — brak composite indeksu.',
            '@@index([status, is_active, city]) na FotoMatchProfile.');
    }
}

// ============================================================
// SCENARIUSZ 12 — GENERAL UX TANTRUMS
// ============================================================
async function scenario_ux_complaints() {
    header('12. UX TANTRUMS — komentarze klientów');

    bug('HIGH', 'UX', '"Logowanie za długie" — formularz email+hasło bez SSO Google/Apple, bez magic link.',
        'NextAuth Google + magic-link via email (Resend/SendGrid). 1-click login.');

    bug('HIGH', 'UX', '"Zdjęcia ładują się za długo" — brak lazy/CDN/thumbnail.',
        'Sharp resize + thumb_url + next/image (patrz scen.4).');

    bug('MED', 'UX', '"Dopasowania do dupy" — brak personalizacji, brak feedback loop.',
        'Po SKIP/LIKE zapamiętać preferencje (np. always-skip-shy → boost open). Reranking ML w przyszłości.');

    bug('MED', 'UX', '"Nie mogę zmienić zdjęcia" — tylko delete + nowy upload.',
        'PATCH /api/foto-match/photos/[id] body {url} (patrz scen.4) + UI "zamień zdjęcie".');

    bug('HIGH', 'UX', '"Pieniędzy nie da się zwrócić" — brak refund flow (patrz scen.7).',
        'Endpoint admin refund + cron + UI w panelu klienta.');

    bug('MED', 'UX', '"Druga strona chce publikować, ja nie" — brak indywidualnej zgody (patrz scen.8).',
        'Model release per-profile.');

    bug('HIGH', 'UX', '"Sesja do dupy, chcę kasę i nie chcę z tego korzystać" — brak procedury reklamacji.',
        'BookingComplaint model + SLA (admin response w 48h) + opcja częściowego zwrotu.');

    bug('LOW', 'UX', 'Klient chce wyłączyć profil ale go nie usunąć (np. break od appki) — brak PAUSE.',
        'Status PAUSED (różne od SUSPENDED). Toggle w panelu klienta.');
}

// ============================================================
// CLEANUP
// ============================================================
async function cleanup() {
    if (KEEP) {
        console.log('\n[KEEP=1] Pomijam cleanup.');
        return;
    }
    header('CLEANUP — usuwam dane testowe');
    const ids = Object.values(users).map((u: any) => u.id);
    await prisma.fotoMatchSwipe.deleteMany({
        where: {
            OR: [
                { from_profile: { user_id: { in: ids } } },
                { to_profile: { user_id: { in: ids } } },
            ],
        },
    });
    await prisma.fotoMatchPhoto.deleteMany({ where: { profile: { user_id: { in: ids } } } });
    await prisma.fotoMatchReferral.deleteMany({
        where: {
            OR: [
                { referrer: { user_id: { in: ids } } },
                { invited_profile: { user_id: { in: ids } } },
            ],
        },
    });
    await prisma.fotoMatchProfile.deleteMany({ where: { user_id: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    ok('Usunięto.');
}

// ============================================================
// REPORT
// ============================================================
function report() {
    console.log('\n\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║          RAPORT KOŃCOWY — CHAOS SIMULATION                       ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');

    const counts = { CRIT: 0, HIGH: 0, MED: 0, LOW: 0, INFO: 0 };
    for (const i of issues) counts[i.sev]++;
    console.log(`\n  💣 CRIT: ${counts.CRIT}    🔥 HIGH: ${counts.HIGH}    ⚠️  MED: ${counts.MED}    🟡 LOW: ${counts.LOW}\n`);

    const byArea = new Map<string, typeof issues>();
    for (const i of issues) {
        if (!byArea.has(i.area)) byArea.set(i.area, []);
        byArea.get(i.area)!.push(i);
    }
    for (const [area, list] of byArea) {
        console.log(`\n──── ${area} (${list.length}) ────`);
        for (const i of list) {
            console.log(`  [${i.sev}] ${i.msg}`);
            if (i.fix) console.log(`         FIX: ${i.fix}`);
        }
    }

    console.log('\n\nREKOMENDACJA PRIORYTETÓW (przed ponownym launch promo):');
    console.log('  1. CRITY (rate-limit login, RODO id_doc, refund flow, PayU webhook REFUNDED, Report, model release, terms strona)');
    console.log('  2. HIGHs (terms accept, gdpr export/delete, scoring discover, blocklist, messages, monitoring/Sentry, perf zdjęć)');
    console.log('  3. MEDy (audit log admin, photo replace, thumbnails, cancel api klienta)');

    if (counts.CRIT > 0) {
        console.log('\n  ⛔ ZABLOKUJ PROMO. Rozwiąż CRITy → re-audit.');
        process.exitCode = 1;
    } else if (counts.HIGH > 5) {
        console.log('\n  ⚠️  Możesz puścić soft-launch (max 50 userów) i równolegle fixować HIGH.');
    } else {
        console.log('\n  ✅ Można puszczać.');
    }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('\n🎬 CHAOS SIMULATION — Foto-Match po promocji\n');
    try {
        await setup();
        await scenario_security_login();
        await scenario_gdpr();
        await scenario_terms();
        await scenario_photos();
        await scenario_matching();
        await scenario_swipe_safety();
        await scenario_booking_refund();
        await scenario_publication_consent();
        await scenario_admin_overload();
        await scenario_monitoring();
        await scenario_db_perf();
        await scenario_ux_complaints();
    } catch (e: any) {
        console.error('\n❌ Symulacja przerwana:', e?.message || e);
        if (e?.stack) console.error(e.stack);
    } finally {
        await cleanup();
        report();
        await prisma.$disconnect();
    }
}

main();
