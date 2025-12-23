
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const page = await prisma.page.findUnique({
        where: { slug: 'portfolio' }
    });
    console.log('Portfolio Page:', page);
    if (page && page.sections) {
        console.log('Sections:', page.sections);
    } else {
        console.log('No sections data found.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
