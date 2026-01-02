
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCategories() {
    try {
        console.log('\n--- PortfolioSession Categories ---');
        const sessions = await prisma.portfolioSession.findMany({
            select: { category: true, title: true, id: true }
        });

        // Group and count
        const counts: Record<string, number> = {};
        sessions.forEach(s => {
            counts[s.category] = (counts[s.category] || 0) + 1;
            if (s.category.includes(' ')) {
                console.log(`⚠️  FOUND BAD CATEGORY! ID: ${s.id}, Title: "${s.title}", Category: "${s.category}"`);
            }
        });

        console.log('Category Counts:', counts);

    } catch (error) {
        console.error('Error fetching categories:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCategories();
