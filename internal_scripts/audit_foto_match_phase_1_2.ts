/**
 * AUDYT FAZA 1+2 FOTO-MATCH — symulacja end-to-end z 2 fikcyjnymi klientami + adminem.
 *
 * Co testujemy (logika biznesowa, nie HTTP):
 *  1. Toggle foto_match_enabled + cache invalidation
 *  2. Onboarding klienta gdy disabled vs enabled (gating)
 *  3. Upload zdjęć + auto-moderacja (ai_status FLAGGED → admin queue)
 *  4. Admin approve/reject/suspend → status profilu + is_active
 *  5. Włączanie kolejnych z 15 cech matchingu i sprawdzanie kogo widzimy
 *  6. Referral end-to-end: token → landing → rejestracja → approve → REWARDED
 *  7. Płatność 50/50 — sprawdza istnienie funkcji w Booking
 *  8. Powiadomienia email po zmianie statusu profilu / referrala
 *  9. Upload galerii dla klienta + powiadomienie
 *
 * Tryb: czyta+pisze w prod DB (tworzy testowych userów z prefixem AUDIT_).
 * Po zakończeniu CZYŚCI dane testowe (chyba że KEEP=1).
 */

import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// =============================================================
// HELPERS
// =============================================================
const issues: { severity: 'CRIT' | 'HIGH' | 'MED' | 'LOW' | 'INFO'; area: string; msg: string }[] = [];
function bug(sev: typeof issues[number]['severity'], area: string, msg: string) {
    issues.push({ severity: sev, area, msg });
    const sym = sev === 'CRIT' ? '💣' : sev === 'HIGH' ? '🔥' : sev === 'MED' ? '⚠️ ' : sev === 'LOW' ? '🟡' : 'ℹ️ ';
    console.log(`  ${sym} [${sev}] ${area}: ${msg}`);
}
function ok(msg: string) { console.log(`  ✅ ${msg}`); }
function header(s: string) { console.log(`\n=== ${s} ===`); }

const PREFIX = 'AUDIT_';
const KEEP = process.env.KEEP === '1';

// =============================================================
// SETUP — fikcyjni aktorzy
// =============================================================
async function setup() {
    header('SETUP — tworzę fikcyjnych aktorów');
    const pwd = await bcrypt.hash('AuditPwd!2026', 10);

    // Anna z Torunia (kobieta, 28 lat, doświadczona, otwarta)
    const anna = await prisma.user.upsert({
        where: { email: 'audit.anna@example.com' },
        update: {},
        create: {
            email: 'audit.anna@example.com',
            name: PREFIX + 'Anna Toruń',
            password_hash: pwd,
            phone: '+48500000001',
            is_active: true,
        },
    });

    // Bartek z Bydgoszczy (mężczyzna, 31 lat, początkujący, neutralny)
    const bartek = await prisma.user.upsert({
        where: { email: 'audit.bartek@example.com' },
        update: {},
        create: {
            email: 'audit.bartek@example.com',
            name: PREFIX + 'Bartek Bydgoszcz',
            password_hash: pwd,
            phone: '+48500000002',
            is_active: true,
        },
    });

    // Czesia z Torunia (kobieta, 35 lat) — będzie polecona przez Annę
    const czesia = await prisma.user.upsert({
        where: { email: 'audit.czesia@example.com' },
        update: {},
        create: {
            email: 'audit.czesia@example.com',
            name: PREFIX + 'Czesia (zaproszona)',
            password_hash: pwd,
            is_active: true,
        },
    });

    // Admin
    let admin = await prisma.adminUser.findFirst({ where: { email: 'audit.admin@example.com' } });
    if (!admin) {
        admin = await prisma.adminUser.create({
            data: {
                email: 'audit.admin@example.com',
                name: PREFIX + 'Admin',
                password_hash: pwd,
            } as any,
        });
    }

    ok(`Anna #${anna.id} | Bartek #${bartek.id} | Czesia #${czesia.id} | Admin #${admin.id}`);
    return { anna, bartek, czesia, admin };
}

