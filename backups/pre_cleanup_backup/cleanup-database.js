const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDatabase() {
    console.log('🔧 CZYSZCZENIE BAZY DANYCH\n');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // 1. Znajdź i usuń duplikat strony głównej
        console.log('📄 Krok 1: Sprawdzanie duplikatów strony głównej...\n');

        const homepages = await prisma.page.findMany({
            where: {
                OR: [
                    { slug: 'strona-glowna' },
                    { slug: '' }
                ]
            },
            orderBy: { id: 'asc' }
        });

        console.log(`Znaleziono ${homepages.length} potencjalnych duplikatów:\n`);
        homepages.forEach(hp => {
            console.log(`  ID ${hp.id}: slug="${hp.slug}", title="${hp.title}"`);
        });

        // Usuń strony z pustym slugiem (jeśli są inne niż główna)
        const emptySlugDuplicates = homepages.filter(hp =>
            hp.slug === '' && hp.id !== 147 // 147 to ta która została już naprawiona
        );

        if (emptySlugDuplicates.length > 0) {
            console.log(`\n❌ Usuwanie ${emptySlugDuplicates.length} duplikatów z pustym slugiem...`);
            for (const dup of emptySlugDuplicates) {
                await prisma.page.delete({ where: { id: dup.id } });
                console.log(`  ✅ Usunięto duplikat ID ${dup.id}`);
            }
        }

        // Sprawdź czy są strony z menu_order = 1 (konflikt)
        const order1Pages = await prisma.page.findMany({
            where: {
                is_in_menu: true,
                menu_order: 1
            }
        });

        if (order1Pages.length > 1) {
            console.log(`\n⚠️  Znaleziono ${order1Pages.length} stron z menu_order=1 (konflikt):`);
            order1Pages.forEach(p => console.log(`  - ID ${p.id}: ${p.slug}`));

            // Ustaw stronę główną na menu_order = 0
            const homepage = order1Pages.find(p => p.slug === 'strona-glowna');
            if (homepage) {
                await prisma.page.update({
                    where: { id: homepage.id },
                    data: {
                        menu_order: 0,
                        is_in_menu: false // strona główna zwykle nie jest w menu
                    }
                });
                console.log(`  ✅ Strona główna ustawiona na menu_order=0, is_in_menu=false`);
            }
        }

        // 2. Wyczyść tabelę menu_items
        console.log('\n\n📋 Krok 2: Czyszczenie starej tabeli menu_items...\n');

        const menuItemsCount = await prisma.menuItem.count();
        console.log(`Znaleziono ${menuItemsCount} starych wpisów menu_items`);

        if (menuItemsCount > 0) {
            const deleted = await prisma.menuItem.deleteMany({});
            console.log(`✅ Usunięto ${deleted.count} wpisów z menu_items`);
            console.log('   (Nowy system używa pages.is_in_menu)');
        } else {
            console.log('✅ Tabela menu_items już pusta');
        }

        // 3. Weryfikacja końcowa
        console.log('\n\n✅ Krok 3: Weryfikacja końcowa...\n');
        console.log('═══════════════════════════════════════════════════════\n');

        const finalPages = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: { menu_order: 'asc' },
            select: {
                id: true,
                slug: true,
                title: true,
                menu_title: true,
                menu_order: true
            }
        });

        console.log('📊 AKTUALNE MENU:\n');
        finalPages.forEach(p => {
            console.log(`  ${p.menu_order}. "${p.menu_title || p.title}" (/${p.slug})`);
        });

        const finalMenuItems = await prisma.menuItem.count();
        console.log(`\n📋 Stara tabela menu_items: ${finalMenuItems} wpisów (powinno być 0)`);

        if (finalMenuItems === 0 && finalPages.every((p, i) => i === 0 || p.menu_order !== finalPages[i - 1].menu_order)) {
            console.log('\n✅✅✅ BAZA DANYCH WYCZYSZCZONA! ✅✅✅\n');
        } else {
            console.log('\n⚠️ Mogą pozostać drobne problemy - sprawdź powyżej\n');
        }

    } catch (error) {
        console.error('❌ Błąd podczas czyszczenia:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanupDatabase();
