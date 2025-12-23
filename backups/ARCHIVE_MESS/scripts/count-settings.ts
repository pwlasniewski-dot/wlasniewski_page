
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.setting.count();
    console.log('Total Settings Records:', count);

    const all = await prisma.setting.findMany({ orderBy: { id: 'asc' } });
    all.forEach(s => {
        console.log(`ID: ${s.id}, Key: ${s.setting_key}, Logo: '${s.logo_url}'`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
