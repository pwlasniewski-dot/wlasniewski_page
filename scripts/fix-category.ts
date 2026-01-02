
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCategory() {
    try {
        const session = await prisma.portfolioSession.update({
            where: { id: 1 },
            data: { category: 'family' }
        });
        console.log('✅ Updated Session 1 category to "family"');
    } catch (error) {
        console.error('Error updating session:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixCategory();
