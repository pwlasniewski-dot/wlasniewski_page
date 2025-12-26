
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seed() {
    const locations = [
        { name: 'Starówka Toruń', description: 'Urokliwe uliczki starego miasta', is_active: true, display_order: 1 },
        { name: 'Bulwar Filadelfijski', description: 'Sesja nad Wisłą o zachodzie słońca', is_active: true, display_order: 2 },
        { name: 'Park Bydgoski', description: 'Zieleń i natura w sercu miasta', is_active: true, display_order: 3 },
        { name: 'Ruiny Zamku Krzyżackiego', description: 'Historyczny klimat i ceglane mury', is_active: true, display_order: 4 },
    ];

    for (const loc of locations) {
        await prisma.challengeLocation.upsert({
            where: { id: locations.indexOf(loc) + 1 }, // Simple ID logic for seed
            update: loc,
            create: loc,
        });
    }

    console.log('✅ Default challenge locations seeded');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
