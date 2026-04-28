import prisma from './src/lib/db/prisma';

async function main() {
    const pages = await prisma.page.findMany({
        select: {
            slug: true,
            page_type: true,
            title: true
        }
    });
    console.log(JSON.stringify(pages, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
