import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();
    console.log('--- DB DIAGNOSTIC START ---');
    console.log('Checking connection to:', process.env.DATABASE_URL?.split('@')[1] || 'URL NOT FOUND');

    const start = Date.now();
    try {
        // Attempt a simple query
        const result = await prisma.$queryRaw`SELECT 1 as connected`;
        const end = Date.now();
        console.log('✅ SUCCESS: Database is reachable.');
        console.log('Result:', result);
        console.log('Latency:', end - start, 'ms');
    } catch (error: any) {
        const end = Date.now();
        console.error('❌ FAILURE: Database connection failed.');
        console.error('Time elapsed:', end - start, 'ms');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

        if (error.message.includes('Can\'t reach database server')) {
            console.log('\n--- ANALYSIS ---');
            console.log('This usually means:');
            console.log('1. Neon.tech project is "asleep" (waiting for first connection).');
            console.log('2. Network restriction/Firewall blocking Port 5432.');
            console.log('3. Incorrect connection string (check port 6543 vs 5432).');
        }
    } finally {
        await prisma.$disconnect();
        console.log('--- DB DIAGNOSTIC END ---');
    }
}

main();
