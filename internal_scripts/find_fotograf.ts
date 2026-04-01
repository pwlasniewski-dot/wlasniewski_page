import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany({
        where: {
            OR: [
                { meta_title: { contains: 'Fotograf' } },
                { title: { contains: 'Fotograf' } },
                { content: { contains: 'Fotograf' } }
            ]
        },
        select: {
            slug: true,
            title: true,
            meta_title: true
        }
    });

    console.log('=== PAGES WITH "Fotograf" ===');
    pages.forEach(p => {
        console.log(`\nSlug: ${p.slug}`);
        console.log(`Title: ${p.title}`);
        console.log(`Meta Title: ${p.meta_title}`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
