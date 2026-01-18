const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
    console.log('🔍 DATABASE CHECK');
    console.log('================');

    try {
        // Check connection
        await prisma.$connect();
        console.log('✅ Connected to database');
        console.log('📍 Database URL:', process.env.DATABASE_URL?.substring(0, 50) + '...');

        // Check admin users
        const admins = await prisma.adminUser.findMany({
            select: {
                id: true,
                email: true,
                name: true,
            }
        });

        console.log('\n👤 ADMIN USERS IN DATABASE:');
        console.log('Count:', admins.length);
        admins.forEach(admin => {
            console.log(`  - ${admin.email} (ID: ${admin.id}, Name: ${admin.name || 'N/A'})`);
        });

        // Check regular users
        const users = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            }
        });

        console.log('\n👥 REGULAR USERS WITH ADMIN ROLE:');
        console.log('Count:', users.length);
        users.forEach(user => {
            console.log(`  - ${user.email} (ID: ${user.id}, Role: ${user.role})`);
        });

    } catch (error) {
        console.error('❌ Database error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDb();
