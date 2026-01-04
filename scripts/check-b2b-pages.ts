
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkB2B() {
    try {
        const pages = await prisma.page.findMany({
            select: {
                id: true,
                slug: true,
                title: true,
                page_type: true,
                is_published: true
            }
        });

        console.log('--- ALL PAGES IN DB ---');
        console.table(pages);

        const b2bHome = pages.find(p => p.slug === 'b2b' || p.slug === 'home-b2b');
        if (!b2bHome) {
            console.error('❌ CRITICAL: B2B Homepage (slug: b2b) NOT FOUND!');
        } else {
            console.log('✅ B2B Homepage found:', b2bHome);
        }

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkB2B();
