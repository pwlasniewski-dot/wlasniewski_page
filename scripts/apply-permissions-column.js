/**
 * apply-permissions-column.js
 * Adds the `permissions` JSONB column to the `users` table in production Neon DB.
 * Zero Loss -- only adds a nullable column, no data is modified.
 * Run with: node scripts/apply-permissions-column.js
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.production' });

const prisma = new PrismaClient({
    datasources: {
        db: { url: process.env.DATABASE_URL }
    }
});

async function main() {
    console.log('Connecting to production DB...');
    console.log('DB URL host:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || '(check .env.production)');

    // Check if column already exists
    const existing = await prisma.$queryRaw`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'permissions';
    `;

    if (Array.isArray(existing) && existing.length > 0) {
        console.log('✅ Column `permissions` already exists on `users`. Nothing to do.');
        return;
    }

    // Add the column
    await prisma.$executeRaw`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB;
    `;
    console.log('✅ Added `permissions` JSONB column to `users` table.');
    console.log('--- DONE ---');
}

main()
    .catch(err => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
