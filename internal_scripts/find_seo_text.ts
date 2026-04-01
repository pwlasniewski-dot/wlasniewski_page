import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Szukam tego tekstu w całej bazie
    const searchText = "Kompleksowa analiza SEO";
    
    const pages = await prisma.page.findMany();
    
    for (const page of pages) {
        let found = false;
        const issues = [];
        
        if (page.content?.includes(searchText)) {
            issues.push('content');
            found = true;
        }
        
        if (page.meta_description?.includes(searchText)) {
            issues.push('meta_description');
            found = true;
        }
        
        if (page.meta_title?.includes(searchText)) {
            issues.push('meta_title');
            found = true;
        }
        
        if (page.sections) {
            const sections = JSON.parse(page.sections as string);
            sections.forEach((s: any, i: number) => {
                if (s.content?.includes(searchText) || s.title?.includes(searchText) || s.subtitle?.includes(searchText)) {
                    issues.push(`section[${i}] type=${s.type}`);
                    found = true;
                }
            });
        }
        
        if (found) {
            console.log(`\n🚨 FOUND IN PAGE: ${page.slug}`);
            console.log(`Fields: ${issues.join(', ')}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
