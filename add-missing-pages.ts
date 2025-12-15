import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMissingPages() {
    try {
        console.log('📖 Adding missing pages to database...');

        // 1. Create "o-mnie" page with content
        await prisma.page.upsert({
            where: { slug: 'o-mnie' },
            update: {
                title: 'O Mnie',
                meta_title: 'O mnie - Przemysław Właśniewski | Fotograf Płużnica, Toruń, Grudziądz',
                meta_description: 'Poznaj mnie lepiej. Fotograf ślubny i rodzinny z pasją. Inżynier z duszą artysty. Działam w Płużnicy i całym kujawsko-pomorskim.',
                is_published: true,
                is_in_menu: true,
                menu_title: 'O Mnie',
                menu_order: 2
            },
            create: {
                slug: 'o-mnie',
                title: 'O Mnie',
                content: '<p>Cześć! Jestem Przemek - fotograf z pasją do naturalnych, autentycznych ujęć.</p>',
                meta_title: 'O mnie - Przemysław Właśniewski | Fotograf Płużnica, Toruń, Grudziądz',
                meta_description: 'Poznaj mnie lepiej. Fotograf ślubny i rodzinny z pasją. Inżynier z duszą artysty. Działam w Płużnicy i całym kujawsko-pomorskim.',
                is_published: true,
                is_in_menu: true,
                menu_title: 'O Mnie',
                menu_order: 2,
                page_type: 'regular'
            }
        });
        console.log('✅ Page "o-mnie" created/updated');

        // 2. Create "jak-sie-ubrac" page
        await prisma.page.upsert({
            where: { slug: 'jak-sie-ubrac' },
            update: {
                title: 'Jak się ubrać?',
                meta_title: 'Jak się ubrać do sesji fotograficznej? Poradnik | Przemysław Właśniewski',
                meta_description: 'Praktyczne porady jak dobrać stroje do sesji fotograficznej. Kolory, style, materiały i akcesoria które sprawdzą się najlepiej.',
                is_published: true
            },
            create: {
                slug: 'jak-sie-ubrac',
                title: 'Jak się ubrać?',
                content: '<p>Poradnik jak dobrze wyglądać na fotografiach.</p>',
                meta_title: 'Jak się ubrać do sesji fotograficznej? Poradnik | Przemysław Właśniewski',
                meta_description: 'Praktyczne porady jak dobrać stroje do sesji fotograficznej. Kolory, style, materiały i akcesoria które sprawdzą się najlepiej.',
                is_published: true,
                page_type: 'regular'
            }
        });
        console.log('✅ Page "jak-sie-ubrac" created/updated');

        console.log('🎉 Missing pages added successfully!');
    } catch (error) {
        console.error('❌ Error adding pages:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

addMissingPages();
