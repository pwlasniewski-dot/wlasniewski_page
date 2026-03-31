import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPages() {
  try {
    const pages = await prisma.page.findMany({
      where: {
        slug: {
          in: ['termowizja', 'monitoring']
        }
      },
      select: {
        id: true,
        slug: true,
        title: true,
        meta_title: true,
        meta_description: true,
        content: true,
        sections: true
      }
    });

    for (const page of pages) {
      console.log('\n' + '='.repeat(80));
      console.log(`SLUG: ${page.slug}`);
      console.log(`TITLE: ${page.title}`);
      console.log(`META TITLE: ${page.meta_title}`);
      console.log(`META DESC: ${page.meta_description}`);
      console.log('='.repeat(80));

      if (page.sections) {
        const parsed = typeof page.sections === 'string' 
          ? JSON.parse(page.sections) 
          : page.sections;

        console.log(`\nSECTIONS (${parsed.length} total):\n`);
        
        parsed.forEach((section: any, idx: number) => {
          console.log(`\n--- Section ${idx + 1}: ${section.type} ---`);
          console.log(`ID: ${section.id}`);
          
          if (section.title) console.log(`Title: ${section.title}`);
          if (section.subtitle) console.log(`Subtitle: ${section.subtitle}`);
          if (section.text) console.log(`Text: ${section.text.substring(0, 200)}...`);
          
          // Show structure
          console.log(`Keys: ${Object.keys(section).join(', ')}`);
          
          // Show full data for smaller sections
          if (JSON.stringify(section).length < 1000) {
            console.log('Full data:');
            console.log(JSON.stringify(section, null, 2));
          }
        });
      }

      if (page.content && page.content.trim()) {
        console.log('\n--- CONTENT FIELD ---');
        console.log(page.content.substring(0, 500));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPages();
