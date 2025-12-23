const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMenu() {
    console.log('=== AUDIT: PAGES WITH is_in_menu=true ===\n');

    try {
        const pagesInMenu = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: { menu_order: 'asc' },
            select: {
                id: true,
                title: true,
                slug: true,
                is_published: true,
                menu_title: true,
                menu_order: true,
                page_type: true
            }
        });

        console.log(`Found ${pagesInMenu.length} pages with is_in_menu=true\n`);

        if (pagesInMenu.length === 0) {
            console.log('❌ NO PAGES IN MENU! Menu will be EMPTY!');
            console.log('\nTo add pages to menu:');
            console.log('1. Go to Admin → Pages');
            console.log('2. Edit each page and check "Wyświetl w menu głównym"');
        } else {
            console.log('✅ Menu pages:');
            // Check for duplicates
            const orders = pagesInMenu.map(p => p.menu_order);
            const duplicates = orders.filter((o, i) => orders.indexOf(o) !== i);
            
            pagesInMenu.forEach(p => {
                const isDup = duplicates.includes(p.menu_order);
                console.log(`  ${p.menu_order}${isDup ? ' ⚠️ DUPLICATE' : ''}. ${p.slug}`);
                console.log(`     Title: "${p.title}"`);
                console.log(`     Menu Title: "${p.menu_title}"`);
                console.log(`     Published: ${p.is_published ? '✓' : '❌'}`);
            });

            if (duplicates.length > 0) {
                console.log(`\n❌ PROBLEM: ${duplicates.length} duplicate menu_order values: ${[...new Set(duplicates)].join(', ')}`);
            }
        }

        // Check all pages
        console.log('\n\n=== ALL PAGES IN DATABASE ===\n');
        const allPages = await prisma.page.findMany({
            orderBy: { id: 'asc' },
            select: {
                id: true,
                title: true,
                slug: true,
                is_published: true,
                is_in_menu: true,
                page_type: true
            }
        });

        console.log(`Total pages: ${allPages.length}\n`);
        allPages.forEach(p => {
            console.log(`ID ${p.id}: ${p.slug}`);
            console.log(`  - Published: ${p.is_published ? '✓' : '✗'}`);
            console.log(`  - In Menu: ${p.is_in_menu ? '✓' : '✗'}`);
            console.log(`  - Type: ${p.page_type || 'regular'}`);
        });

        // Check parent_page_id
        console.log('\n\n=== PAGES WITH parent_page_id ===\n');
        const pagesWithParent = await prisma.page.findMany({
            where: { parent_page_id: { not: null } },
            select: {
                id: true,
                slug: true,
                parent_page_id: true,
                is_in_menu: true
            }
        });

        if (pagesWithParent.length === 0) {
            console.log('✓ No pages with parent_page_id set');
        } else {
            console.log(`Found ${pagesWithParent.length} pages with parent_page_id:`);
            pagesWithParent.forEach(p => {
                console.log(`  - ${p.slug} (parent: ${p.parent_page_id}, in_menu: ${p.is_in_menu})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMenu();
