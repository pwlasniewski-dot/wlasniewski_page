import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPage() {
    const slug = 'o-mnie';
    const page = await prisma.page.findUnique({
        where: { slug }
    });

    if (page && page.sections) {
        console.log('--- SECTIONS START (1000 chars) ---');
        console.log(page.sections.substring(0, 1000));
        console.log('\n--- SECTIONS END (1000 chars) ---');
        console.log(page.sections.substring(page.sections.length - 1000));
    } else {
        console.log('Page not found or no sections');
    }
}

checkPage()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
