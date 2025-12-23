const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActualNeonState() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  AKTUALNY STAN BAZY NEON - PEŁNA ANALIZA');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
        // 1. Strona główna
        console.log('🏠 STRONA GŁÓWNA:\n');
        const homepages = await prisma.page.findMany({
            where: {
                OR: [
                    { slug: 'strona-glowna' },
                    { slug: '' },
                    { title: { contains: 'Strona Główna' } }
                ]
            }
        });

        console.table(homepages.map(p => ({
            id: p.id,
            slug: `"${p.slug}"`,
            title: p.title,
            is_published: p.is_published,
            is_in_menu: p.is_in_menu,
            menu_order: p.menu_order,
            has_home_sections: p.home_sections ? `${p.home_sections.length} chars` : 'NULL'
        })));

        // 2. Wszystkie strony w menu
        console.log('\n\n📋 STRONY W MENU:\n');
        const menuPages = await prisma.page.findMany({
            where: { is_in_menu: true },
            orderBy: { menu_order: 'asc' }
        });

        console.table(menuPages.map(p => ({
            menu_order: p.menu_order,
            slug: p.slug,
            menu_title: p.menu_title || p.title,
            is_published: p.is_published
        })));

        // 3. Stara tabela menu_items
        console.log('\n\n🗂️  STARA TABELA menu_items:\n');
        const oldMenuItems = await prisma.menuItem.count();
        console.log(`Liczba wpisów: ${oldMenuItems}`);

        if (oldMenuItems > 0) {
            const items = await prisma.menuItem.findMany({
                include: { page: { select: { slug: true, title: true } } }
            });
            console.table(items.map(i => ({
                id: i.id,
                title: i.title,
                url: i.url,
                page_id: i.page_id,
                page_exists: i.page ? 'TAK' : 'NIE'
            })));
        }

        // 4. Error notes
        console.log('\n\n📓 NOTATNIK BŁĘDÓW:\n');
        const errorNotes = await prisma.errorNote.count();
        console.log(`Liczba notatek: ${errorNotes}`);

        if (errorNotes > 0) {
            const notes = await prisma.errorNote.findMany({
                orderBy: { created_at: 'desc' },
                take: 5
            });
            console.table(notes.map(n => ({
                title: n.title,
                severity: n.severity,
                status: n.status
            })));
        }

        // 5. PODSUMOWANIE PROBLEMÓW
        console.log('\n\n═══════════════════════════════════════════════════════');
        console.log('  PODSUMOWANIE - CO NAPRAWDĘ DZIAŁA:');
        console.log('═══════════════════════════════════════════════════════\n');

        const issues = [];

        // Problem 1: Duplikaty homepage
        if (homepages.length > 1) {
            const inMenu = homepages.filter(h => h.is_in_menu);
            if (inMenu.length > 1) {
                issues.push(`❌ ${inMenu.length} strony główne z is_in_menu=true (DUPLIKAT W MENU)`);
            }
        }

        // Problem 2: Homepage bez home_sections
        const mainHomepage = homepages.find(h => h.slug === 'strona-glowna');
        if (mainHomepage && !mainHomepage.home_sections) {
            issues.push('⚠️  Strona główna NIE MA home_sections (brak zawartości)');
        }

        // Problem 3: Stare menu_items
        if (oldMenuItems > 0) {
            issues.push(`⚠️  Stara tabela menu_items ma ${oldMenuItems} wpisów (MARTWY KOD)`);
        }

        // Problem 4: Konflikty menu_order
        const orderConflicts = menuPages.reduce((acc, page) => {
            acc[page.menu_order] = (acc[page.menu_order] || 0) + 1;
            return acc;
        }, {});
        const duplicateOrders = Object.entries(orderConflicts).filter(([_, count]) => count > 1);
        if (duplicateOrders.length > 0) {
            duplicateOrders.forEach(([order, count]) => {
                issues.push(`❌ ${count} stron z menu_order=${order} (KONFLIKT KOLEJNOŚCI)`);
            });
        }

        if (issues.length === 0) {
            console.log('✅✅✅ WSZYSTKO OK! Brak problemów.\n');
        } else {
            console.log('ZNALEZIONE PROBLEMY:\n');
            issues.forEach((issue, i) => console.log(`${i + 1}. ${issue}`));
            console.log('');
        }

    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkActualNeonState();
