const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const page = await prisma.page.upsert({
      where: { slug: 'dron' },
      create: {
        slug: 'dron',
        title: 'Usługi Dronem i Termowizja B2B',
        menu_title: 'Dron & Termowizja',
        meta_description: 'Profesjonalne inspekcje termowizyjne dronem. Przeglądy fotowoltaiki, dachów i budynków przemysłowych.',
        meta_keywords: 'dron, termowizja, inspekcje, fotowoltaika, B2B',
        is_published: true,
        is_in_menu: true,
        menu_order: 5,
        content: 'Strona usług dronowych',
        parent_page_id: null
      },
      update: {
        is_in_menu: true,
        is_published: true,
        menu_order: 5
      }
    });
    console.log('✅ Strona /dron została dodana do menu!');
    console.log(`   ID: ${page.id}, slug: ${page.slug}, is_in_menu: ${page.is_in_menu}`);
  } catch (error) {
    console.error('❌ Błąd:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
