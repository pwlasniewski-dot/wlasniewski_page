import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- USER SEARCH ---');
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: 'pwlasniewski' } },
                { email: { contains: 'iclou' } }
            ]
        }
    });

    console.log('Users found:', JSON.stringify(users, null, 2));

    const totalUsers = await prisma.user.count();
    console.log('Total users in DB:', totalUsers);

    const clientCount = await prisma.user.count({
        where: { role: 'CLIENT' }
    });
    console.log('Total users with role CLIENT:', clientCount);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
