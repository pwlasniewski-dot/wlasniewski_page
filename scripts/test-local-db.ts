
import { PrismaClient } from '@prisma/client';

async function main() {
    const url = process.env.LOCAL_DATABASE_URL || "";
    if (!url) throw new Error('LOCAL_DATABASE_URL is required');
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: url
            }
        }
    });

    console.log('--- LOCAL DB CONNECTION TEST ---');
    console.log('Testing connection to:', url);

    try {
        await prisma.$connect();
        const result = await prisma.$queryRaw`SELECT 1 as connected`;
        console.log('✅ SUCCESS: Local database test_neon is reachable.');
        console.log('Result:', result);
    } catch (error: any) {
        console.error('❌ FAILURE: Could not connect to local database.');
        console.error('Error:', error.message);
        console.log('\nPossible reasons:');
        console.log('1. PostgreSQL server is not running.');
        console.log('2. Database "test_neon" does not exist.');
        console.log('3. Password or username is incorrect.');
    } finally {
        await prisma.$disconnect();
        console.log('--- TEST END ---');
    }
}

main();
