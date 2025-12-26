import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany();
    pages.forEach(p => {
        console.log(`SLUG: ${p.slug} | TITLE: ${p.title} | PUBLISHED: ${p.is_published}`);
    });
}

main().finally(() => prisma.$disconnect());
