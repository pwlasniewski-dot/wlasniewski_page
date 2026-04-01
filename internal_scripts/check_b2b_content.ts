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

    console.log('=== PAGE CONTENT ===');
    console.log('Title:', page.title);
    console.log('Meta Title:', page.meta_title);
    console.log('Meta Description:', page.meta_description);
    console.log('\n=== CONTENT FIELD ===');
    console.log(page.content?.substring(0, 500));
    
    const sections = JSON.parse(page.sections as string);
    console.log('\n=== SECTIONS ===');
    sections.forEach((s: any, i: number) => {
        console.log(`\n[${i}] ${s.type} - ${s.id}`);
        if (s.title) console.log('Title:', s.title.substring(0, 100));
        if (s.content) console.log('Content preview:', s.content.substring(0, 200));
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
