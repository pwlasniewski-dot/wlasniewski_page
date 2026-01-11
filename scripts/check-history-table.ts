import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to database...');
        const count = await prisma.historyPhoto.count();
        console.log(`✅ Table HistoryPhoto exists. Count: ${count}`);

        // Also check Settings for theme_mode
        const settings = await prisma.setting.findFirst();
        console.log('✅ Settings table accessible.');
        if (settings) {
            console.log('theme_mode value:', (settings as any).theme_mode); // Check if field exists in returned object
        }

    } catch (e: any) {
        console.error('❌ Error accessing HistoryPhoto table:', e.message);
        if (e.code) console.error('Error Code:', e.code);
    } finally {
        await prisma.$disconnect();
    }
}

main();
