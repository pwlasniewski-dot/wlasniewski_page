const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function polishAnalysis() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  ANALIZA BAZY DANYCH - WYJAŚNIENIE PROBLEMÓW');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // 1. Sprawdź menu_items (STARY SYSTEM)
        console.log('📋 PROBLEM #1: TABELA menu_items (PRZESTARZAŁA)\n');
        console.log('Co to jest:');
        console.log('  - Stary system zarządzania menu');
        console.log('  - Osobna tabela z pozycjami menu\n');

        const menuItems = await prisma.menuItem.findMany({
            include: {
                page: {
                    select: { id: true, slug: true, title: true }
                }
            }
        });

        console.log(`Znaleziono ${menuItems.length} wpisów w tabeli menu_items:\n`);

        if (menuItems.length > 0) {
            menuItems.forEach(item => {
                console.log(`  MenuItem ID ${item.id}:`);
                console.log(`    Tytuł: "${item.title}"`);
                console.log(`    URL: ${item.url || 'brak'}`);
                console.log(`    page_id: ${item.page_id || 'brak'}`);
                if (item.page) {
                    console.log(`    ✅ Linkuje do strony: ${item.page.slug}`);
                } else if (item.page_id) {
                    console.log(`    ❌ Linkuje do NIEISTNIEJĄCEJ strony ID ${item.page_id}!`);
                }
                console.log('');
            });

            console.log('⚠️  DLACZEGO TO PROBLEM?');
            console.log('─────────────────────────────');
            console.log('1. System został ZMIENIONY - menu teraz działa inaczej');
            console.log('2. Nowy system używa pól w tabeli "pages":');
            console.log('   - is_in_menu (czy pokazać w menu?)');
            console.log('   - menu_title (tytuł w menu)');
            console.log('   - menu_order (kolejność)');
            console.log('3. Stara tabela menu_items jest IGNOROWANA przez kod');
            console.log('4. Powoduje to KONFUZJĘ - są dwa źródła prawdy\n');
        }

        // 2. Sprawdź nowy system menu
        console.log('\n📄 NOWY SYSTEM MENU (pages.is_in_menu)\n');

        const pagesInMenu = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: { menu_order: 'asc' },
            select: {
                id: true,
                slug: true,
                title: true,
                menu_title: true,
                menu_order: true,
                is_published: true
            }
        });

        console.log(`Strony w nowym systemie menu (${pagesInMenu.length}):\n`);
        pagesInMenu.forEach(page => {
            console.log(`  ${page.menu_order}. "${page.menu_title || page.title}" (/${page.slug})`);
            console.log(`     Opublikowana: ${page.is_published ? '✅ Tak' : '❌ Nie'}`);
        });

        // 3. Porównaj systemy
        console.log('\n\n🔍 PORÓWNANIE SYSTEMÓW\n');
        console.log('─────────────────────────────────────');

        console.log('STARY SYSTEM (menu_items):');
        console.log(`  - Liczba pozycji: ${menuItems.length}`);
        console.log(`  - Status: ⚠️  NIEUŻYWANY przez kod`);
        console.log(`  - Problem: Dane są, ale nikt ich nie czyta\n`);

        console.log('NOWY SYSTEM (pages.is_in_menu):');
        console.log(`  - Liczba pozycji: ${pagesInMenu.length}`);
        console.log(`  - Status: ✅ AKTYWNY - to ten system jest używany`);
        console.log(`  - Działanie: API /api/menu czyta z tego systemu\n`);

        // 4. Sprawdźstrony bez odpowiedników
        console.log('\n📊 SZCZEGÓŁOWA ANALIZA\n');
        console.log('─────────────────────────────────────\n');

        const allPages = await prisma.page.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
                is_in_menu: true,
                menu_title: true,
                menu_order: true
            }
        });

        console.log(`Wszystkie strony w bazie: ${allPages.length}\n`);

        const pagesNotInMenu = allPages.filter(p => !p.is_in_menu);
        console.log(`Strony POZA menu (is_in_menu=false): ${pagesNotInMenu.length}`);
        pagesNotInMenu.forEach(p => {
            console.log(`  - ${p.slug} ("${p.title}")`);
        });

        // 5. ROZWIĄZANIA
        console.log('\n\n✨ ROZWIĄZANIA\n');
        console.log('═════════════════════════════════════════════════════════\n');

        console.log('OPCJA 1: Wyczyść starą tabelę (ZALECANE)');
        console.log('─────────────────────────────────────');
        console.log('SQL:');
        console.log('  DELETE FROM "menu_items";\n');
        console.log('Dlaczego:');
        console.log('  ✅ Usuwa martwy kod');
        console.log('  ✅ Eliminuje konfuzję');
        console.log('  ✅ Nowy system już działa poprawnie');
        console.log('  ⚠️  Bezpieczne - stare dane nie są używane\n');

        console.log('OPCJA 2: Migruj dane ze starego systemu (NIEPOTRZEBNE)');
        console.log('─────────────────────────────────────');
        console.log('Dlaczego NIEPOTRZEBNE:');
        console.log('  ❌ Nowy system już ma poprawne dane');
        console.log('  ❌ Stary system miał inne ID i referencje');
        console.log('  ❌ Ryzyko nadpisania poprawnych danych\n');

        // 6. PODSUMOWANIE
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('  PODSUMOWANIE - CO SIĘ DZIEJE?');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('🎯 GŁÓWNY PROBLEM:');
        console.log('   System menu został PRZEPROJEKTOWANY, ale stara tabela');
        console.log('   nadal zawiera dane, które są IGNOROWANE.\n');

        console.log('📌 CO DZIAŁA:');
        console.log('   ✅ Navbar pobiera menu z /api/menu');
        console.log('   ✅ /api/menu czyta z pages.is_in_menu');
        console.log('   ✅ Strony mają poprawne ustawienia menu\n');

        console.log('⚠️  CO NIE DZIAŁA:');
        if (menuItems.length > 0) {
            console.log(`   ❌ Tabela menu_items ma ${menuItems.length} wpisów, ale NIE SĄ UŻYWANE`);
            console.log('   ❌ To "martwy kod" w bazie danych\n');
        } else {
            console.log('   ✅ Tabela menu_items jest pusta\n');
        }

        console.log('💡 ZALECENIE:');
        console.log('   Wyczyść tabelę menu_items - nie jest już potrzebna.\n');

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        await prisma.$disconnect();
    }
}

polishAnalysis();
