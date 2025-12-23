const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fullAnalysis() {
    console.log('=== COMPLETE DATABASE ANALYSIS ===\n');

    try {
        // Get all pages with ALL menu-related fields
        console.log('📄 ALL PAGES (COMPLETE):');
        const allPages = await prisma.page.findMany({
            orderBy: { id: 'asc' }
        });

        allPages.forEach(page => {
            console.log(`\n--- Page ID: ${page.id} ---`);
            console.log(`Slug: "${page.slug}"`);
            console.log(`Title: ${page.title}`);
            console.log(`Is Published: ${page.is_published}`);
            console.log(`Is In Menu: ${page.is_in_menu}`);
            console.log(`Menu Title: ${page.menu_title || 'NULL'}`);
            console.log(`Menu Order: ${page.menu_order}`);
            console.log(`Page Type: ${page.page_type}`);
            if (page.home_sections) {
                console.log(`Home Sections Length: ${page.home_sections.length}`);
            }
        });

        // Get menu_items
        console.log('\n\n📋 MENU_ITEMS TABLE (DEPRECATED):');
        const menuItems = await prisma.menuItem.findMany({
            include: {
                page: {
                    select: { slug: true, title: true }
                }
            },
            orderBy: { order: 'asc' }
        });

        if (menuItems.length > 0) {
            console.table(menuItems.map(mi => ({
                id: mi.id,
                title: mi.title,
                url: mi.url,
                page_id: mi.page_id,
                page_slug: mi.page?.slug,
                order: mi.order,
                is_active: mi.is_active
            })));
        } else {
            console.log('✅ Table is empty (good!)');
        }

        // Get SETTINGS
        console.log('\n\n⚙️ SETTINGS TABLE:');
        const settings = await prisma.setting.findMany({
            select: {
                id: true,
                setting_key: true,
                setting_value: true
            }
        });
        console.log(`Found ${settings.length} settings`);

        // Check navbar settings specifically
        const navbarSettings = settings.filter(s => s.setting_key && s.setting_key.includes('navbar'));
        if (navbarSettings.length > 0) {
            console.log('\nNavbar-related settings:');
            navbarSettings.forEach(s => {
                console.log(`  ${s.setting_key}: ${s.setting_value}`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fullAnalysis();
