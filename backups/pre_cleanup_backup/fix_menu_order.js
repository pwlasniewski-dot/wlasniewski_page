const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMenuOrder() {
    console.log('🔧 FIXING MENU ORDER DUPLICATES\n');

    try {
        // Get all pages in menu, sorted by current order
        const pagesInMenu = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: { menu_order: 'asc' },
            select: { id: true, slug: true, menu_title: true, menu_order: true }
        });

        console.log(`Found ${pagesInMenu.length} pages in menu\n`);
        console.log('Current state:');
        pagesInMenu.forEach(p => {
            console.log(`  ${p.slug}: menu_order = ${p.menu_order}`);
        });

        // Fix the order sequentially
        console.log('\n\nFixing to sequential order...\n');
        
        for (let i = 0; i < pagesInMenu.length; i++) {
            const newOrder = i + 1; // 1, 2, 3, 4
            if (pagesInMenu[i].menu_order !== newOrder) {
                await prisma.page.update({
                    where: { id: pagesInMenu[i].id },
                    data: { menu_order: newOrder }
                });
                console.log(`  ✓ ${pagesInMenu[i].slug}: ${pagesInMenu[i].menu_order} → ${newOrder}`);
            } else {
                console.log(`  ✓ ${pagesInMenu[i].slug}: already ${newOrder}`);
            }
        }

        // Verify
        console.log('\n\nVerifying...\n');
        const fixed = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: { menu_order: 'asc' },
            select: { slug: true, menu_order: true }
        });

        fixed.forEach(p => {
            console.log(`  ${p.menu_order}. ${p.slug}`);
        });

        console.log('\n✅ Menu order fixed!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixMenuOrder();
