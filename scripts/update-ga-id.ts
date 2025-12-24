
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Updating Google Analytics ID...');

    const GA_ID = 'G-52Z9LGE396';
    const SETTINGS_KEY = 'main_settings';

    try {
        const updated = await prisma.setting.update({
            where: { setting_key: SETTINGS_KEY },
            data: { google_analytics_id: GA_ID }
        });

        console.log(`✅ Success! Google Analytics ID updated to: ${updated.google_analytics_id}`);
    } catch (error: any) {
        console.error('❌ Error updating settings:', error.message);

        // If the record doesn't exist, try to create it or find by first record
        try {
            const firstSetting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
            if (firstSetting) {
                const updatedFirst = await prisma.setting.update({
                    where: { id: firstSetting.id },
                    data: { google_analytics_id: GA_ID }
                });
                console.log(`✅ Success (via first record)! ID updated to: ${updatedFirst.google_analytics_id}`);
            } else {
                console.log('⚠️ No settings record found to update.');
            }
        } catch (innerError: any) {
            console.error('❌ Failed fallback update:', innerError.message);
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
