
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const settings = await prisma.setting.findMany({ orderBy: { id: 'asc' } });
    console.log('Total settings records:', settings.length);
    settings.forEach(s => {
        console.log(`ID: ${s.id}, Key: ${s.setting_key}, GA_ID: ${s.google_analytics_id}`);
    });
}
main().finally(() => prisma.$disconnect());