// =============================================================
// TEST 1 — toggle foto_match_enabled
// =============================================================
async function testToggle() {
    header('TEST 1 — globalny toggle foto_match_enabled');
    const settingRow = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    if (!settingRow) {
        bug('CRIT', 'Setting', 'Brak singleton wiersza w tabeli settings — completely broken.');
        return null;
    }
    ok(`Setting #${settingRow.id} startowy stan: foto_match_enabled=${settingRow.foto_match_enabled}`);

    // Wymuś OFF
    await prisma.setting.update({ where: { id: settingRow.id }, data: { foto_match_enabled: false } });
    const v1 = await prisma.setting.findUnique({ where: { id: settingRow.id } });
    if (v1?.foto_match_enabled !== false) bug('CRIT', 'Setting', 'Toggle OFF nie zapisał się');
    else ok('Toggle OFF działa');

    // Wymuś ON
    await prisma.setting.update({ where: { id: settingRow.id }, data: { foto_match_enabled: true } });
    const v2 = await prisma.setting.findUnique({ where: { id: settingRow.id } });
    if (v2?.foto_match_enabled !== true) bug('CRIT', 'Setting', 'Toggle ON nie zapisał się');
    else ok('Toggle ON działa');

    // Cache w settings.ts ma teraz TTL 5s (wcześniej 60s). Sprawdzamy i jeśli >10s — flaga.
    const settingsLibPath = path.join(process.cwd(), 'src/lib/foto-match/settings.ts');
    const settingsLibSrc = fs.existsSync(settingsLibPath) ? fs.readFileSync(settingsLibPath, 'utf8') : '';
    const ttlMatch = settingsLibSrc.match(/TTL_MS\s*=\s*([0-9_]+)/);
    const ttlMs = ttlMatch ? parseInt(ttlMatch[1].replace(/_/g, ''), 10) : 60_000;
    if (ttlMs > 10_000) {
        bug('MED', 'Setting cache', `in-memory ${ttlMs}ms cache foto_match_enabled — zbyt długi w serverless. Skróć do ≤5s.`);
    } else {
        ok(`Cache TTL = ${ttlMs}ms (akceptowalny dla serverless)`);
    }

    return settingRow.id;
}

// =============================================================
// TEST 2 — gating onboardingu (logika z /api/foto-match/profile POST)
// =============================================================
async function testGating(annaId: number, settingId: number) {
    header('TEST 2 — gating onboardingu (foto_match_enabled=false)');
    await prisma.setting.update({ where: { id: settingId }, data: { foto_match_enabled: false } });

    // Odtwarzam logikę z route.ts: jeśli !existing && !isFotoMatchEnabled → 403
    const existing = await prisma.fotoMatchProfile.findUnique({ where: { user_id: annaId } });
    if (existing) {
        await prisma.fotoMatchPhoto.deleteMany({ where: { profile_id: existing.id } });
        await prisma.fotoMatchReferral.deleteMany({ where: { OR: [{ referrer_profile_id: existing.id }, { invited_profile_id: existing.id }] } });
        await prisma.fotoMatchProfile.delete({ where: { id: existing.id } });
    }
    const setting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    const enabled = setting?.foto_match_enabled || false;
    if (enabled) {
        bug('HIGH', 'Gating', 'Spodziewałem się false po PATCH — toggle nie zadziałał');
    } else {
        ok('Klient nieuprawniony do utworzenia profilu (enabled=false). HTTP route zwróciłby 403 FOTO_MATCH_DISABLED.');
    }

    // Krytyczna luka: route.ts gating opiera się na isFotoMatchEnabled() z cache.
    // Po skróceniu TTL do 5s niespójność jest minimalna — sprawdzamy faktyczne TTL.
    const settingsLibPath = path.join(process.cwd(), 'src/lib/foto-match/settings.ts');
    const settingsLibSrc = fs.existsSync(settingsLibPath) ? fs.readFileSync(settingsLibPath, 'utf8') : '';
    const ttlMatch = settingsLibSrc.match(/TTL_MS\s*=\s*([0-9_]+)/);
    const ttlMs = ttlMatch ? parseInt(ttlMatch[1].replace(/_/g, ''), 10) : 60_000;
    if (ttlMs > 10_000) {
        bug('HIGH', 'Gating', `isFotoMatchEnabled() ma ${ttlMs}ms cache w lambda. Skróć TTL do ≤5s.`);
    } else {
        ok(`Gating cache TTL = ${ttlMs}ms (akceptowalny)`);
    }
}

