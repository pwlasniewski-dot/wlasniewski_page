
import { PrismaClient } from '@prisma/client';

async function main() {
    // We expect DATABASE_URL to be set in the environment or passed via dot-env
    const prisma = new PrismaClient();

    console.log('--- PRODUCTION STATE CHECK ---');
    try {
        const adminCount = await prisma.adminUser.count();
        console.log(`Admin User Count: ${adminCount}`);

        if (adminCount > 0) {
            const admins = await prisma.adminUser.findMany({
                select: { email: true, name: true, role: true }
            });
            console.log('Admins found:', JSON.stringify(admins, null, 2));
        } else {
            console.warn('⚠️ CRITICAL: No admin users found!');
        }

        const settingsCount = await prisma.setting.count();
        console.log(`Settings Count: ${settingsCount}`);

        const mainSettings = await prisma.setting.findUnique({
            where: { setting_key: 'main_settings' }
        });
        console.log('Main settings "main_settings" exists:', !!mainSettings);

    } catch (error) {
        console.error('Error checking prod state:', error);
    } finally {
        await prisma.$disconnect();
        console.log('--- CHECK END ---');
    }
}

main();
