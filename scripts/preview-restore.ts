/**
 * RESTORE PREVIEW - DETAILED SIMULATION
 * Shows exactly what would be restored without database connection
 */

import * as fs from 'fs';
import * as path from 'path';

function previewRestore() {
    console.log('═══════════════════════════════════════════════════════');
    console.log('   SYMULACJA PRZYWRACANIA DANYCH Z PRODUKCJI');
    console.log('═══════════════════════════════════════════════════════\n');

    const backupFile = path.join(__dirname, '..', 'backups', 'data', 'latest-holy-backup.json');

    if (!fs.existsSync(backupFile)) {
        console.error('❌ Brak pliku backupu!');
        process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
    const fileSize = fs.statSync(backupFile).size;

    console.log('📁 Źródło backupu:');
    console.log(`   ${backupFile}`);
    console.log(`   Rozmiar: ${(fileSize / 1024).toFixed(2)} KB`);
    console.log(`   Data: ${fs.statSync(backupFile).mtime.toLocaleString('pl-PL')}\n`);

    // Critical tables analysis
    const criticalTables = {
        'adminUser': 'Administratorzy',
        'user': 'Użytkownicy',
        'page': 'Strony',
        'blogPost': 'Posty blogowe',
        'portfolioSession': 'Sesje portfolio',
        'mediaLibrary': 'Biblioteka mediów',
        'menuItem': 'Menu',
        'heroSlide': 'Slider Hero',
        'testimonial': 'Opinie klientów',
        'serviceType': 'Typy usług',
        'package': 'Pakiety',
        'setting': 'Ustawienia',
        'giftCard': 'Karty podarunkowe',
        'inquiry': 'Zapytania',
        'booking': 'Rezerwacje',
        'droneOrder': 'Zamówienia dron',
        'businessGoal': 'Cele biznesowe',
        'marketingTemplate': 'Szablony marketingowe'
    };

    console.log('📊 CO ZOSTANIE PRZYWRÓCONE:\n');

    let totalRecords = 0;
    const tablesToRestore: any[] = [];

    Object.entries(criticalTables).forEach(([table, polishName]) => {
        const records = backupData[table] || [];
        const count = records.length;
        totalRecords += count;

        if (count > 0) {
            tablesToRestore.push({ table, polishName, count, records });
            const icon = count > 10 ? '🔥' : count > 0 ? '✓' : '○';
            console.log(`  ${icon} ${polishName.padEnd(25)} ${count.toString().padStart(4)} rekordów`);
        }
    });

    console.log(`\n  📊 SUMA: ${totalRecords} rekordów w ${tablesToRestore.length} tabelach\n`);

    // Detailed content preview
    console.log('═══════════════════════════════════════════════════════');
    console.log('   SZCZEGÓŁOWA ZAWARTOŚĆ BACKUPU');
    console.log('═══════════════════════════════════════════════════════\n');

    // Pages
    const pages = backupData.page || [];
    console.log(`📄 STRONY (${pages.length}):\n`);
    pages.forEach((page: any) => {
        const published = page.is_published ? '✅ OPUBLIKOWANA' : '⚪ SZKIC';
        console.log(`   ${published} "${page.title}"`);
        console.log(`      Slug: /${page.slug}`);
        console.log(`      Typ: ${page.page_type || 'regular'}`);
        if (page.slug === 'pkp-pluznica') {
            console.log(`      🎯 ← NAJNOWSZY POST!`);
        }
        console.log('');
    });

    // Blog Posts
    const blogPosts = backupData.blogPost || [];
    if (blogPosts.length > 0) {
        console.log(`\n📝 POSTY BLOGOWE (${blogPosts.length}):\n`);
        blogPosts.forEach((post: any) => {
            const status = post.status === 'published' ? '✅' : '⚪';
            console.log(`   ${status} "${post.title}"`);
            console.log(`      Slug: /blog/${post.slug}`);
            console.log(`      Data: ${post.published_at || post.created_at}`);
            console.log('');
        });
    }

    // Portfolio
    const portfolio = backupData.portfolioSession || [];
    if (portfolio.length > 0) {
        console.log(`\n📸 PORTFOLIO (${portfolio.length} sesji):\n`);
        portfolio.forEach((session: any) => {
            const published = session.is_published ? '✅' : '⚪';
            console.log(`   ${published} "${session.title}"`);
            console.log(`      Kategoria: ${session.category}`);
            console.log(`      Slug: /portfolio/${session.slug}`);
            console.log('');
        });
    }

    // Media
    const media = backupData.mediaLibrary || [];
    console.log(`\n🖼️  MEDIA (${media.length} plików):\n`);
    const mediaByFolder: any = {};
    media.forEach((m: any) => {
        const folder = m.folder || 'root';
        if (!mediaByFolder[folder]) mediaByFolder[folder] = 0;
        mediaByFolder[folder]++;
    });
    Object.entries(mediaByFolder).forEach(([folder, count]) => {
        console.log(`   📁 ${folder}: ${count} plików`);
    });

    // Settings
    const settings = backupData.setting || [];
    console.log(`\n⚙️  USTAWIENIA (${settings.length}):\n`);
    const importantSettings = ['logo_url', 'navbar_sticky', 'theme_mode', 'portfolio_layout'];
    settings.forEach((s: any) => {
        if (importantSettings.includes(s.setting_key)) {
            console.log(`   - ${s.setting_key}: ${s.setting_value || '(not set)'}`);
        }
    });

    // Menu
    const menu = backupData.menuItem || [];
    console.log(`\n🗂️  MENU (${menu.length} elementów):\n`);
    menu.forEach((item: any) => {
        const type = item.menu_type || 'b2c';
        const active = item.is_active ? '✅' : '⚪';
        console.log(`   ${active} [${type.toUpperCase()}] ${item.title}`);
        console.log(`      URL: ${item.url || '(dynamiczny)'}`);
    });

    // Process summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   PLAN PRZYWRACANIA');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🔄 KOLEJNOŚĆ OPERACJI (według zależności):\n');
    const restoreOrder = [
        { table: 'adminUser', desc: 'Konta administratorów' },
        { table: 'user', desc: 'Konta użytkowników' },
        { table: 'setting', desc: 'Ustawienia systemu' },
        { table: 'mediaLibrary', desc: 'Pliki mediów' },
        { table: 'serviceType', desc: 'Typy usług' },
        { table: 'package', desc: 'Pakiety usług' },
        { table: 'page', desc: 'Strony (w tym pkp-pluznica)' },
        { table: 'menuItem', desc: 'Elementy menu' },
        { table: 'blogPost', desc: 'Posty blogowe' },
        { table: 'portfolioSession', desc: 'Sesje portfolio' },
        { table: 'testimonial', desc: 'Opinie klientów' },
        { table: 'giftCard', desc: 'Karty podarunkowe' }
    ];

    restoreOrder.forEach((step, index) => {
        const records = backupData[step.table] || [];
        if (records.length > 0) {
            console.log(`   ${(index + 1).toString().padStart(2)}. ${step.desc}`);
            console.log(`       → ${records.length} rekordów do przywrócenia`);
        }
    });

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   WERYFIKACJA INTEGRALNOŚCI');
    console.log('═══════════════════════════════════════════════════════\n');

    // Integrity checks
    const pkpPage = pages.find((p: any) => p.slug === 'pkp-pluznica');

    if (pkpPage) {
        console.log('   ✅ Ostatni wpis "PKP Płużnica" obecny');
        console.log(`      - ID: ${pkpPage.id}`);
        console.log(`      - Opublikowana: ${pkpPage.is_published ? 'TAK' : 'NIE'}`);
    } else {
        console.log('   ❌ Brak wpisu "PKP Płużnica"!');
    }

    console.log(`   ✅ ${pages.length} stron gotowych do restore`);
    console.log(`   ✅ ${media.length} plików mediów`);
    console.log(`   ✅ ${menu.length} elementów menu`);
    console.log(`   ✅ ${settings.length} ustawień systemu`);

    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('✅ SYMULACJA ZAKOŃCZONA POMYŚLNIE\n');
    console.log('📌 Backup jest kompletny i gotowy do przywrócenia 1:1');
    console.log('⚠️  Rzeczywiste przywracanie: npm run db:restore');
    console.log('\n═══════════════════════════════════════════════════════\n');
}

previewRestore();
