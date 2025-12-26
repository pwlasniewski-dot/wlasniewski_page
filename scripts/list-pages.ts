import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany({
        select: {
            id: true,
            slug: true,
            title: true,
            is_published: true,
            _count: {
                select: { sections_rel: true }
            }
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
