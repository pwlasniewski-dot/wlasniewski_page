#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanup() {
    console.log('🗑️  Czyszczenie starego systemu menu...\n');
    
    try {
        // 1. Sprawdź ile wpisów jest w menu_items
        const count = await prisma.menuItem.count();
        console.log(`📋 Znaleziono ${count} wpisów w tabeli menu_items`);
        
        if (count > 0) {
            // 2. Usuń wszystkie wpisy
            const deleted = await prisma.menuItem.deleteMany({});
            console.log(`✅ Usunięto ${deleted.count} wpisów`);
        }
        
        // 3. Sprawdź menu z pages
        const pageMenu = await prisma.page.findMany({
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
        
        console.log(`\n✨ Bieżące menu (z tabeli pages):`);
        if (pageMenu.length === 0) {
            console.log('   (Menu jest puste - dodaj strony przez Admin → Pages)');
        } else {
            pageMenu.forEach(page => {
                console.log(`   ${page.menu_order}. ${page.menu_title || page.title} (/${page.slug})`);
            });
        }
        
        console.log('\n✅ Czyszczenie ukończone!');
        console.log('\n📌 NASTĘPNY KROK:');
        console.log('   1. Otwórz Admin → Pages');
        console.log('   2. Dla każdej strony którą chcesz w menu:');
        console.log('      ☑️  Zaznacz "Wyświetl w menu głównym"');
        console.log('   3. Front automatycznie się zaktualizuje\n');
        
    } catch (error) {
        console.error('❌ Błąd:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
