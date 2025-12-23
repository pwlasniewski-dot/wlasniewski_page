
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.portfolioSession.count();
    console.log('PortfolioSession count:', count);
    const sessions = await prisma.portfolioSession.findMany();
    console.log('Sessions:', JSON.stringify(sessions, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
