const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugMenu() {
    console.log('=== ANALYZING DATABASE STATE ===\n');

    try {
        // 1. Check all pages
        console.log('📄 ALL PAGES:');
        const allPages = await prisma.page.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
                is_published: true,
                is_in_menu: true,
                menu_title: true,
                menu_order: true,
                page_type: true
            },
            orderBy: { id: 'asc' }
        });
        console.table(allPages);

        // 2. Check menu items table
        console.log('\n📋 MENU_ITEMS TABLE:');
        const menuItems = await prisma.menuItem.findMany({
            select: {
                id: true,
                title: true,
                url: true,
                page_id: true,
                parent_id: true,
                order: true,
                is_active: true
            },
            orderBy: { order: 'asc' }
        });
        console.table(menuItems);

        // 3. Check what API /api/menu returns
        console.log('\n🔍 PAGES WITH is_in_menu=true (what /api/menu should return):');
        const menuPages = await prisma.page.findMany({
            where: {
                is_in_menu: true,
                is_published: true
            },
            select: {
                id: true,
                slug: true,
                title: true,
                menu_title: true,
                menu_order: true
            },
            orderBy: { menu_order: 'asc' }
        });
        console.table(menuPages);

        // 4. Check homepage
        console.log('\n🏠 HOMEPAGE (strona-glowna):');
        const homepage = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' },
            select: {
                id: true,
                slug: true,
                title: true,
                is_published: true,
                is_in_menu: true,
                menu_title: true,
                menu_order: true,
                home_sections: true
            }
        });
        if (homepage) {
            console.log('ID:', homepage.id);
            console.log('Title:', homepage.title);
            console.log('Is Published:', homepage.is_published);
            console.log('Is In Menu:', homepage.is_in_menu);
            console.log('Menu Title:', homepage.menu_title);
            console.log('Menu Order:', homepage.menu_order);
            console.log('Home Sections Length:', homepage.home_sections?.length || 0);
        } else {
            console.log('⚠️ NO HOMEPAGE FOUND!');
        }

        // 5. Identify issues
        console.log('\n⚠️ POTENTIAL ISSUES:');
        const issues = [];

        // Check if menu_items table has entries but shouldn't be used
        if (menuItems.length > 0) {
            issues.push(`❌ menu_items table has ${menuItems.length} entries but should be DEPRECATED (menu is now based on pages.is_in_menu)`);
        }

        // Check for pages with is_in_menu but no menu_title
        const pagesInMenuNoTitle = allPages.filter(p => p.is_in_menu && !p.menu_title);
        if (pagesInMenuNoTitle.length > 0) {
            issues.push(`⚠️ ${pagesInMenuNoTitle.length} pages have is_in_menu=true but no menu_title`);
            pagesInMenuNoTitle.forEach(p => {
                console.log(`  - ${p.slug}: missing menu_title`);
            });
        }

        // Check for duplicate menu orders
        const menuOrders = menuPages.map(p => p.menu_order);
        const duplicates = menuOrders.filter((order, index) => menuOrders.indexOf(order) !== index);
        if (duplicates.length > 0) {
            issues.push(`⚠️ Duplicate menu_order values: ${duplicates.join(', ')}`);
        }

        if (issues.length === 0) {
            console.log('✅ No obvious issues detected');
        } else {
            issues.forEach(issue => console.log(issue));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugMenu();
