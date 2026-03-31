import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkButtons() {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: 'b2b' }
    });

    if (page?.sections) {
      const sections = typeof page.sections === 'string' 
        ? JSON.parse(page.sections) 
        : page.sections;

      const hero = sections.find((s: any) => s.type === 'hero');
      
      console.log('\n=== HERO SECTION DATA ===\n');
      console.log(JSON.stringify(hero, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkButtons();
