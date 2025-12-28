
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DB DIAGNOSTIC ---');
    try {
        console.log('Testing connection...');
        const pageCount = await prisma.page.count();
        console.log('Pages count:', pageCount);

        const setting = await prisma.setting.findFirst();
        console.log('Setting found:', !!setting);

        const mediaCount = await prisma.mediaLibrary.count();
        console.log('Media items count:', mediaCount);

        console.log('DB SUCCESS');
    } catch (error) {
        console.error('DB ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
