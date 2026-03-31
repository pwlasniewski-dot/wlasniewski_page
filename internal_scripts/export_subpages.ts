import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function exportPages() {
  try {
    const pages = await prisma.page.findMany({
      where: {
        slug: {
          in: ['termowizja', 'monitoring']
        }
      }
    });

    for (const page of pages) {
      const fileName = `EXISTING_${page.slug.toUpperCase()}.json`;
      fs.writeFileSync(fileName, JSON.stringify(page, null, 2));
      console.log(`✓ Exported ${fileName}`);
      
      if (page.sections) {
        const sections = typeof page.sections === 'string' 
          ? JSON.parse(page.sections) 
          : page.sections;
        
        console.log(`\n=== ${page.slug.toUpperCase()} SECTIONS ===`);
        sections.forEach((s: any, i: number) => {
          console.log(`\n${i+1}. TYPE: ${s.type}`);
          if (s.title) console.log(`   TITLE: ${s.title}`);
          if (s.subtitle) console.log(`   SUBTITLE: ${s.subtitle}`);
          if (s.text) console.log(`   TEXT: ${s.text.substring(0, 150)}...`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportPages();
