
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSystem() {
    try {
        console.log('--- CHECKING SETTINGS ---');
        const settings = await prisma.setting.findFirst();
        if (settings) {
            console.log('Footer Config:', settings.footer_config);
        } else {
            console.log('No settings found!');
        }

        console.log('\n--- CREATING MISSING PAGES ---');

        // Pages to create if they don't exist
        const pagesToCreate = [
            { title: 'Fotograf Toruń', slug: 'fotograf-torun' },
            { title: 'Fotograf Wąbrzeźno', slug: 'fotograf-wabrzezno' },
            { title: 'Fotograf Grudziądz', slug: 'fotograf-grudziadz' }, // User mentioned Grudziądz
            { title: 'Fotograf Lisewo', slug: 'fotograf-lisewo' }, // In default config
        ];

        for (const p of pagesToCreate) {
            const existing = await prisma.page.findUnique({
                where: { slug: p.slug }
            });

            if (!existing) {
                console.log(`Creating page: ${p.title} (${p.slug})`);
                await prisma.page.create({
                    data: {
                        title: p.title,
                        slug: p.slug,
                        content: `<h1>${p.title}</h1><p>Strona w budowie.</p>`,
                        is_published: true,
                        page_type: 'regular'
                    }
                });
            } else {
                console.log(`Page already exists: ${p.slug}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixSystem();
