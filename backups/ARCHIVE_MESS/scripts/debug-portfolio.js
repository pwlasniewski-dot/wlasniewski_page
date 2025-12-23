const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DEBUG PORTFOLIO COVERS ---');
    try {
        const sessions = await prisma.portfolioSession.findMany({
            where: { is_category_hero: true },
            select: {
                id: true,
                title: true,
                category: true,
                session_date: true
            },
            orderBy: { session_date: 'desc' }
        });

        console.log(`Total sessions marked as Category Hero: ${sessions.length}`);

        const byCategory = {};
        sessions.forEach(s => {
            if (!byCategory[s.category]) byCategory[s.category] = [];
            byCategory[s.category].push(s.title);
        });

        console.log('\nHero Sessions by Category:');
        Object.entries(byCategory).forEach(([cat, titles]) => {
            console.log(`[${cat}]: ${titles.length} sessions`);
            titles.forEach(t => console.log(`  - ${t}`));
        });

        const allCategories = await prisma.portfolioSession.groupBy({
            by: ['category'],
            _count: true
        });

        console.log('\nTotal Categories in DB (with session counts):');
        allCategories.forEach(c => {
            console.log(`[${c.category}]: ${c._count} total sessions`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
