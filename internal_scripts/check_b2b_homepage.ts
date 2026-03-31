import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkB2BHomepage() {
  try {
    // Check all published pages
    const allPages = await prisma.page.findMany({
      where: {
        is_published: true
      },
      select: {
        id: true,
        title: true,
        slug: true,
        meta_title: true,
        meta_description: true,
        page_type: true,
        sections: true
      },
      orderBy: {
        slug: 'asc'
      }
    });

    console.log('\n=== All Published Pages ===');
    allPages.forEach(page => {
      console.log(`\nID: ${page.id}`);
      console.log(`Slug: ${page.slug}`);
      console.log(`Title: ${page.title}`);
      console.log(`Page Type: ${page.page_type}`);
      console.log(`Meta Title: ${page.meta_title || 'null'}`);
      if (page.sections) {
        const parsed = typeof page.sections === 'string' ? JSON.parse(page.sections) : page.sections;
        console.log(`Sections: ${parsed.length} sections`);
        parsed.forEach((section: any, idx: number) => {
          console.log(`  ${idx + 1}. ${section.type} - ${section.title || section.data?.title || 'no title'}`);
        });
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkB2BHomepage();
