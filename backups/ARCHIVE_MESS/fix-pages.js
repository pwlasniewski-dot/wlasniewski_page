
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Delete the duplicate "Główna" (id: 8)
    try {
        const deleteGlowna = await prisma.page.delete({
            where: { slug: 'glowna' }
        });
        console.log('Deleted duplicate page: glowna');
    } catch (e) {
        console.log('Page glowna not found or already deleted');
    }

    // 2. Update "Strona główna" (id: 1 presumably, slug: 'strona-glowna') to be type 'home'
    try {
        const updateHome = await prisma.page.update({
            where: { slug: 'strona-glowna' },
            data: { page_type: 'home' }
        });
        console.log('Updated strona-glowna to page_type: home');
    } catch (e) {
        console.error('Failed to update strona-glowna', e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
