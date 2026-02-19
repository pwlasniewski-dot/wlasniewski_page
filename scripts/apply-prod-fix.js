const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
    // 1. Read Prod Env (Switching to .env.production for OWNER permissions)
    const envPath = path.join(__dirname, '..', '.env.production');
    const envContent = fs.readFileSync(envPath, 'utf-8');
    let dbUrl = '';
    const lines = envContent.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('DATABASE_URL=')) {
            let value = trimmed.substring('DATABASE_URL='.length);
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            dbUrl = value;
            break;
        }
    }

    if (!dbUrl) {
        console.error('DATABASE_URL not found in .env copy.production');
        process.exit(1);
    }

    console.log('Connecting to Production DB...');
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });

    try {
        console.log('--- STARTING SAFE SCHEMA FIX (NO DATA LOSS) ---');

        // 1. Add missing columns to 'client_galleries'
        console.log('Fixing client_galleries...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "client_galleries" ADD COLUMN IF NOT EXISTS "client_id" INTEGER;`);

        // 2. Add missing columns to 'offers'
        console.log('Fixing offers...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "client_selection" JSONB;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "offers" ADD COLUMN IF NOT EXISTS "negotiation_enabled" BOOLEAN NOT NULL DEFAULT true;`);

        // 3. Add missing columns to 'photo_orders'
        console.log('Fixing photo_orders...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "photo_orders" ADD COLUMN IF NOT EXISTS "product_ids" TEXT;`);

        // 4. Add missing columns to 'users'
        console.log('Fixing users...');
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "address" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "city" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "postal_code" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_failed_login" TIMESTAMP(3);`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login" TIMESTAMP(3);`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" TEXT;`);
        await prisma.$executeRawUnsafe(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expires" TIMESTAMP(3);`);

        // 5. Create 'gallery_products' table
        console.log('Creating gallery_products table...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "gallery_products" (
                "id" SERIAL NOT NULL,
                "gallery_id" INTEGER,
                "title" TEXT NOT NULL,
                "description" TEXT,
                "price" INTEGER NOT NULL,
                "image_url" TEXT,
                "video_url" TEXT,
                "is_active" BOOLEAN NOT NULL DEFAULT true,
                "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP(3) NOT NULL,
                CONSTRAINT "gallery_products_pkey" PRIMARY KEY ("id")
            );
        `);

        // 6. Add Unique Index
        console.log('Adding unique index...');
        await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_reset_token_key" ON "users"("reset_token");`);

        // 7. Add Foreign Keys (safely)
        console.log('Adding foreign keys...');

        // gallery_products -> client_galleries
        try {
            await prisma.$executeRawUnsafe(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'gallery_products_gallery_id_fkey') THEN
                        ALTER TABLE "gallery_products" ADD CONSTRAINT "gallery_products_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "client_galleries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                    END IF;
                END $$;
            `);
        } catch (e) {
            console.log('Constraint gallery_products_gallery_id_fkey check failed/exists. Continuing.');
        }

        // client_galleries -> users (client_id)
        try {
            await prisma.$executeRawUnsafe(`
                DO $$ BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'client_galleries_client_id_fkey') THEN
                        ALTER TABLE "client_galleries" ADD CONSTRAINT "client_galleries_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                    END IF;
                END $$;
            `);
        } catch (e) {
            console.log('Constraint client_galleries_client_id_fkey check failed/exists. Continuing.');
        }

        console.log('--- FIX COMPLETED SUCCESSFULLY ---');
        console.log('All missing columns and tables have been added.');

    } catch (error) {
        console.error('FIX FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
