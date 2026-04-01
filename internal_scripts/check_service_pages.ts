import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const termo = await prisma.page.findUnique({
        where: { slug: 'termowizja' }
    });

    const monitoring = await prisma.page.findUnique({
        where: { slug: 'monitoring' }
    });

    console.log('=== TERMOWIZJA ===');
    console.log('Title:', termo?.title);
    console.log('Meta Title:', termo?.meta_title);
    if (termo?.sections) {
        const sections = JSON.parse(termo.sections as string);
        console.log('Sections:', sections.length);
        sections.forEach((s: any, i: number) => {
            console.log(`  [${i}] ${s.type}`);
        });
    }

    console.log('\n=== MONITORING ===');
    console.log('Title:', monitoring?.title);
    console.log('Meta Title:', monitoring?.meta_title);
    if (monitoring?.sections) {
        const sections = JSON.parse(monitoring.sections as string);
        console.log('Sections:', sections.length);
        sections.forEach((s: any, i: number) => {
            console.log(`  [${i}] ${s.type}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
