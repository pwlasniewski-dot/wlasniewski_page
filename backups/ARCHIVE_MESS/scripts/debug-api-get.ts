
import fetch from 'next/dist/compiled/node-fetch'; // Try next/node-fetch or just native
// actually native fetch is available in node 18
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Debugging API GET ---');

    // We can just query DB directly first to see what SHOULD be there
    const setting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    console.log('DB logo_url:', setting?.logo_url);

    // Call API (simulated via DB read logic from route.ts)
    // 1. Start with Key/Value pairs
    const settings = await prisma.setting.findMany({
        orderBy: { id: 'asc' },
        take: 1
    });

    const settingsMap: any = {};
    if (settings.length > 0) {
        const mainSettings = settings[0];
        const excludedKeys = ['id', 'setting_key', 'setting_value', 'updated_at'];

        Object.keys(mainSettings).forEach(key => {
            if (!excludedKeys.includes(key)) {
                // @ts-ignore
                const val = mainSettings[key];
                settingsMap[key] = val;
            }
        });
    }

    console.log('Simulated API Response logo_url:', settingsMap.logo_url);

}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
