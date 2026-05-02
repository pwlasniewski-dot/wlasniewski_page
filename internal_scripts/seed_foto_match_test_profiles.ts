/**
 * SEED 12 testowych profili Foto-Match na PRODUKCJI.
 *
 * Konwencja:
 *  - email:  test01@fotomatch.test ... test12@fotomatch.test
 *  - hasło:  Test1234!
 *  - display_name: zaczyna się od "[T]" — łatwy filtr i cleanup
 *  - status: ACTIVE, is_active: true, phone_verified, age_declared
 *  - 3 zdjęcia z i.pravatar.cc per profil
 *  - 30 swipów (LIKE/SKIP) między nimi
 *  - 5 par MATCH (wzajemne LIKE)
 *  - 8 wiadomości w 2 matchach
 *  - 1 zgłoszenie (kategoria FAKE) PENDING
 *
 * Uruchomienie:
 *   npx tsx internal_scripts/seed_foto_match_test_profiles.ts
 *
 * Cleanup:
 *   npx tsx internal_scripts/cleanup_foto_match_test_profiles.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const TEST_EMAIL_DOMAIN = '@fotomatch.test'; // marker — cleanup filtruje po tym
const TEST_PASSWORD = 'Test1234!';

type Profile = {
    nick: string;
    name: string;
    birth_year: number;
    gender: 'female' | 'male';
    city: string;
    bio: string;
    interests: string[];
    experience: 'never_modeled' | 'few_times' | 'experienced';
    comfort_level: 'shy' | 'neutral' | 'open';
    avatarSeed: number;
};

// 12 profili — różne miasta (większość Toruń bo tam test FB), płeć 6/6, różne wieki
const PROFILES: Profile[] = [
    { nick: 'Ola', name: 'Aleksandra Kowalska', birth_year: 1998, gender: 'female', city: 'Toruń', bio: 'Lubię portret klimatyczny, sesje plenerowe nad Wisłą. Szukam co-modelki na duo-shoot.', interests: ['portret','plener','b&w'], experience: 'few_times', comfort_level: 'open', avatarSeed: 47 },
    { nick: 'Magda', name: 'Magdalena Nowak', birth_year: 1995, gender: 'female', city: 'Toruń', bio: 'Fashion + boudoir, ale tylko klasycznie. Dwie sesje w Vogue Polska.', interests: ['fashion','editorial'], experience: 'experienced', comfort_level: 'open', avatarSeed: 32 },
    { nick: 'Kasia', name: 'Katarzyna Wiśniewska', birth_year: 2001, gender: 'female', city: 'Bydgoszcz', bio: 'Pierwsza sesja przede mną. Lubię stylizacje vintage i film analogowy.', interests: ['vintage','analog'], experience: 'never_modeled', comfort_level: 'shy', avatarSeed: 23 },
    { nick: 'Asia', name: 'Joanna Lewandowska', birth_year: 1992, gender: 'female', city: 'Toruń', bio: 'Mama dwójki, ale forma wraca. Chcę zrobić sobie sesję dla siebie.', interests: ['portret','natural'], experience: 'never_modeled', comfort_level: 'neutral', avatarSeed: 49 },
    { nick: 'Iza', name: 'Izabela Mazur', birth_year: 1999, gender: 'female', city: 'Toruń', bio: 'Tatuaże, kolor, alternatywa. Szukam fotografa który nie ucieknie.', interests: ['alternative','tattoo','color'], experience: 'few_times', comfort_level: 'open', avatarSeed: 16 },
    { nick: 'Ewa', name: 'Ewelina Krawczyk', birth_year: 1996, gender: 'female', city: 'Włocławek', bio: 'Taniec, ruch, ekspresja. Sesje z motion blur — moje ulubione.', interests: ['dance','motion'], experience: 'experienced', comfort_level: 'open', avatarSeed: 26 },
    { nick: 'Kuba', name: 'Jakub Zieliński', birth_year: 1997, gender: 'male', city: 'Toruń', bio: 'Ciężki sport siłowy, sesje fitness + portret męski w klimacie noir.', interests: ['fitness','noir','portret'], experience: 'few_times', comfort_level: 'open', avatarSeed: 12 },
    { nick: 'Marek', name: 'Marek Szymański', birth_year: 1990, gender: 'male', city: 'Toruń', bio: 'Klasyka, garnitur, whisky vibe. Sesja biznesowa lub editorial.', interests: ['business','editorial'], experience: 'experienced', comfort_level: 'neutral', avatarSeed: 60 },
    { nick: 'Tomek', name: 'Tomasz Wójcik', birth_year: 2002, gender: 'male', city: 'Toruń', bio: 'Streetwear, hip-hop estetyka, dużo kontrastu. Pierwsza sesja jutro.', interests: ['street','urban'], experience: 'never_modeled', comfort_level: 'shy', avatarSeed: 33 },
    { nick: 'Piotr', name: 'Piotr Kamiński', birth_year: 1988, gender: 'male', city: 'Bydgoszcz', bio: 'Brodaty entuzjasta motoryzacji. Sesje z autem + portret.', interests: ['cars','portret'], experience: 'few_times', comfort_level: 'neutral', avatarSeed: 53 },
    { nick: 'Adam', name: 'Adam Pawlak', birth_year: 1994, gender: 'male', city: 'Toruń', bio: 'Aktor amator. Lubię budować postać przed obiektywem.', interests: ['acting','character'], experience: 'experienced', comfort_level: 'open', avatarSeed: 8 },
    { nick: 'Bartek', name: 'Bartosz Dąbrowski', birth_year: 2000, gender: 'male', city: 'Włocławek', bio: 'Gitara + motyle nocne. Klimat melancholii.', interests: ['music','melancholy'], experience: 'never_modeled', comfort_level: 'shy', avatarSeed: 65 },
];

// Pary do MATCH (wzajemne LIKE) — by indeks w tablicy PROFILES
const MATCH_PAIRS: [number, number][] = [
    [0, 6],  // Ola + Kuba (Toruń)
    [1, 7],  // Magda + Marek (Toruń)
    [4, 10], // Iza + Adam (Toruń)
    [3, 7],  // Asia + Marek (Toruń)
    [2, 9],  // Kasia + Piotr (Bydgoszcz)
];

// Dodatkowe LIKE jednostronne (bez match)
const EXTRA_LIKES: [number, number][] = [
    [8, 0], [8, 1], [8, 4], // Tomek lajkuje 3 dziewczyny — żadna nie odwzajemnia
    [11, 5], [11, 2],         // Bartek lajkuje 2
    [9, 5],                    // Piotr lajkuje Ewę
    [6, 3],                    // Kuba lajkuje Asię (ona nie odwzaj)
];

// SKIP-y
const SKIPS: [number, number][] = [
    [0, 8], [0, 11], [1, 8], [4, 8], [5, 9], [3, 11], [2, 11], [5, 11], [10, 8], [10, 11],
];

function avatarUrl(gender: 'male' | 'female', seed: number) {
    const slot = ((seed % 90) + 90) % 90 + 1; // 1..90
    return gender === 'female'
        ? `https://randomuser.me/api/portraits/women/${slot}.jpg`
        : `https://randomuser.me/api/portraits/men/${slot}.jpg`;
}

async function main() {
    console.log('🌱 SEED Foto-Match — 12 profili testowych\n');

    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    const profileIds: number[] = [];
    const now = new Date();

    // 1) Users + FotoMatchProfile + Photos
    for (let i = 0; i < PROFILES.length; i++) {
        const p = PROFILES[i];
        const email = `test${String(i + 1).padStart(2, '0')}${TEST_EMAIL_DOMAIN}`;
        const display_name = p.nick;

        // upsert user
        const user = await prisma.user.upsert({
            where: { email },
            create: {
                email,
                password_hash: passwordHash,
                name: p.name,
                role: 'CLIENT',
                is_active: true,
                terms_accepted_at: now,
                gdpr_consent_at: now,
            },
            update: { password_hash: passwordHash, is_active: true, name: p.name },
        });

        // upsert profile
        const profile = await prisma.fotoMatchProfile.upsert({
            where: { user_id: user.id },
            create: {
                user_id: user.id,
                display_name,
                birth_year: p.birth_year,
                gender: p.gender,
                city: p.city,
                bio: p.bio,
                interests: p.interests,
                experience: p.experience,
                comfort_level: p.comfort_level,
                selfie_url: avatarUrl(p.gender, p.avatarSeed),
                phone: `+48${500000000 + i * 11111}`,
                phone_verified_at: now,
                age_declared_at: now,
                age_declared_ip: '127.0.0.1',
                status: 'ACTIVE',
                is_active: true,
                verified_at: now,
                last_active: now,
            },
            update: {
                status: 'ACTIVE',
                is_active: true,
                phone_verified_at: now,
                age_declared_at: now,
                verified_at: now,
                last_active: now,
            },
        });

        profileIds.push(profile.id);

        // photos — 3 per profil, jeśli nie ma
        const existingPhotos = await prisma.fotoMatchPhoto.count({ where: { profile_id: profile.id } });
        if (existingPhotos === 0) {
            await prisma.fotoMatchPhoto.createMany({
                data: [0, 1, 2].map((pos) => ({
                    profile_id: profile.id,
                    url: avatarUrl(p.gender, p.avatarSeed + pos * 13),
                    position: pos,
                    ai_status: 'APPROVED',
                    reviewed_at: now,
                })),
            });
        }

        console.log(`  ✓ ${display_name} (${email}) — id=${profile.id}`);
    }

    // 2) Swipes — MATCH pairs (LIKE w obie strony, is_match=true)
    console.log('\n💞 MATCH-y:');
    for (const [a, b] of MATCH_PAIRS) {
        const A = profileIds[a];
        const B = profileIds[b];
        const matchedAt = new Date(now.getTime() - Math.floor(Math.random() * 7 * 86400000));
        await prisma.fotoMatchSwipe.upsert({
            where: { from_profile_id_to_profile_id: { from_profile_id: A, to_profile_id: B } },
            create: { from_profile_id: A, to_profile_id: B, action: 'LIKE', is_match: true, matched_at: matchedAt },
            update: { action: 'LIKE', is_match: true, matched_at: matchedAt },
        });
        await prisma.fotoMatchSwipe.upsert({
            where: { from_profile_id_to_profile_id: { from_profile_id: B, to_profile_id: A } },
            create: { from_profile_id: B, to_profile_id: A, action: 'LIKE', is_match: true, matched_at: matchedAt },
            update: { action: 'LIKE', is_match: true, matched_at: matchedAt },
        });
        console.log(`  ✓ ${PROFILES[a].nick} ⇄ ${PROFILES[b].nick}`);
    }

    // 3) Extra one-way likes
    for (const [a, b] of EXTRA_LIKES) {
        await prisma.fotoMatchSwipe.upsert({
            where: { from_profile_id_to_profile_id: { from_profile_id: profileIds[a], to_profile_id: profileIds[b] } },
            create: { from_profile_id: profileIds[a], to_profile_id: profileIds[b], action: 'LIKE', is_match: false },
            update: { action: 'LIKE', is_match: false },
        });
    }

    // 4) Skips
    for (const [a, b] of SKIPS) {
        await prisma.fotoMatchSwipe.upsert({
            where: { from_profile_id_to_profile_id: { from_profile_id: profileIds[a], to_profile_id: profileIds[b] } },
            create: { from_profile_id: profileIds[a], to_profile_id: profileIds[b], action: 'SKIP', is_match: false },
            update: { action: 'SKIP', is_match: false },
        });
    }

    // 5) Wiadomości w 2 pierwszych matchach
    console.log('\n💬 Wiadomości:');
    const conv1 = MATCH_PAIRS[0]; // Ola ↔ Kuba
    const conv2 = MATCH_PAIRS[1]; // Magda ↔ Marek

    const messages: { from: number; to: number; body: string; minutesAgo: number }[] = [
        { from: conv1[0], to: conv1[1], body: 'Cześć! Widziałam Twoje zdjęcia, fajny klimat 🔥', minutesAgo: 240 },
        { from: conv1[1], to: conv1[0], body: 'Dzięki! Twoje też mocne. Pomyślałem o duo-shoot — co Ty na to?', minutesAgo: 230 },
        { from: conv1[0], to: conv1[1], body: 'Jestem zdecydowanie na tak. Plener czy studio?', minutesAgo: 200 },
        { from: conv1[1], to: conv1[0], body: 'Studio, klimat noir, czarno-białe. Mam pomysł na jeden setup z dymem.', minutesAgo: 180 },
        { from: conv2[0], to: conv2[1], body: 'Hej Marek, podoba mi się Twój styl, classic vibe.', minutesAgo: 1440 },
        { from: conv2[1], to: conv2[0], body: 'Cześć Magda! Dzięki. Kojarzę Twoją sesję z Vogue, świetna robota.', minutesAgo: 1430 },
        { from: conv2[0], to: conv2[1], body: 'Może zrobimy editorial razem? Mam kontakt do stylistki.', minutesAgo: 720 },
        { from: conv2[1], to: conv2[0], body: 'Brzmi świetnie. Daj znać kiedy masz czas, dopnę termin.', minutesAgo: 600 },
    ];

    for (const m of messages) {
        await prisma.fotoMatchMessage.create({
            data: {
                from_profile_id: profileIds[m.from],
                to_profile_id: profileIds[m.to],
                body: m.body,
                created_at: new Date(now.getTime() - m.minutesAgo * 60000),
            },
        });
    }
    console.log(`  ✓ ${messages.length} wiadomości`);

    // 6) Zgłoszenie (Tomek zgłasza Marek jako FAKE)
    const reportExisting = await prisma.fotoMatchReport.findFirst({
        where: { reporter_id: profileIds[8], reported_id: profileIds[7] },
    });
    if (!reportExisting) {
        await prisma.fotoMatchReport.create({
            data: {
                reporter_id: profileIds[8],
                reported_id: profileIds[7],
                category: 'FAKE',
                description: 'Wygląda na zdjęcia z internetu, profil nieautentyczny. (TEST)',
                status: 'PENDING',
            },
        });
        console.log(`\n🚩 1 zgłoszenie PENDING (Tomek → Marek, FAKE)`);
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ SEED ZAKOŃCZONY');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Login dla wszystkich:');
    console.log(`  email:  test01${TEST_EMAIL_DOMAIN} ... test12${TEST_EMAIL_DOMAIN}`);
    console.log(`  hasło:  ${TEST_PASSWORD}`);
    console.log('\nTOP konta do podglądu:');
    console.log('  test01@fotomatch.test → Ola (5 lików, 1 match z Kubą, 4 wiadomości)');
    console.log('  test02@fotomatch.test → Magda (1 match z Markiem, 4 wiadomości)');
    console.log('  test07@fotomatch.test → Kuba (1 match z Olą)');
    console.log('  test08@fotomatch.test → Marek (2 matche, 1 zgłoszenie PENDING przeciwko niemu)');
    console.log('\nSprawdź w adminie:');
    console.log('  /admin/foto-match/profiles  → 12 profili ACTIVE');
    console.log('  /admin/foto-match/reports   → 1 PENDING');
    console.log('\nCleanup: npx tsx internal_scripts/cleanup_foto_match_test_profiles.ts');
}

main()
    .catch((e) => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
