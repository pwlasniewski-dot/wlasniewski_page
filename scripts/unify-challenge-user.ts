/**
 * UNIFIKACJA ChallengeUser → User
 *
 * Tryb domyślny: DRY-RUN (nic nie zmienia, tylko raportuje plan).
 * Tryb wykonania: dodaj flagę --apply.
 *
 * Plan:
 *   1. Dla każdego ChallengeUser:
 *        - znajdź User po emailu (case-insensitive)
 *        - jeśli istnieje  → mapowanie cu.id → user.id (zachowaj user.password_hash, NIE nadpisuj)
 *        - jeśli nie istnieje → utwórz User(role=CLIENT, name/phone/email z CU,
 *                                password_hash z CU jeśli był, w przeciwnym razie random_unguessable)
 *   2. Zaktualizuj photo_challenges.invitee_user_id → user.id (po mapie)
 *   3. SQL: usuń stary FK, dodaj nowy FK do users(id) ON DELETE SET NULL, DROP TABLE challenge_users
 *      → ten ostatni krok wykonaj DOPIERO po migracji schema.prisma + `prisma generate`
 *      Tutaj robimy go RAW SQL w transakcji.
 *
 * Po wykonaniu konieczna jest aktualizacja schema.prisma + prisma generate
 * + refaktor kodu (osobny commit).
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import bcrypt from 'bcryptjs';

const APPLY = process.argv.includes('--apply');
const prisma = new PrismaClient();

interface PlanItem {
    cuId: number;
    cuEmail: string;
    cuName: string | null;
    cuPhone: string | null;
    cuPasswordHash: string | null;
    action: 'LINK_EXISTING' | 'CREATE_NEW';
    targetUserId?: number;
    targetUserEmail?: string;
    targetUserCurrentRole?: string;
    affectedChallengeIds: number[];
}

async function planMigration(): Promise<PlanItem[]> {
    const cus = await prisma.challengeUser.findMany();
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));

    const plan: PlanItem[] = [];
    for (const cu of cus) {
        const challenges = await prisma.photoChallenge.findMany({
            where: { invitee_user_id: cu.id },
            select: { id: true, unique_link: true },
        });
        const existing = userByEmail.get(cu.email.toLowerCase());
        plan.push({
            cuId: cu.id,
            cuEmail: cu.email,
            cuName: cu.name,
            cuPhone: cu.phone,
            cuPasswordHash: cu.password_hash,
            action: existing ? 'LINK_EXISTING' : 'CREATE_NEW',
            targetUserId: existing?.id,
            targetUserEmail: existing?.email,
            targetUserCurrentRole: existing?.role,
            affectedChallengeIds: challenges.map((c) => c.id),
        });
    }
    return plan;
}

async function execute(plan: PlanItem[]) {
    // Mapowanie cuId -> userId (final)
    const idMap = new Map<number, number>();

    for (const p of plan) {
        if (p.action === 'LINK_EXISTING') {
            idMap.set(p.cuId, p.targetUserId!);
            console.log(`  ✓ link cu.${p.cuId} (${p.cuEmail}) → user.${p.targetUserId}`);
        } else {
            // Wygeneruj password_hash jeśli CU nie miał — losowy, nieodgadywalny.
            // Klient i tak loguje się przez magic-link; hasło może sobie później zresetować.
            const passwordHash = p.cuPasswordHash
                ? p.cuPasswordHash
                : await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

            const newUser = await prisma.user.create({
                data: {
                    email: p.cuEmail,
                    password_hash: passwordHash,
                    name: p.cuName,
                    phone: p.cuPhone,
                    role: 'CLIENT',
                    is_active: true,
                },
            });
            idMap.set(p.cuId, newUser.id);
            console.log(`  ✓ created user.${newUser.id} from cu.${p.cuId} (${p.cuEmail})`);
        }
    }

    // Zaktualizuj FK w photo_challenges (na razie wciąż wskazuje na challenge_users, ale liczba == new user id po DROP CONSTRAINT)
    // Najpierw musimy ZDJĄĆ stary constraint, dopiero potem update na nowe wartości i ADD constraint do users.
    console.log('\n📐 SQL phase (transactional):');
    await prisma.$transaction(async (tx) => {
        // 1. Drop old FK
        await tx.$executeRawUnsafe(`ALTER TABLE photo_challenges DROP CONSTRAINT IF EXISTS photo_challenges_invitee_user_id_fkey;`);
        console.log('  ✓ DROP CONSTRAINT photo_challenges_invitee_user_id_fkey');

        // 2. Update id values (via map)
        for (const [oldId, newId] of idMap.entries()) {
            const r = await tx.$executeRawUnsafe(
                `UPDATE photo_challenges SET invitee_user_id = $1 WHERE invitee_user_id = $2;`,
                newId,
                oldId
            );
            console.log(`  ✓ UPDATE photo_challenges (invitee_user_id ${oldId}→${newId}): ${r} rows`);
        }

        // 3. Add new FK to users(id)
        await tx.$executeRawUnsafe(`
            ALTER TABLE photo_challenges
            ADD CONSTRAINT photo_challenges_invitee_user_id_fkey
            FOREIGN KEY (invitee_user_id) REFERENCES users(id) ON DELETE SET NULL;
        `);
        console.log('  ✓ ADD CONSTRAINT photo_challenges_invitee_user_id_fkey → users(id)');

        // 4. DROP TABLE challenge_users
        await tx.$executeRawUnsafe(`DROP TABLE challenge_users;`);
        console.log('  ✓ DROP TABLE challenge_users');
    });

    console.log('\n🟢 Data migration complete.');
}

async function main() {
    console.log(`\n🧬 UNIFY ChallengeUser → User  (${APPLY ? 'APPLY' : 'DRY-RUN'})\n`);

    const plan = await planMigration();

    console.log('📋 PLAN:\n');
    for (const p of plan) {
        const action = p.action === 'LINK_EXISTING'
            ? `LINK → users.${p.targetUserId} (role=${p.targetUserCurrentRole})`
            : 'CREATE NEW user (role=CLIENT)';
        console.log(`  cu.${p.cuId}  ${p.cuEmail.padEnd(30)} → ${action}`);
        console.log(`     name="${p.cuName}" phone="${p.cuPhone}" password=${p.cuPasswordHash ? 'SET' : 'null (will random+hash if new)'}`);
        if (p.affectedChallengeIds.length)
            console.log(`     PhotoChallenges to relink: [${p.affectedChallengeIds.join(', ')}]`);
        else
            console.log(`     PhotoChallenges to relink: (none)`);
    }

    // Pokaż konsekwencje SQL
    console.log('\n📐 SQL changes (po data migration):');
    console.log('  - DROP CONSTRAINT photo_challenges_invitee_user_id_fkey');
    console.log('  - UPDATE photo_challenges SET invitee_user_id = (mapped) WHERE invitee_user_id = (old)');
    console.log('  - ADD CONSTRAINT photo_challenges_invitee_user_id_fkey → users(id) ON DELETE SET NULL');
    console.log('  - DROP TABLE challenge_users');

    console.log('\n⚠️  Po tym kroku WYMAGANE:');
    console.log('   1. Zaktualizować prisma/schema.prisma:');
    console.log('      • usunąć model ChallengeUser');
    console.log('      • PhotoChallenge.invitee_user → User @relation("ChallengeInvitee")');
    console.log('      • User → dodać challenge_invites PhotoChallenge[] @relation("ChallengeInvitee")');
    console.log('   2. npx prisma generate (regeneracja klienta)');
    console.log('   3. Refaktor kodu (challengeUser.* → user.*) — osobny commit');

    if (!APPLY) {
        console.log('\n💡 To był DRY-RUN. Aby wykonać, uruchom: npx tsx scripts/unify-challenge-user.ts --apply\n');
        return;
    }

    console.log('\n🚀 EXECUTING…\n');
    await execute(plan);
}

main()
    .catch((e) => {
        console.error('\n💥 MIGRATION FAILED:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
