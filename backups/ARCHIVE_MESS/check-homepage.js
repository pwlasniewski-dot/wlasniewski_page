const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Check homepage record
    const homepage = await prisma.page.findUnique({
        where: { slug: 'strona-glowna' }
    });

    if (homepage) {
        console.log('✅ Found homepage with slug="strona-glowna":');
        console.log('ID:', homepage.id);
        console.log('Slug:', homepage.slug);
        console.log('Home sections:', homepage.home_sections ? 'EXISTS' : 'MISSING');
    } else {
        console.log('❌ No homepage with slug="strona-glowna"');
    }

    // Check if there's a page with empty slug
    const emptySlug = await prisma.page.findUnique({
        where: { slug: '' }
    });

    if (emptySlug) {
        console.log('\n⚠️  Found page with empty slug (slug=""):');
        console.log('ID:', emptySlug.id);
        console.log('Title:', emptySlug.title);
        console.log('Home sections:', emptySlug.home_sections ? 'EXISTS' : 'MISSING');
    }

    // List all pages
    console.log('\n📋 All pages:');
    const pages = await prisma.page.findMany({
        select: { id: true, slug: true, title: true, is_in_menu: true }
    });
    pages.forEach(p => {
        console.log(`  ID ${p.id}: slug="${p.slug}" title="${p.title}" menu=${p.is_in_menu}`);
    });
}

main()
    .catch(e => {
        console.error('Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
