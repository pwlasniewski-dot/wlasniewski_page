const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Naprawiam stronę główną...\n');

    // Create default home_sections
    const defaultSections = {
        hero_slider: [],
        sections: []
    };

    // Update homepage
    const updated = await prisma.page.update({
        where: { id: 1 },
        data: {
            slug: '',  // Keep empty slug for homepage
            title: 'Strona Główna',
            home_sections: JSON.stringify(defaultSections),
            is_in_menu: true,
            is_published: true
        }
    });

    console.log('✅ Strona główna naprawiona!');
    console.log('   ID:', updated.id);
    console.log('   Slug:', `"${updated.slug}" (puste = homepage)`);
    console.log('   Home sections: Zainicjalizowane');
    console.log('\n✅ Teraz możesz edytować w adminie!');
}

main()
    .catch(e => {
        console.error('❌ Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
