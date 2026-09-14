import { PrismaClient } from '@prisma/client';
import { shopDatabaseUrl } from '@/lib/shop-qa';

const prismaClientSingleton = () => {
    const databaseUrl = shopDatabaseUrl();

    return new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
        ...(databaseUrl
            ? {
                datasources: {
                    db: { url: databaseUrl },
                },
            }
            : {}),
    });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown
if (typeof window === 'undefined') {
    process.on('beforeExit', async () => {
        await prisma.$disconnect();
    });
}
