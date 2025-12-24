
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const setting = await prisma.setting.findFirst({ orderBy: { id: 'asc' } });
    console.log('Current GA ID in DB:', setting?.google_analytics_id);
}
main().finally(() => prisma.$disconnect());
