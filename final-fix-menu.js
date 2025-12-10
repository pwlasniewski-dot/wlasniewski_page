const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalFix() {
    console.log('🔧 OSTATECZNA NAPRAWA BAZY NEON\n');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // 1. Napraw duplikat menu_order
        console.log('📋 Krok 1: Naprawa konfliktów menu_order...\n');

        const pagesOrder1 = await prisma.page.findMany({
            where: {
                is_in_menu: true,
                menu_order: 1
            }
        });

        console.log(`Znaleziono ${pagesOrder1.length} stron z menu_order=1:`);
        pagesOrder1.forEach(p => console.log(`  - ID ${p.id}: ${p.slug}`));

        // Ustaw stronę główną na menu_order=0 i is_in_menu=false
        const homepage = await prisma.page.findFirst({
            where: { slug: 'strona-glowna' }
        });

        if (homepage) {
            if (homepage.is_in_menu) {
                await prisma.page.update({
                    where: { id: homepage.id },
                    data: {
                        is_in_menu: false,
                        menu_order: 0
                    }
                });
                console.log(`\n✅ Strona główna (ID ${homepage.id}): is_in_menu=false, menu_order=0`);
            }
        }

        // 2. Upewnij się że kolejność menu jest unikalna
        console.log('\n\n📊 Krok 2: Weryfikacja unikalności menu_order...\n');

        const allMenuPages = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: [
                { menu_order: 'asc' },
                { id: 'asc' } // Secondary sort dla stability
            ]
        });

        console.log(`Strony w menu (${allMenuPages.length}):`);

        // Przypisz unikalne kolejne numery
        for (let i = 0; i < allMenuPages.length; i++) {
            const targetOrder = i + 1; // 1, 2, 3, 4, 5...

            if (allMenuPages[i].menu_order !== targetOrder) {
                await prisma.page.update({
                    where: { id: allMenuPages[i].id },
                    data: { menu_order: targetOrder }
                });
                console.log(`  ✅ ${allMenuPages[i].slug}: menu_order ${allMenuPages[i].menu_order} → ${targetOrder}`);
            } else {
                console.log(`  ✓ ${allMenuPages[i].slug}: menu_order=${targetOrder} (OK)`);
            }
        }

        // 3. Wyczyść stare menu_items jeśli są
        console.log('\n\n🗑️  Krok 3: Czyszczenie menu_items...\n');
        const menuItemsCount = await prisma.menuItem.count();
        if (menuItemsCount > 0) {
            await prisma.menuItem.deleteMany({});
            console.log(`✅ Usunięto ${menuItemsCount} wpisów z menu_items`);
        } else {
            console.log('✓ menu_items już czysta');
        }

        // 4. Weryfikacja końcowa
        console.log('\n\n✅ Krok 4: Weryfikacja końcowa...\n');
        console.log('═══════════════════════════════════════════════════════\n');

        const final = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: { menu_order: 'asc' }
        });

        console.log('FINALNE MENU:');
        console.table(final.map(p => ({
            order: p.menu_order,
            slug: p.slug,
            title: p.menu_title || p.title
        })));

        // Sprawdź duplikaty
        const orderMap = {};
        final.forEach(p => {
            orderMap[p.menu_order] = (orderMap[p.menu_order] || 0) + 1;
        });

        const duplicates = Object.entries(orderMap).filter(([_, count]) => count > 1);
        if (duplicates.length === 0) {
            console.log('\n✅✅✅ WSZYSTKIE KONFLIKTY NAPRAWIONE! ✅✅✅\n');
        } else {
            console.log('\n⚠️ NADAL SĄ DUPLIKATY:');
            duplicates.forEach(([order, count]) => {
                console.log(`  menu_order=${order}: ${count} stron`);
            });
        }

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        await prisma.$disconnect();
    }
}

finalFix();
