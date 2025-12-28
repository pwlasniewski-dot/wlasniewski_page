
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding B2B Menu...');

    // Standard B2B Menu Items based on initial design
    const b2bItems = [
        { title: 'Start', url: '/b2b', order: 0 },
        { title: 'Inspekcje', url: '/b2b/inspekcje', order: 1 },
        { title: 'Nieruchomości', url: '/b2b/nieruchomosci', order: 2 },
        { title: 'Kontakt', url: '/b2b#contact', order: 3 },
    ];

    // Check if B2B items already exist
    const existing = await prisma.menuItem.findMany({
        where: { menu_type: 'b2b' }
    });

    if (existing.length > 0) {
        console.log('⚠️ B2B Menu already has items. Skipping seed to avoid duplicates.');
        return;
    }

    console.log('📝 Creating default B2B menu items...');

    for (const item of b2bItems) {
        await prisma.menuItem.create({
            data: {
                title: item.title,
                url: item.url,
                order: item.order,
                menu_type: 'b2b',
                is_active: true,
                parent_id: null
            }
        });
    }

    console.log('✅ B2B Menu seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
