const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔌 Connecting to Production Database...');

    try {
        // 1. Create history_photos table
        console.log('🛠️  Ensure table "history_photos" exists...');
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "history_photos" (
                "id" TEXT NOT NULL,
                "url" TEXT NOT NULL,
                "filename" TEXT NOT NULL,
                "width" INTEGER,
                "height" INTEGER,
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "history_photos_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log('✅ Table "history_photos" ready.');

        // 2. Add theme_mode to settings
        console.log('🛠️  Ensure column "theme_mode" exists in "settings"...');
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "theme_mode" TEXT DEFAULT 'dark';
            `);
            console.log('✅ Column "theme_mode" ready.');
        } catch (e) {
            // IF NOT EXISTS is standard Postgres, but if it fails we might need to catch 'duplicate column' error manually
            if (e.message.includes('already exists')) {
                console.log('ℹ️  Column "theme_mode" already exists.');
            } else {
                throw e;
            }
        }

        console.log('\n🎉  SUCCESS! Database patched successfully.');
    } catch (e) {
        console.error('\n❌ ERROR:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
