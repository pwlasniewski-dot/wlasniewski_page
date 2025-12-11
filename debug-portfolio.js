const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    
    const sessions = await prisma.portfolioSession.findMany({
        select: { id: true, title: true, slug: true, category: true, is_published: true }
    });
    
    console.log('All Portfolio Sessions:');
    console.log(JSON.stringify(sessions, null, 2));
    
    await prisma.$disconnect();
}

main().catch(console.error);
