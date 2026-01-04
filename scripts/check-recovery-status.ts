
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    try {
        const adminCount = await prisma.adminUser.count();
        const userCount = await prisma.user.count();
        const settingsCount = await prisma.setting.count();
        const portfolioCount = await prisma.portfolioSession.count();
        const blogCount = await prisma.blogPost.count();
        const mediaCount = await prisma.mediaLibrary.count();

        console.log('--- RECOVERY STATUS REPORT ---');
        console.log(`✅ Admin Users: ${adminCount}`);
        console.log(`✅ Client Users: ${userCount}`);
        console.log(`✅ Settings: ${settingsCount}`);
        console.log(`✅ Portfolio Sessions: ${portfolioCount}`);
        console.log(`✅ Blog Posts: ${blogCount}`);
        console.log(`✅ Media Files: ${mediaCount}`);
        console.log('------------------------------');

        if (userCount === 0) {
            console.warn('⚠️  WARNING: No client users found. Clients need to re-register.');
        }
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
