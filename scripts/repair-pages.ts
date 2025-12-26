import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const slugs = [
        { slug: 'strona-glowna', title: 'Strona Główna' },
        { slug: 'o-mnie', title: 'O mnie' },
        { slug: 'karta-podarunkowa', title: 'Karta Podarunkowa' },
        { slug: 'rezerwacja', title: 'Rezerwacja' },
        { slug: 'sklep', title: 'Sklep' },
    ];

    for (const item of slugs) {
        const page = await prisma.page.upsert({
            where: { slug: item.slug },
            update: {
                is_published: true,
                title: item.title // Update title to be sure
            },
            create: {
                slug: item.slug,
                title: item.title,
                content: '',
                is_published: true,
                page_type: 'custom'
            }
        });
        console.log(`Upserted page: ${page.slug} (published: ${page.is_published})`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
