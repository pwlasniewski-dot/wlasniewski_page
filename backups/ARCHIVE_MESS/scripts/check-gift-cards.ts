
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGiftCards() {
    try {
        const cards = await prisma.giftCard.findMany({
            where: {
                is_template: true,
                status: 'active'
            }
        });
        console.log('Active Templates:', JSON.stringify(cards, null, 2));
    } catch (error) {
        console.error('Error checking cards:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkGiftCards();
