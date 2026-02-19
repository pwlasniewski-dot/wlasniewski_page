import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB SCHEMA INSPECTION ---');

    // Check tables directly via SQL
    const tables: any[] = await prisma.$queryRaw`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
    console.log('Tables in DB:', tables.map(t => t.table_name).join(', '));

    // Check columns in users table
    const userColumns: any[] = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users'
  `;
    console.log('Columns in users:', userColumns.map(c => c.column_name).join(', '));

    // Check columns in client_galleries table
    const hasClientGalleries = tables.some(t => t.table_name === 'client_galleries');
    if (hasClientGalleries) {
        const galleryColumns: any[] = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'client_galleries'
    `;
        console.log('Columns in client_galleries:', galleryColumns.map(c => c.column_name).join(', '));
    } else {
        console.log('Table client_galleries DOES NOT EXIST');
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
