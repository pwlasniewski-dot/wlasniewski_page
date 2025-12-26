import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const page = await prisma.page.findUnique({
        where: { slug: 'o-mnie' }
    });
    if (page && page.sections) {
        console.log(JSON.stringify(JSON.parse(page.sections), null, 2));
    } else {
        console.log('No sections found');
    }
}

main().finally(() => prisma.$disconnect());
