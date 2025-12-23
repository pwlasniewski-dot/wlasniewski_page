const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDatabase() {
    console.log('🔧 FIXING DATABASE - MENU & HOMEPAGE\n');

    try {
        // Step 1: Check if ID 141 exists and delete it
        console.log('Step 1: Removing duplicate homepage (ID 141 with empty slug)...');
        const duplicate = await prisma.page.findUnique({ where: { id: 141 } });
        if (duplicate) {
            await prisma.page.delete({ where: { id: 141 } });
            console.log('✅ Deleted page ID 141');
        } else {
            console.log('ℹ️ Page ID 141 not found (already deleted or never existed)');
        }

        // Step 2: Fix homepage (ID 135)
        console.log('\nStep 2: Fixing homepage (ID 135)...');
        const homepage = await prisma.page.findUnique({ where: { id: 135 } });
        if (homepage) {
            await prisma.page.update({
                where: { id: 135 },
                data: {
                    is_in_menu: false,  // Homepage not in menu usually
                    menu_title: 'Strona Główna',
                    menu_order: 0
                }
            });
            console.log('✅ Updated homepage ID 135');
        } else {
            console.log('⚠️ Homepage ID 135 not found!');
        }

        // Step 3: Set menu defaults for existing pages
        console.log('\nStep 3: Setting menu configuration for existing pages...');

        const menuConfig = [
            { slug: 'o-mnie', is_in_menu: true, menu_title: 'O mnie', menu_order: 1 },
            { slug: 'portfolio', is_in_menu: true, menu_title: 'Portfolio', menu_order: 2 },
            { slug: 'blog', is_in_menu: true, menu_title: 'Blog', menu_order: 3 },
            { slug: 'rezerwacja', is_in_menu: true, menu_title: 'Rezerwacja', menu_order: 4 },
            { slug: 'foto-wyzwanie', is_in_menu: true, menu_title: 'Foto Wyzwanie', menu_order: 5 }
        ];

        for (const config of menuConfig) {
            const page = await prisma.page.findUnique({ where: { slug: config.slug } });
            if (page) {
                await prisma.page.update({
                    where: { slug: config.slug },
                    data: {
                        is_in_menu: config.is_in_menu,
                        menu_title: config.menu_title,
                        menu_order: config.menu_order
                    }
                });
                console.log(`✅ Updated ${config.slug}: "${config.menu_title}" (order: ${config.menu_order})`);
            } else {
                console.log(`⚠️ Page "${config.slug}" not found, skipping`);
            }
        }

        // Step 4: Check menu_items table and warn if populated
        console.log('\nStep 4: Checking deprecated menu_items table...');
        const menuItems = await prisma.menuItem.findMany();
        if (menuItems.length > 0) {
            console.log(`⚠️ Found ${menuItems.length} entries in menu_items table (DEPRECATED)`);
            console.log('   These will be ignored by the new menu system.');
        } else {
            console.log('✅ menu_items table is empty (good!)');
        }

        // Step 5: Verify final state
        console.log('\n\n📊 FINAL DATABASE STATE:\n');
        const allPages = await prisma.page.findMany({
            where: { is_published: true },
            select: {
                id: true,
                slug: true,
                title: true,
                is_in_menu: true,
                menu_title: true,
                menu_order: true
            },
            orderBy: { menu_order: 'asc' }
        });

        console.table(allPages);

        console.log('\n\n✅ DATABASE MIGRATION COMPLETED SUCCESSFULLY!\n');

    } catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

fixDatabase();
