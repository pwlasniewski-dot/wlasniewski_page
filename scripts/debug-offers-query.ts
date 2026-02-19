import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('🔍 Testing prisma.offer.findMany query...');

        const offers = await prisma.offer.findMany({
            where: {},
            take: 50,
            skip: 0,
            orderBy: { created_at: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                sections: {
                    include: {
                        items: true,
                    },
                },
                negotiations: true,
                contract: true,
            },
        });

        console.log(`✅ Query successful. Found ${offers.length} offers.`);
        if (offers.length > 0) {
            console.log('First offer sample:', JSON.stringify(offers[0], null, 2));
        }

    } catch (error: any) {
        console.error('❌ Query failed!');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);
        if (error.meta) console.error('Error Meta:', error.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
