
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const page = await prisma.page.findFirst({
        where: {
            slug: {
                contains: 'monitoring',
                mode: 'insensitive'
            }
        }
    });

    console.log('Found Page:', page ? page.title : 'None');
    if (page) {
        console.log('Page Type:', page.page_type);
        console.log('Sections Length:', page.sections ? page.sections.length : 0);
        console.log('Content Preview:', page.content ? page.content.substring(0, 100) : 'NULL');
        console.log('Content looks like JSON?', page.content && page.content.trim().startsWith('['));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
