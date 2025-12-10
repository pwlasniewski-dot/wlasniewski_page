const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const page = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });
        if (page) {
            console.log('Page found:', page.id);
            console.log('Page Type:', page.page_type);
            console.log('Home Sections (Raw):');
            console.log(page.home_sections);
        } else {
            console.log('Page NOT found');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
