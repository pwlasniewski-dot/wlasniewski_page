
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const settings = await prisma.setting.findMany();
    console.log('--- ALL SETTINGS ---');
    settings.forEach(s => {
        console.log(`ID: ${s.id}, Key: ${s.setting_key}, GA: ${s.google_analytics_id}`);
    });
}
main().finally(() => prisma.$disconnect());
