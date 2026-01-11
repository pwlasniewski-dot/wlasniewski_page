
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log('--- Debugging Production Connection ---');

    // Explicitly load .env.production
    const envPath = path.join(process.cwd(), '.env.production');
    if (fs.existsSync(envPath)) {
        console.log('Loading .env.production...');
        const result = dotenv.config({ path: envPath, override: true });
        if (result.error) {
            throw result.error;
        }
    } else {
        console.error('.env.production file not found!');
        process.exit(1);
    }

    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 25) + '...');

    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        }
    });

    try {
        console.log('Attempting to connect...');
        await prisma.$connect();
        console.log('Connected successfully.');

        console.log('Checking "Page" table...');
        const pageCount = await prisma.page.count();
        console.log(`Found ${pageCount} pages.`);

        console.log('Checking "Setting" table...');
        const settingsCount = await prisma.setting.count();
        console.log(`Found ${settingsCount} settings.`);

        console.log('Checking "HistoryPhoto" table (new feature)...');
        try {
            const historyCount = await prisma.historyPhoto.count();
            console.log(`Found ${historyCount} history photos.`);
        } catch (e) {
            console.log('Could not check HistoryPhoto (might be missing in DB):', e.code);
        }

    } catch (e) {
        console.error('Connection/Query Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
