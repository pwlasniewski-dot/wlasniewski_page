import prisma from '../src/lib/db/prisma';

async function updateB2BMenu() {
    console.log('🔄 Updating B2B Menu Structure...');

    // Delete old B2B menu items
    await prisma.menuItem.deleteMany({
        where: { menu_type: 'b2b' }
    });

    // Create new B2B menu structure (4 main items minimum)
    const menuItems = [
        {
            title: 'Start',
            url: '/b2b',
            order: 1,
            menu_type: 'b2b',
            is_active: true
        },
        {
            title: 'Termowizja',
            url: '/b2b/termowizja',
            order: 2,
            menu_type: 'b2b',
            is_active: true
        },
        {
            title: 'Inspekcje',
            url: '/b2b/inspekcje',
            order: 3,
            menu_type: 'b2b',
            is_active: true
        },
        {
            title: 'Monitoring',
            url: '/b2b/monitoring',
            order: 4,
            menu_type: 'b2b',
            is_active: true
        },
        {
            title: 'Kontakt',
            url: '/b2b/kontakt',
            order: 5,
            menu_type: 'b2b',
            is_active: true
        }
    ];

    for (const item of menuItems) {
        await prisma.menuItem.create({
            data: item
        });
    }

    console.log('✅ B2B Menu updated successfully!');
    console.log('📋 Created 5 menu items:');
    menuItems.forEach(item => console.log(`   - ${item.title} (${item.url})`));
}

updateB2BMenu()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('❌ Error:', err);
        process.exit(1);
    });
