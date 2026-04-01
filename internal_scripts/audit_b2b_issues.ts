import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const page = await prisma.page.findUnique({
        where: { slug: 'b2b' }
    });

    if (!page) {
        console.log('Page not found');
        return;
    }

    console.log('=== CURRENT META DATA ===');
    console.log('Title:', page.title);
    console.log('Meta Title:', page.meta_title);
    console.log('Meta Description:', page.meta_description);
    
    const sections = JSON.parse(page.sections as string);
    
    console.log('\n=== SECTIONS WITH HTML IN TITLES/ALT ===');
    sections.forEach((s: any, i: number) => {
        if (s.title?.includes('<span')) {
            console.log(`[${i}] ${s.type}: ${s.title}`);
        }
        if (s.subtitle?.includes('<span')) {
            console.log(`[${i}] ${s.type} subtitle: ${s.subtitle}`);
        }
        if (s.content?.includes('<span')) {
            console.log(`[${i}] ${s.type} has HTML spans in content`);
        }
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
