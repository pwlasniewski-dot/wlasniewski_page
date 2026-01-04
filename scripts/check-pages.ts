
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany({
        where: {
            slug: {
                contains: 'blog'
            }
        },
        select: {
            id: true,
            slug: true,
            title: true,
            page_type: true
        }
    });

    console.log('Pages matching "blog":', pages);

    const b2bPages = await prisma.page.findMany({
        where: {
            page_type: 'b2b'
        },
        select: { id: true, slug: true, title: true }
    });
    console.log('B2B Pages:', b2bPages);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
