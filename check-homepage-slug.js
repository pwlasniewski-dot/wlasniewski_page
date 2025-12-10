const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHomepage() {
    console.log('=== CHECKING HOMEPAGE IN NEON ===\n');

    try {
        // Check all pages with their slugs
        console.log('📄 ALL PAGES:');
        const allPages = await prisma.page.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
                is_published: true,
                is_in_menu: true,
                menu_title: true,
                menu_order: true,
                page_type: true
            },
            orderBy: { id: 'asc' }
        });

        console.table(allPages);

        // Check specifically for homepage
        console.log('\n🏠 HOMEPAGE by slug "strona-glowna":');
        const homepageBySlug = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });

        if (homepageBySlug) {
            console.log('✅ Found homepage with slug "strona-glowna"');
            console.log('ID:', homepageBySlug.id);
            console.log('Title:', homepageBySlug.title);
            console.log('Is Published:', homepageBySlug.is_published);
        } else {
            console.log('❌ NO HOMEPAGE with slug "strona-glowna" found!');
        }

        // Check for empty slug
        console.log('\n🔍 PAGES WITH EMPTY SLUG:');
        const emptySlugPages = await prisma.page.findMany({
            where: { slug: '' }
        });

        if (emptySlugPages.length > 0) {
            console.log(`❌ Found ${emptySlugPages.length} page(s) with empty slug:`);
            console.table(emptySlugPages.map(p => ({
                id: p.id,
                title: p.title,
                slug: `"${p.slug}"`,
                is_published: p.is_published
            })));
        } else {
            console.log('✅ No pages with empty slug');
        }

        // Check for homepage by page_type
        console.log('\n🏠 HOMEPAGE by page_type="home":');
        const homepageByType = await prisma.page.findMany({
            where: { page_type: 'home' }
        });

        if (homepageByType.length > 0) {
            console.log(`Found ${homepageByType.length} page(s) with page_type="home":`);
            console.table(homepageByType.map(p => ({
                id: p.id,
                slug: p.slug,
                title: p.title
            })));
        } else {
            console.log('No pages with page_type="home"');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHomepage();
