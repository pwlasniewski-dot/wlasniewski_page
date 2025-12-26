import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pages = await prisma.page.findMany();
    console.log('--- PAGES DEBUG ---');
    pages.forEach(p => {
        let sectionsSummary = 'None';
        if (p.sections) {
            try {
                const parsed = JSON.parse(p.sections);
                sectionsSummary = `${parsed.length} sections [${parsed.map((s: any) => s.type).join(', ')}]`;
            } catch (e) {
                sectionsSummary = 'ERROR PARSING';
            }
        }
        console.log(`Slug: ${p.slug.padEnd(20)} | Published: ${p.is_published ? 'YES' : 'NO '} | Sections: ${sectionsSummary}`);
    });
}

main()
    .catch((e) => {
        console.log(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