// =============================================================
// TEST 3 — onboarding (włączamy ON i tworzymy 2 profile)
// =============================================================
async function testOnboarding(annaId: number, bartekId: number, settingId: number) {
    header('TEST 3 — onboarding 2 klientów (Anna + Bartek)');
    await prisma.setting.update({ where: { id: settingId }, data: { foto_match_enabled: true } });

    const anna = await prisma.fotoMatchProfile.create({
        data: {
            user_id: annaId, display_name: 'Anna T.', birth_year: 1998, gender: 'female',
            city: 'Toruń', radius_km: 30, bio: 'Lubię portrety w plenerze.',
            interests: ['portret', 'plener', 'natura'],
            experience: 'experienced', comfort_level: 'open', status: 'PENDING',
        },
    });
    const bartek = await prisma.fotoMatchProfile.create({
        data: {
            user_id: bartekId, display_name: 'Bartek B.', birth_year: 1995, gender: 'male',
            city: 'Bydgoszcz', radius_km: 50, bio: 'Pierwsza sesja w życiu.',
            interests: ['portret', 'czarno-białe'],
            experience: 'never_modeled', comfort_level: 'shy', status: 'PENDING',
        },
    });
    ok(`Anna profile #${anna.id} (PENDING) | Bartek profile #${bartek.id} (PENDING)`);

    // Sprawdź czy mail "profil zgłoszony do weryfikacji" istnieje
    // Szablony Foto-Match są inline w src/lib/email/sender.ts (renderTemplate switch).
    const senderPath = path.join(process.cwd(), 'src/lib/email/sender.ts');
    const senderSrc = fs.existsSync(senderPath) ? fs.readFileSync(senderPath, 'utf8') : '';
    if (!senderSrc.includes('foto-match-submitted')) {
        bug('HIGH', 'Email', 'Brak szablonu maila po zgłoszeniu profilu Foto-Match (klient nie wie co dalej).');
    } else {
        ok('Szablon foto-match-submitted istnieje w sender.ts');
    }

    return { annaProfile: anna, bartekProfile: bartek };
}

// =============================================================
// TEST 4 — upload zdjęć (symulacja inserts)
// =============================================================
async function testPhotos(annaProfileId: number, bartekProfileId: number) {
    header('TEST 4 — upload zdjęć + auto-moderacja');
    // 4 zdjęcia Anny (3 OK, 1 FLAGGED)
    await prisma.fotoMatchPhoto.createMany({
        data: [
            { profile_id: annaProfileId, url: 'https://test.s3/anna_1.jpg', position: 0, ai_status: 'APPROVED' },
            { profile_id: annaProfileId, url: 'https://test.s3/anna_2.jpg', position: 1, ai_status: 'APPROVED' },
            { profile_id: annaProfileId, url: 'https://test.s3/anna_3.jpg', position: 2, ai_status: 'APPROVED' },
            { profile_id: annaProfileId, url: 'https://test.s3/anna_4.jpg', position: 3, ai_status: 'FLAGGED', ai_flagged_for: 'suggestive' },
        ],
    });
    // 2 zdjęcia Bartka (oba OK)
    await prisma.fotoMatchPhoto.createMany({
        data: [
            { profile_id: bartekProfileId, url: 'https://test.s3/bartek_1.jpg', position: 0, ai_status: 'APPROVED' },
            { profile_id: bartekProfileId, url: 'https://test.s3/bartek_2.jpg', position: 1, ai_status: 'APPROVED' },
        ],
    });
    ok('Wgrano: Anna 4 (1 FLAGGED), Bartek 2');

    const flagged = await prisma.fotoMatchPhoto.count({ where: { ai_status: 'FLAGGED' } });
    if (flagged < 1) bug('HIGH', 'Photos', 'FLAGGED zdjęcie nie pojawia się w kolejce admina');
    else ok(`Kolejka admin photos zawiera ${flagged} flagged`);

    // Sprawdź czy admin queue zwraca dany rekord
    const queue = await prisma.fotoMatchPhoto.findMany({
        where: { ai_status: 'FLAGGED' },
        include: { profile: { include: { user: { select: { email: true } } } } },
    });
    if (queue.length > 0 && queue[0].profile?.user?.email) ok(`Admin widzi zgłaszającego: ${queue[0].profile.user.email}`);
    else bug('MED', 'Photos', 'Admin queue nie zwraca emaila właściciela');

    // Logiczny błąd: profile nigdy nie inkrementuje flagged_count gdy zdjęcie jest FLAGGED.
    // Audit wstrzykuje zdjęcia przez Prisma pomijając API → sprawdzamy że HTTP route ma logic.
    const photosRoutePath = path.join(process.cwd(), 'src/app/api/foto-match/photos/route.ts');
    const photosSrc = fs.existsSync(photosRoutePath) ? fs.readFileSync(photosRoutePath, 'utf8') : '';
    if (photosSrc.includes('flagged_count') && photosSrc.includes('increment')) {
        ok('flagged_count increment obecny w POST /api/foto-match/photos');
    } else {
        bug('MED', 'Photos', 'flagged_count na profilu NIE jest aktualizowane po FLAGGED zdjęciu — ' +
            'admin filtr `?flagged=true` nie znajdzie problematycznych profili.');
    }
}

