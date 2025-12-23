import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPages() {
    try {
        const omnie = await prisma.page.findUnique({
            where: { slug: 'o-mnie' }
        });

        const jaksiubrac = await prisma.page.findUnique({
            where: { slug: 'jak-sie-ubrac' }
        });

        console.log('\n=== O MNIE PAGE ===');
        console.log('Title:', omnie?.title);
        console.log('Content length:', omnie?.content?.length || 0);
        console.log('Content preview:', omnie?.content?.substring(0, 200) || 'EMPTY');
        
        console.log('\n=== JAK SIĘ UBRAĆ PAGE ===');
        console.log('Title:', jaksiubrac?.title);
        console.log('Content length:', jaksiubrac?.content?.length || 0);
        console.log('Content preview:', jaksiubrac?.content?.substring(0, 200) || 'EMPTY');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPages();
