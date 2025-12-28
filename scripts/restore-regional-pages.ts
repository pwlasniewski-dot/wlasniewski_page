
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const regionalPages = [
    {
        slug: 'fotograf-torun',
        title: 'Fotograf Toruń',
        menu_title: 'Toruń',
        content: '<p>Profesjonalna fotografia w Toruniu.</p>',
    },
    {
        slug: 'fotograf-bydgoszcz',
        title: 'Fotograf Bydgoszcz',
        menu_title: 'Bydgoszcz',
        content: '<p>Profesjonalna fotografia w Bydgoszczy.</p>',
    },
    {
        slug: 'fotograf-grudziadz',
        title: 'Fotograf Grudziądz',
        menu_title: 'Grudziądz',
        content: '<p>Profesjonalna fotografia w Grudziądzu.</p>',
    },
    {
        slug: 'fotograf-wabrzezno',
        title: 'Fotograf Wąbrzeźno',
        menu_title: 'Wąbrzeźno',
        content: '<p>Profesjonalna fotografia w Wąbrzeźnie.</p>',
    }
];

async function main() {
    console.log('🚀 Restoring regional pages...');

    for (const page of regionalPages) {
        const existing = await prisma.page.findUnique({ where: { slug: page.slug } });

        if (!existing) {
            await prisma.page.create({
                data: {
                    slug: page.slug,
                    title: page.title,
                    menu_title: page.menu_title,
                    content: page.content,
                    is_published: true,
                    is_in_menu: false, // User will add them manually via Menu Builder
                    page_type: 'regular'
                }
            });
            console.log(`✅ Created: ${page.title}`);
        } else {
            console.log(`ℹ️ Already exists: ${page.title}`);
        }
    }

    console.log('✨ Restoration complete.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
