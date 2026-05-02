/**
 * Naprawa artefaktów seed-a:
 *  - usuwa prefix "[T] " z display_name
 *  - podmienia avatary na pasujące do płci (randomuser.me)
 *
 * Cleanup nadal działa — filtr po email LIKE '%@fotomatch.test'.
 *
 * Uruchomienie: npx tsx internal_scripts/fix_test_profiles_artifacts.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// randomuser.me daje konsekwentne portretowe zdjęcia HQ z płcią
function avatarFor(gender: string, idx: number) {
    const slot = (idx % 90) + 1; // 1..90
    return gender === 'female'
        ? `https://randomuser.me/api/portraits/women/${slot}.jpg`
        : `https://randomuser.me/api/portraits/men/${slot}.jpg`;
}

async function main() {
    const profiles = await prisma.fotoMatchProfile.findMany({
        where: { user: { email: { endsWith: '@fotomatch.test' } } },
        select: { id: true, display_name: true, gender: true, user: { select: { email: true } } },
        orderBy: { id: 'asc' },
    });

    console.log(`Znaleziono ${profiles.length} testowych profili.\n`);

    for (let i = 0; i < profiles.length; i++) {
        const p = profiles[i];
        const cleanName = p.display_name.replace(/^\[T\]\s*/, '');
        const newAvatar = avatarFor(p.gender, i);

        // update profile
        await prisma.fotoMatchProfile.update({
            where: { id: p.id },
            data: { display_name: cleanName, selfie_url: newAvatar },
        });

        // update photos (zostawiamy 3 ale zmieniamy źródło)
        const photos = await prisma.fotoMatchPhoto.findMany({
            where: { profile_id: p.id },
            orderBy: { position: 'asc' },
            select: { id: true, position: true },
        });
        for (const ph of photos) {
            await prisma.fotoMatchPhoto.update({
                where: { id: ph.id },
                data: { url: avatarFor(p.gender, i + ph.position * 13) },
            });
        }

        console.log(`  ✓ ${p.display_name} → ${cleanName} (${photos.length} zdjęć podmienionych)`);
    }

    console.log('\n✅ Artefakty naprawione.');
}

main()
    .catch((e) => { console.error('❌', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