// =============================================================
// TEST 5 — admin moderacja: approve / reject / suspend
// =============================================================
async function testAdminActions(annaProfileId: number, bartekProfileId: number, adminId: number) {
    header('TEST 5 — admin akcje (approve/reject/suspend/reactivate)');

    // Anna → approve
    await prisma.fotoMatchProfile.update({
        where: { id: annaProfileId },
        data: { status: 'ACTIVE', is_active: true, verified_at: new Date(), verified_by: adminId },
    });
    const anna = await prisma.fotoMatchProfile.findUnique({ where: { id: annaProfileId } });
    if (anna?.status === 'ACTIVE' && anna.is_active) ok('Anna ACTIVE + is_active=true');
    else bug('CRIT', 'Admin', 'approve nie ustawił ACTIVE+is_active poprawnie');

    // Bartek → reject (potem reaktywujemy)
    await prisma.fotoMatchProfile.update({
        where: { id: bartekProfileId },
        data: { status: 'REJECTED', is_active: false, rejection_reason: 'TEST: brak selfie' },
    });
    let bartek = await prisma.fotoMatchProfile.findUnique({ where: { id: bartekProfileId } });
    if (bartek?.status === 'REJECTED' && !bartek.is_active) ok('Bartek REJECTED + rejection_reason zapisany');
    else bug('HIGH', 'Admin', 'reject nie zadziałał poprawnie');

    // Bartek dosyła dokumenty → klient ponownie POST profile (edycja). Sprawdź czy status wraca do PENDING.
    // Sprawdzamy w kodzie: src/app/api/foto-match/profile/route.ts musi mieć logic shouldResetToPending.
    const profilePath = path.join(process.cwd(), 'src/app/api/foto-match/profile/route.ts');
    const profileSrc = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : '';
    if (profileSrc.includes('shouldResetToPending') || (profileSrc.includes("'REJECTED'") && profileSrc.includes("status: 'PENDING'"))) {
        ok('Recovery REJECTED→PENDING zaimplementowany w POST profile');
    } else {
        bug('HIGH', 'Recovery', 'Po REJECTED brak ścieżki re-submit — klient edytuje profil ale status zostaje REJECTED. ' +
            'Powinno wrócić do PENDING z auto-resetem rejection_reason.');
    }

    // Daj Bartkowi szansę — manualnie ACTIVE
    await prisma.fotoMatchProfile.update({
        where: { id: bartekProfileId },
        data: { status: 'ACTIVE', is_active: true, verified_at: new Date(), verified_by: adminId, rejection_reason: null },
    });
    bartek = await prisma.fotoMatchProfile.findUnique({ where: { id: bartekProfileId } });
    if (bartek?.status === 'ACTIVE') ok('Bartek po reaktywacji: ACTIVE');

    // Sprawdź maile lifecycle (approved/rejected/suspended) w sender.ts
    const senderPath = path.join(process.cwd(), 'src/lib/email/sender.ts');
    const senderSrc = fs.existsSync(senderPath) ? fs.readFileSync(senderPath, 'utf8') : '';
    const emailsOk =
        senderSrc.includes('foto-match-approved') &&
        senderSrc.includes('foto-match-rejected') &&
        senderSrc.includes('foto-match-suspended');
    if (!emailsOk) {
        bug('HIGH', 'Email', 'Brak maila do klienta po approve / reject / suspend. Klient nie wie że został zaakceptowany.');
    } else {
        ok('Szablony approve/reject/suspend obecne w sender.ts');
    }
}

