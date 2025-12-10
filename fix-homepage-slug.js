const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixHomepageSlug() {
    console.log('🔧 FIXING HOMEPAGE SLUG\n');

    try {
        // Find the page with empty slug that should be homepage
        const emptySlugPage = await prisma.page.findFirst({
            where: { slug: '' }
        });

        if (!emptySlugPage) {
            console.log('❌ No page with empty slug found');
            return;
        }

        console.log('Found page with empty slug:');
        console.log('ID:', emptySlugPage.id);
        console.log('Title:', emptySlugPage.title);

        // Check if there's already a page with slug 'strona-glowna'
        const existingHomepage = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' }
        });

        if (existingHomepage) {
            console.log('\n⚠️ There is already a page with slug "strona-glowna" (ID:', existingHomepage.id, ')');
            console.log('We need to decide what to do...');

            // If the existing one has no home_sections, delete it
            if (!existingHomepage.home_sections || existingHomepage.home_sections.length < 10) {
                console.log('Deleting the old homepage (no content) - ID:', existingHomepage.id);
                await prisma.page.delete({
                    where: { id: existingHomepage.id }
                });
                console.log('✅ Deleted old homepage');
            }
        }

        // Now update the empty slug page
        console.log('\nUpdating page ID', emptySlugPage.id, 'to have slug "strona-glowna"');
        await prisma.page.update({
            where: { id: emptySlugPage.id },
            data: {
                slug: 'strona-glowna',
                page_type: 'home'
            }
        });

        console.log('✅ Updated page to have slug "strona-glowna"');

        // Verify
        console.log('\n📊 VERIFICATION:');
        const homepage = await prisma.page.findUnique({
            where: { slug: 'strona-glowna' },
            select: {
                id: true,
                slug: true,
                title: true,
                page_type: true,
                is_published: true,
                home_sections: true
            }
        });

        if (homepage) {
            console.log('✅ Homepage now exists with slug "strona-glowna"');
            console.log('ID:', homepage.id);
            console.log('Title:', homepage.title);
            console.log('Page Type:', homepage.page_type);
            console.log('Is Published:', homepage.is_published);
            console.log('Has home_sections:', homepage.home_sections ? 'Yes (' + homepage.home_sections.length + ' chars)' : 'No');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixHomepageSlug();
