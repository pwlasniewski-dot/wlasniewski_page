import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showB2BSections() {
  try {
    const b2bPage = await prisma.page.findUnique({
      where: { slug: 'b2b' }
    });

    if (b2bPage?.sections) {
      const parsed = typeof b2bPage.sections === 'string' 
        ? JSON.parse(b2bPage.sections) 
        : b2bPage.sections;

      console.log('\n=== B2B HOMEPAGE SECTIONS ===\n');
      console.log(JSON.stringify(parsed, null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showB2BSections();
