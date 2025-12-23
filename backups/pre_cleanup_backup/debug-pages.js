
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany({
        select: {
            id: true,
            title: true,
            slug: true,
            page_type: true,
            is_published: true
        }
    });
    console.log(JSON.stringify(pages, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
