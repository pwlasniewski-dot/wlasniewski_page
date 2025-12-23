
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking Current Logo State ---');
    const setting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    console.log('Current ID:', setting?.id);
    console.log('Current logo_url:', setting?.logo_url);
    console.log('Current logo_dark_url:', setting?.logo_dark_url);

    const testLogoUrl = 'https://example.com/test-logo.png';
    console.log(`\n--- Forcing Update to '${testLogoUrl}' ---`);

    // Simulate what the API does
    await prisma.setting.update({
        where: { id: setting!.id },
        data: {
            logo_url: testLogoUrl,
            logo_dark_url: testLogoUrl
        }
    });

    const updatedSetting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    console.log('Updated logo_url:', updatedSetting?.logo_url);

    if (updatedSetting?.logo_url === testLogoUrl) {
        console.log('✅ DB Update Successful. The schema and DB are fine.');
    } else {
        console.log('❌ DB Update Failed.');
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
