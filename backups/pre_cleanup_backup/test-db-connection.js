// Quick test script to verify MySQL database connection
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
    console.log('🔍 Testing MySQL database connection...\n');

    try {
        // Test 1: Basic connection
        console.log('Test 1: Connecting to database...');
        await prisma.$connect();
        console.log('✅ Connection successful!\n');

        // Test 2: Query database version
        console.log('Test 2: Querying database info...');
        const result = await prisma.$queryRaw`SELECT VERSION() as version`;
        console.log('✅ Database version:', result[0].version, '\n');

        // Test 3: Check if tables exist
        console.log('Test 3: Checking for existing tables...');
        const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `;
        console.log(`✅ Found ${tables.length} tables in database\n`);
        if (tables.length > 0) {
            console.log('Tables:', tables.map(t => t.TABLE_NAME).join(', '), '\n');
        }

        // Test 4: Try a simple query on portfolio sessions (if table exists)
        try {
            console.log('Test 4: Testing portfolio sessions query...');
            const sessions = await prisma.portfolioSession.findMany({ take: 1 });
            console.log(`✅ Portfolio sessions query successful! Found ${sessions.length} session(s)\n`);
        } catch (error) {
            console.log('⚠️  Portfolio sessions table may not exist yet (expected if fresh DB)\n');
        }

        console.log('='.repeat(50));
        console.log('✅ ALL TESTS PASSED! Database connection is working!');
        console.log('='.repeat(50));

    } catch (error) {
        console.error('\n❌ DATABASE CONNECTION FAILED!\n');
        console.error('Error:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
