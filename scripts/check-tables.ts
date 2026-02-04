
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- CHECKING DATABASE TABLES ---');
    console.log('URL:', process.env.DATABASE_URL?.split('@')[1] || 'HIDDEN');

    try {
        const result: any[] = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;

        console.log('Tables found:', result.length);
        result.forEach(row => console.log(`- ${row.table_name}`));

        const offersTable = result.find(r => r.table_name === 'offers');
        if (offersTable) {
            console.log('✅ "offers" table EXISTS');
        } else {
            console.log('❌ "offers" table MISSING');
        }

    } catch (e: any) {
        console.error('Error querying tables:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
