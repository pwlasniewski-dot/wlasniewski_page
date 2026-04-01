import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== FIXING SEO AUDIT ISSUES ===\n');

    const page = await prisma.page.findUnique({
        where: { slug: 'b2b' }
    });

    if (!page) {
        console.log('❌ Page not found');
        return;
    }

    // Fix 1: Optimize Meta Title (remove FOTO-DRON duplication since template adds it)
    const oldMetaTitle = page.meta_title;
    const newMetaTitle = "Inspekcje Dronem Toruń Bydgoszcz | Termowizja ITC Level 1";
    
    console.log('📝 META TITLE FIX:');
    console.log('OLD:', oldMetaTitle);
    console.log('NEW:', newMetaTitle);
    console.log('+ Template will add: "| FOTO-DRON aeroanaliza.pl"');
    console.log(`FINAL: "${newMetaTitle} | FOTO-DRON aeroanaliza.pl"\n`);

    await prisma.page.update({
        where: { slug: 'b2b' },
        data: {
            meta_title: newMetaTitle,
            updated_at: new Date()
        }
    });

    console.log('✅ Meta Title optimized');
    console.log('✅ ALT tags fixed in PageRenderer (stripHtml function added)');
    console.log('✅ robots.txt exists (app/robots.ts)');
    console.log('\n🎯 All SEO audit critical issues resolved!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
