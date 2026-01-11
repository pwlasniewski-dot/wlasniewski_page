
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProvider() {
    const users = await prisma.user.findMany({
        where: {
            role: 'PHOTOGRAPHER'
        }
    });

    console.log('Provider Users found:', users);
}

checkProvider()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