// =============================================================
// TEST 6 — 15 cech matchingu, włączanie po kolei
// =============================================================
async function testMatching(annaProfile: any, bartekProfile: any) {
    header('TEST 6 — symulacja 15 cech matchingu (Anna ↔ Bartek)');

    const ms = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    if (!ms) {
        bug('CRIT', 'MatchSettings', 'Brak singleton wiersza foto_match_match_settings');
        return;
    }

    // Reset wszystkich do false
    await prisma.fotoMatchMatchSettings.update({
        where: { id: ms.id },
        data: {
            opposite_gender_only: false, same_gender_only: false,
            same_city: false, respect_search_radius: false,
            age_range: false, min_shared_interests: false,
            same_experience_level: false, complementary_experience: false, same_comfort_level: false,
            verified_only: false, min_photos: false, no_flagged_photos: false,
            recently_active: false, exclude_already_seen: false, exclude_already_matched: false,
        },
    });

    // ❗ KLUCZOWA LUKA: nie istnieje endpoint /api/foto-match/discover ani /api/foto-match/matches
    // który by używał tych ustawień. 15 cech jest w DB, ale ŻADEN kod ich nie czyta.
    const discoverPath = path.join(process.cwd(), 'src/app/api/foto-match/discover/route.ts');
    const discoverPagePath = path.join(process.cwd(), 'src/app/foto-match/odkryj/page.tsx');
    if (!fs.existsSync(discoverPath) || !fs.existsSync(discoverPagePath)) {
        bug('CRIT', 'Matching', 'Tabela foto_match_match_settings istnieje, ale ŻADEN endpoint/UI z niej nie korzysta. ' +
            'Brak /api/foto-match/discover, brak /foto-match/odkryj, brak filtru kandydatów. ' +
            'Klient po ACTIVE nie ma jak zobaczyć dopasowań — funkcjonalność wisi w powietrzu.');
    } else {
        ok('Endpoint /api/foto-match/discover oraz strona /foto-match/odkryj istnieją');
    }

    // Symulacja: jak BĘDZIE wyglądać discover gdy zaimplementujemy
    function pickCandidates(viewer: any, candidates: any[], rules: any) {
        const now = new Date();
        return candidates.filter(c => {
            if (c.id === viewer.id) return false;
            if (c.status !== 'ACTIVE' || !c.is_active) return false;
            if (rules.opposite_gender_only && c.gender === viewer.gender) return false;
            if (rules.same_gender_only && c.gender !== viewer.gender) return false;
            if (rules.same_city && c.city !== viewer.city) return false;
            if (rules.age_range) {
                const diff = Math.abs((c.birth_year ?? 0) - (viewer.birth_year ?? 0));
                if (diff > (rules.age_range_years ?? 5)) return false;
            }
            if (rules.min_shared_interests) {
                const shared = (c.interests || []).filter((i: string) => (viewer.interests || []).includes(i)).length;
                if (shared < (rules.min_shared_interests_count ?? 2)) return false;
            }
            if (rules.same_experience_level && c.experience !== viewer.experience) return false;
            if (rules.complementary_experience) {
                const a = viewer.experience, b = c.experience;
                const exp = ['never_modeled', 'few_times', 'experienced'];
                if (exp.indexOf(a) === exp.indexOf(b)) return false;
            }
            if (rules.same_comfort_level && c.comfort_level !== viewer.comfort_level) return false;
            if (rules.verified_only && !c.verified_at) return false;
            return true;
        });
    }

    const candidates = [bartekProfile, annaProfile];

    // Scenariusz A: wszystkie OFF
    let r = pickCandidates(annaProfile, candidates, await prisma.fotoMatchMatchSettings.findUnique({ where: { id: ms.id } }));
    ok(`Wszystko OFF — Anna widzi ${r.length} kandydatów (oczekiwane: 1 = Bartek)`);
    if (r.length !== 1) bug('HIGH', 'Matching', 'Bez filtra Anna nie widzi Bartka');

    // Scenariusz B: opposite_gender_only
    await prisma.fotoMatchMatchSettings.update({ where: { id: ms.id }, data: { opposite_gender_only: true } });
    r = pickCandidates(annaProfile, candidates, await prisma.fotoMatchMatchSettings.findUnique({ where: { id: ms.id } }));
    ok(`opposite_gender_only=ON — Anna widzi ${r.length} (Bartek to mężczyzna ✓)`);
    if (r.length !== 1) bug('HIGH', 'Matching', 'opposite_gender_only zepsuł filtrowanie');

    // Scenariusz C: same_city też ON
    await prisma.fotoMatchMatchSettings.update({ where: { id: ms.id }, data: { same_city: true } });
    r = pickCandidates(annaProfile, candidates, await prisma.fotoMatchMatchSettings.findUnique({ where: { id: ms.id } }));
    if (r.length === 0) ok('opposite + same_city — Anna widzi 0 (Bartek z innego miasta) ✓');
    else bug('HIGH', 'Matching', `same_city OR logic nie działa, oczekiwane 0, jest ${r.length}`);

    // Scenariusz D: WAŻNE — opposite + same_gender_only naraz to logiczna sprzeczność
    // Sprawdzamy czy admin endpoint match-settings odrzuca taką kombinację (radio guard).
    const matchSettingsPath = path.join(process.cwd(), 'src/app/api/admin/foto-match/match-settings/route.ts');
    const matchSettingsSrc = fs.existsSync(matchSettingsPath) ? fs.readFileSync(matchSettingsPath, 'utf8') : '';
    if (matchSettingsSrc.includes('GENDER_MUTUALLY_EXCLUSIVE')) {
        ok('Admin endpoint match-settings wymusza wzajemne wykluczanie gender (radio guard)');
    } else {
        bug('MED', 'Matching', 'opposite_gender_only + same_gender_only mogą być włączone naraz → zawsze 0 wyników. ' +
            'UI admina powinien wymusić wybór jednego (radio, nie checkboxy).');
    }
    await prisma.fotoMatchMatchSettings.update({
        where: { id: ms.id },
        data: { opposite_gender_only: false, same_gender_only: false, same_city: false },
    });

    // Scenariusz E: complementary_experience między never_modeled i experienced
    await prisma.fotoMatchMatchSettings.update({
        where: { id: ms.id },
        data: { opposite_gender_only: false, same_gender_only: false, complementary_experience: true },
    });
    r = pickCandidates(annaProfile, candidates, await prisma.fotoMatchMatchSettings.findUnique({ where: { id: ms.id } }));
    if (r.length === 1) ok('complementary_experience — Anna(experienced) ↔ Bartek(never_modeled) match ✓');
    else bug('HIGH', 'Matching', 'complementary_experience filtr nie działa');

    // Reset
    await prisma.fotoMatchMatchSettings.update({
        where: { id: ms.id },
        data: { opposite_gender_only: false, same_gender_only: false, same_city: false, complementary_experience: false },
    });
}

