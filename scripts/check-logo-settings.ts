
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.setting.findFirst();
    console.log('Current Settings:');
    console.log('logo_url:', settings?.logo_url);
    console.log('logo_dark_url:', settings?.logo_dark_url);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
