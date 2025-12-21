import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addDronPage() {
    try {
        const dronPage = await prisma.page.upsert({
            where: { slug: 'dron' },
            create: {
                slug: 'dron',
                title: 'Usługi Dronem i Termowizja B2B',
                menu_title: 'Dron & Termowizja',
                meta_description: 'Profesjonalne inspekcje termowizyjne dronem. Przeglądy fotowoltaiki, dachów i budynków przemysłowych.',
                meta_keywords: 'dron, termowizja, inspekcje, fotowoltaika, B2B, Toruń',
                is_published: true,
                is_in_menu: true,
                menu_order: 5,
                content: 'Strona dronów - B2B usługi inspekcyjne',
                parent_page_id: null
            },
            update: {
                is_in_menu: true,
                is_published: true,
                menu_order: 5,
                menu_title: 'Dron & Termowizja'
            }
        });

        console.log('✅ Dron page added/updated:');
        console.log({
            id: dronPage.id,
            slug: dronPage.slug,
            title: dronPage.title,
            is_in_menu: dronPage.is_in_menu,
            menu_order: dronPage.menu_order
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

addDronPage();