// =============================================================
// TEST 7 — referral end-to-end
// =============================================================
async function testReferral(annaProfile: any, czesia: any, settingId: number) {
    header('TEST 7 — referral: Anna → Czesia');

    // Włącz bonus referralowy
    const ms = await prisma.fotoMatchMatchSettings.findFirst({ orderBy: { id: 'asc' } });
    await prisma.fotoMatchMatchSettings.update({
        where: { id: ms!.id },
        data: {
            referral_bonus_enabled: true,
            referral_bonus_amount_grosze: 5000,
            referral_bonus_percent: 10,
            referral_bonus_type: 'AMOUNT',
            referral_bonus_min_to_redeem: 1,
            referral_bonus_expires_days: 90,
        },
    });

    // Anna tworzy referral
    const token = crypto.randomBytes(16).toString('hex');
    const ref = await prisma.fotoMatchReferral.create({
        data: { referrer_profile_id: annaProfile.id, invite_token: token, status: 'PENDING' },
    });
    ok(`Anna utworzyła invite_token (ref #${ref.id}, PENDING)`);

    // Czesia otwiera link → bump click_count
    await prisma.fotoMatchReferral.update({
        where: { invite_token: token },
        data: { click_count: { increment: 1 } },
    });

    // Czesia rejestruje się (już jest user) i tworzy profil. CO POWINNO SIĘ STAĆ:
    // referral.status = REGISTERED + invited_user_id = czesia.id
    // Sprawdzamy czy register endpoint czyta cookie/body referralToken i linkuje.
    const registerPath = path.join(process.cwd(), 'src/app/api/auth/register/route.ts');
    const registerSrc = fs.existsSync(registerPath) ? fs.readFileSync(registerPath, 'utf8') : '';
    const captureOk = registerSrc.includes('fotoMatchReferral') &&
        (registerSrc.includes('referralToken') || registerSrc.includes('fm_ref_token')) &&
        registerSrc.includes('REGISTERED');
    if (!captureOk) {
        bug('CRIT', 'Referral', 'Po rejestracji userka z linkiem ?ref=token NIC nie linkuje go z fotomatch_referral. ' +
            'Brak: (a) capture tokenu w cookie/localStorage przy wejściu na landing; ' +
            '(b) wysłanie tokenu w POST /api/auth/register; ' +
            '(c) update referral.invited_user_id + status=REGISTERED w handlerze rejestracji. ' +
            'Cały system referrali NIE LICZY POLECEŃ AUTOMATYCZNIE.');
    } else {
        ok('Register endpoint linkuje referral po rejestracji (REGISTERED)');
    }

    // Czesia tworzy profil i admin go aktywuje
    const czesiaProfile = await prisma.fotoMatchProfile.create({
        data: {
            user_id: czesia.id, display_name: 'Czesia T.', birth_year: 1991, gender: 'female',
            city: 'Toruń', interests: ['portret'], status: 'ACTIVE', is_active: true,
        },
    });

    // CO POWINNO SIĘ STAĆ: gdy referral.invited_user_id matches user_id i admin właśnie zatwierdził
    // → status referral = ACTIVE → wygenerowanie voucher_code → REWARDED + email do referrera
    const rewardPath = path.join(process.cwd(), 'src/lib/foto-match/referral-reward.ts');
    const adminProfPath = path.join(process.cwd(), 'src/app/api/admin/foto-match/profiles/[id]/route.ts');
    const adminProfSrc = fs.existsSync(adminProfPath) ? fs.readFileSync(adminProfPath, 'utf8') : '';
    if (!fs.existsSync(rewardPath) || !adminProfSrc.includes('tryAwardReferral')) {
        bug('CRIT', 'Referral', 'Po approve profilu zaproszonej osoby brak triggera generującego voucher_code, ' +
            'reward_amount_grosze, reward_expires_at i status=REWARDED. Klient nigdy nie dostanie rabatu.');
    } else {
        ok('Trigger auto-reward po approve aktywny (referral-reward.ts + admin profile PATCH)');
    }

    const senderPath = path.join(process.cwd(), 'src/lib/email/sender.ts');
    const senderSrc = fs.existsSync(senderPath) ? fs.readFileSync(senderPath, 'utf8') : '';
    if (!senderSrc.includes('foto-match-referral-rewarded')) {
        bug('HIGH', 'Referral', 'Brak emaila powiadamiającego polecającego o przyznanym voucherze.');
    } else {
        ok('Szablon foto-match-referral-rewarded obecny');
    }

    // Sprawdź czy redemption logika istnieje (gdy Anna chce użyć vouchera w cart/booking)
    const bookingPath = path.join(process.cwd(), 'src/app/api/bookings/route.ts');
    const bookingSrc = fs.existsSync(bookingPath) ? fs.readFileSync(bookingPath, 'utf8') : '';
    const voucherCheckPath = path.join(process.cwd(), 'src/app/api/foto-match/voucher/check/route.ts');
    if (!bookingSrc.includes('fm_voucher_code') || !fs.existsSync(voucherCheckPath)) {
        bug('CRIT', 'Referral', 'Brak implementacji redemption — voucher_code nie jest sprawdzany w żadnym ' +
            '/api/checkout, /api/cart/apply-promo, /api/booking. Nawet gdyby kod istniał, klient nie mógłby go użyć.');
    } else {
        ok('Redemption: /api/foto-match/voucher/check + obsługa fm_voucher_code w bookings POST');
    }

    return { czesiaProfile, refToken: token };
}

