/**
 * CLEANUP — usuwa wszystkie testowe profile Foto-Match (display_name LIKE '[T]%')
 * + ich userów (email LIKE '%@fotomatch.test').
 *
 * Cascade usuwa: photos, swipes, messages, reports, blocks, referrals, consents.
 *
 * Uruchomienie: npx tsx internal_scripts/cleanup_foto_match_test_profiles.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧹 CLEANUP — usuwanie testowych profili Foto-Match\n');

    const profiles = await prisma.fotoMatchProfile.findMany({
        where: { user: { email: { endsWith: '@fotomatch.test' } } },
        select: { id: true, user_id: true, display_name: true },
    });
    console.log(`Znalezione profile: ${profiles.length}`);

    if (profiles.length === 0) {
        console.log('Nic do usunięcia.');
        return;
    }

    const userIds = profiles.map((p) => p.user_id);

    // FotoMatchProfile cascade usunie: photos, swipes, blocks, reports, messages, referrals
    await prisma.fotoMatchProfile.deleteMany({ where: { id: { in: profiles.map((p) => p.id) } } });
    console.log(`  ✓ usunięto ${profiles.length} profili (cascade)`);

    // Userzy z domeny @fotomatch.test
    const usersDeleted = await prisma.user.deleteMany({
        where: { OR: [{ id: { in: userIds } }, { email: { endsWith: '@fotomatch.test' } }] },
    });
    console.log(`  ✓ usunięto ${usersDeleted.count} userów`);

    console.log('\n✅ DONE');
}

main()
    .catch((e) => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
