
import { PrismaClient } from '@prisma/client';

const originalUrl = process.env.DATABASE_URL || '';

// Switch to 'postgres' database for maintenance tasks
const maintenanceUrl = originalUrl.replace('/neondb', '/postgres');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: maintenanceUrl,
        },
    },
});

async function main() {
    console.log('Connecting to maintenance database...');
    try {
        // 1. Check connection and list DBs
        console.log('Listing databases...');
        const dbs = await prisma.$queryRawUnsafe(`SELECT datname FROM pg_database;`);
        console.log('Databases found:', dbs);

        // 2. Check if target exists
        const exists = await prisma.$queryRawUnsafe(`SELECT 1 FROM pg_database WHERE datname = 'PWL_prisma'`);
        if (Array.isArray(exists) && exists.length > 0) {
            console.log('Database "PWL_prisma" already exists.');
        } else {
            console.log('Cloning database "neondb" to "PWL_prisma"...');

            // Try to kill connections to source DB "neondb"
            // This is required because CREATE DATABASE WITH TEMPLATE fails if source has active connections
            try {
                await prisma.$executeRawUnsafe(`
                    SELECT pg_terminate_backend(pid) 
                    FROM pg_stat_activity 
                    WHERE datname = 'neondb' 
                    AND pid <> pg_backend_pid();
                `);
                console.log('Terminated existing connections to neondb.');
            } catch (e: any) {
                console.log('Could not terminate connections (might need superuser), proceeding anyway... Error:', e.message);
            }

            // Create clone
            await prisma.$executeRawUnsafe(`CREATE DATABASE "PWL_prisma" WITH TEMPLATE "neondb";`);
            console.log('Database cloned successfully!');
        }
    } catch (e: any) {
        console.error('FINAL ERROR:', e.message || e);
        if (e.meta) console.error('Meta:', e.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
