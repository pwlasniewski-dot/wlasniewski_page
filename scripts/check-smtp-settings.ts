import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- SMTP SETTINGS CHECK ---');
    const settings = await prisma.setting.findFirst({
        orderBy: { id: 'asc' }
    });

    if (!settings) {
        console.log('No settings found in database.');
    } else {
        // Mask password
        const safeSettings = { ...settings };
        if (safeSettings.smtp_password) safeSettings.smtp_password = '****';
        console.log(JSON.stringify(safeSettings, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