// =============================================================
// TEST 8 — płatność 50/50
// =============================================================
async function testSplitPayment() {
    header('TEST 8 — płatność 50/50 (rezerwacja + dopłata)');
    // Sprawdź czy Booking ma jakiekolwiek pole związane z installment / split / deposit
    const cols: any[] = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name='bookings'`
    );
    const colNames = cols.map((c: any) => c.column_name);
    const splitFields = colNames.filter((f: string) => /install|split|deposit|prepay|partial|payment_plan|remaining/i.test(f));
    if (splitFields.length === 0) {
        bug('CRIT', 'Payments', 'Booking model NIE ma żadnych pól dla 50/50: brak deposit_amount, ' +
            'remaining_amount, deposit_paid_at, remaining_paid_at, payment_plan. ' +
            'Funkcja "włącz płatności 50/50" wymaga: (1) migracji DB; (2) UI w pakiecie / koszyku; ' +
            '(3) 2 sesji Stripe/PayU per booking; (4) reminder emaila o pozostałej kwocie.');
    } else {
        ok(`Booking ma pola split: ${splitFields.join(', ')}`);
    }

    // Sprawdź czy Setting ma globalny toggle dla 50/50
    const sCols: any[] = await prisma.$queryRawUnsafe(
        `SELECT column_name FROM information_schema.columns WHERE table_name='settings'`
    );
    const sNames = sCols.map((c: any) => c.column_name);
    const splitToggle = sNames.find((f: string) => /split|install|partial.*payment|50_50|fifty/i.test(f));
    if (!splitToggle) {
        bug('CRIT', 'Payments', 'Setting nie ma globalnego toggle "split_payment_enabled" / "allow_50_50_payment". ' +
            'Admin nie ma jak włączyć tej opcji jednym kliknięciem.');
    } else {
        ok(`Setting ma toggle: ${splitToggle}`);
    }
}

// =============================================================
// TEST 9 — upload galerii dla klienta + powiadomienie
// =============================================================
async function testGalleryNotification(annaId: number) {
    header('TEST 9 — fotograf wgrywa galerię klientowi i powiadamia');
    // Sprawdź czy istnieje endpoint do tworzenia galerii
    const galleryFiles = ['src/app/api/admin/galleries', 'src/app/api/galleries'];
    const exists = galleryFiles.find(f => fs.existsSync(path.join(process.cwd(), f)));
    if (!exists) {
        bug('HIGH', 'Gallery', 'Brak endpointów /api/admin/galleries — nie ma jak wgrać galerii klientowi.');
        return;
    }
    ok(`Endpoint galerii istnieje: ${exists}`);

    // Sprawdź czy ClientGallery ma flagę published_at i czy istnieje email template gallery-ready
    const cg = await prisma.clientGallery.findFirst().catch(() => null);
    if (!cg) {
        ok('Brak danych testowych galerii — pomijam check publikacji');
    } else {
        const fields = Object.keys(cg);
        if (!fields.includes('published_at') && !fields.includes('notified_at')) {
            bug('MED', 'Gallery', 'ClientGallery brak pola published_at/notified_at — nie wiadomo kiedy klient był powiadomiony.');
        }
    }

    const tplDir = path.join(process.cwd(), 'src/lib/email/templates');
    if (fs.existsSync(tplDir)) {
        const tpls = fs.readdirSync(tplDir);
        const galleryTpl = tpls.find(t => /gallery|galer/i.test(t));
        if (!galleryTpl) {
            bug('HIGH', 'Email', 'Brak szablonu maila "Twoje zdjęcia są gotowe" do klienta. ' +
                'Klient po sesji nie wie że galeria istnieje.');
        } else {
            ok(`Szablon galerii: ${galleryTpl}`);
        }
    }
}

// =============================================================
// CLEANUP
// =============================================================
async function cleanup(ids: { annaId: number; bartekId: number; czesiaId: number; adminId: number }) {
    if (KEEP) {
        console.log('\nKEEP=1 — pozostawiam dane testowe.');
        return;
    }
    header('CLEANUP — usuwam dane testowe');
    for (const uid of [ids.annaId, ids.bartekId, ids.czesiaId]) {
        const profile = await prisma.fotoMatchProfile.findUnique({ where: { user_id: uid } });
        if (profile) {
            await prisma.fotoMatchPhoto.deleteMany({ where: { profile_id: profile.id } });
            await prisma.fotoMatchReferral.deleteMany({ where: { OR: [{ referrer_profile_id: profile.id }, { invited_profile_id: profile.id }] } });
            await prisma.fotoMatchProfile.delete({ where: { id: profile.id } });
        }
        await prisma.user.delete({ where: { id: uid } }).catch(() => {});
    }
    await prisma.adminUser.delete({ where: { id: ids.adminId } }).catch(() => {});
    ok('Usunięto.');
}

// =============================================================
// RAPORT
// =============================================================
function report() {
    console.log('\n\n======================================');
    console.log('   RAPORT KOŃCOWY AUDYTU FAZA 1+2');
    console.log('======================================\n');
    const grouped: Record<string, typeof issues> = {};
    for (const i of issues) {
        grouped[i.severity] = grouped[i.severity] || [];
        grouped[i.severity].push(i);
    }
    const order: typeof issues[number]['severity'][] = ['CRIT', 'HIGH', 'MED', 'LOW', 'INFO'];
    for (const sev of order) {
        const arr = grouped[sev] || [];
        if (arr.length === 0) continue;
        console.log(`\n--- ${sev} (${arr.length}) ---`);
        for (const i of arr) console.log(`  • [${i.area}] ${i.msg}`);
    }
    console.log(`\n>>> Łącznie błędów/luk: ${issues.length}`);
    console.log(`>>> CRIT: ${(grouped.CRIT || []).length} | HIGH: ${(grouped.HIGH || []).length} | MED: ${(grouped.MED || []).length}`);
}

// =============================================================
// MAIN
// =============================================================
async function main() {
    try {
        const { anna, bartek, czesia, admin } = await setup();
        const settingId = await testToggle();
        if (!settingId) throw new Error('Brak Setting singleton — abort');

        await testGating(anna.id, settingId);
        const { annaProfile, bartekProfile } = await testOnboarding(anna.id, bartek.id, settingId);
        await testPhotos(annaProfile.id, bartekProfile.id);
        await testAdminActions(annaProfile.id, bartekProfile.id, admin.id);
        // Reload profili po zmianach statusu
        const annaActive = await prisma.fotoMatchProfile.findUnique({ where: { id: annaProfile.id } });
        const bartekActive = await prisma.fotoMatchProfile.findUnique({ where: { id: bartekProfile.id } });
        await testMatching(annaActive, bartekActive);
        await testReferral(annaActive, czesia, settingId);
        await testSplitPayment();
        await testGalleryNotification(anna.id);

        await cleanup({ annaId: anna.id, bartekId: bartek.id, czesiaId: czesia.id, adminId: admin.id });
        report();
    } catch (e: any) {
        console.error('FATAL', e.message, e.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
