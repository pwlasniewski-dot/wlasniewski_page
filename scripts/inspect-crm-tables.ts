import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DETAILED TABLE INSPECTION ---');

    const tables = ['users', 'client_galleries', 'offers', 'contracts', 'orders'];

    for (const table of tables) {
        console.log(`\nInspecting table: ${table}`);
        try {
            const columns: any[] = await prisma.$queryRawUnsafe(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
            if (columns.length === 0) {
                console.log(`Table ${table} DOES NOT EXIST`);
            } else {
                console.log(`Columns in ${table}:`, columns.map(c => c.column_name).join(', '));
            }
        } catch (e: any) {
            console.log(`Error inspecting ${table}:`, e.message);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
