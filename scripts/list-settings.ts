
import { PrismaClient } from '@prisma/client';

async function main() {
    const prisma = new PrismaClient();

    console.log('--- SETTINGS KEYS CHECK ---');
    try {
        const settings = await prisma.setting.findMany({
            select: { setting_key: true }
        });
        console.log('Setting keys:', settings.map(s => s.setting_key));

    } catch (error) {
        console.error('Error listing settings:', error);
    } finally {
        await prisma.$disconnect();
        console.log('--- CHECK END ---');
    }
}

main();
