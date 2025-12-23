
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding expansion data...');

    // 1. Business Goals
    await prisma.businessGoal.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            title: 'Przychód Q4 2025',
            target_amount: 50000,
            current_amount: 39000,
            category: 'revenue',
            start_date: new Date('2025-10-01'),
            end_date: new Date('2025-12-31'),
        },
    });

    // 2. Scrum Tasks
    await prisma.scrumTask.createMany({
        data: [
            { title: 'Przygotować ofertę B2B dla deweloperów', content: 'Inspekcje termowizyjne nowych osiedli', status: 'TODO', priority: 'HIGH' },
            { title: 'Sesja wizerunkowa - Prezes TechCorp', content: 'Retusz 5 zdjęć wybranych przez klienta', status: 'DOING', priority: 'MEDIUM' },
            { title: 'Aktualizacja cennika dronów', content: 'Dodać opcję mapowania 3D', status: 'DONE', priority: 'LOW' },
        ],
        skipDuplicates: true,
    });

    // 3. Page for Drone Services
    await prisma.page.upsert({
        where: { slug: 'dron' },
        update: {},
        create: {
            slug: 'dron',
            title: 'Usługi Dronem i Termowizja',
            content: 'Strona usług dronowych B2B',
            is_published: true,
            page_type: 'regular',
        },
    });

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
