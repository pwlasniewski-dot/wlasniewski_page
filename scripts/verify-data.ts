
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('--- DATA VERIFICATION ---');
    try {
        const pages = await prisma.page.count();
        const b2bPages = await prisma.page.count({ where: { page_type: 'b2b' } });
        const admins = await prisma.adminUser.count();
        const settings = await prisma.setting.count();

        console.log(`Pages: ${pages}`);
        console.log(`B2B Pages: ${b2bPages}`);
        console.log(`Admins: ${admins}`);
        console.log(`Settings: ${settings}`);

        if (pages > 0 && admins > 0) {
            console.log('✅ VERIFIED: Critical data is still present in the database.');
        } else {
            console.log('⚠️ WARNING: Some tables appear empty!');
        }
    } catch (e: any) {
        console.error('❌ Error during verification:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
