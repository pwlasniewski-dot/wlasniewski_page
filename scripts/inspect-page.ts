import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const slug = process.argv[2] || 'o-mnie';
    const page = await prisma.page.findUnique({
        where: { slug }
    });
    if (page) {
        console.log(`Page: ${page.title} (${page.slug})`);
        console.log(`Sections Type: ${typeof page.sections}`);
        console.log(`Sections Content: ${page.sections}`);
        if (page.sections) {
            try {
                const parsed = JSON.parse(page.sections);
                console.log('Parsed Sections Count:', parsed.length);
                parsed.forEach((s: any, i: number) => {
                    console.log(`Section ${i}: type=${s.type} id=${s.id}`);
                });
            } catch (e) {
                console.log('JSON Parse Error:', e);
            }
        }
    } else {
        console.log('Page not found');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
