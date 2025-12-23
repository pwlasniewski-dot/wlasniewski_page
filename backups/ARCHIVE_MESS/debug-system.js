
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSystem() {
    try {
        console.log('--- PAGES ---');
        const pages = await prisma.page.findMany();
        pages.forEach(p => {
            console.log(`[${p.id}] Title: "${p.title}", Slug: "${p.slug}", Type: "${p.page_type}", Published: ${p.is_published}`);
        });

        console.log('\n--- MENU ITEMS ---');
        const menu = await prisma.menuItem.findMany();
        menu.forEach(m => {
            console.log(`[${m.id}] Label: "${m.label}", URL: "${m.url}"`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugSystem();
