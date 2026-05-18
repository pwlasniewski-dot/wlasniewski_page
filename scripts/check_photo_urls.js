const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function checkPhotos() {
  try {
    const gallery = await prisma.clientGallery.findFirst({
      where: { access_code: '5f5882db456417c4defa6ddec231837f' },
      include: {
        photos: {
          where: { is_standard: true },
          take: 3,
          select: {
            id: true,
            file_url: true,
            thumbnail_url: true,
            is_standard: true
          }
        }
      }
    });

    console.log('Gallery:', gallery.id, gallery.client_name);
    console.log('\nFirst 3 STANDARD photos:');
    gallery.photos.forEach(p => {
      console.log(`\nPhoto ID: ${p.id}`);
      console.log(`file_url: ${p.file_url}`);
      console.log(`thumbnail_url: ${p.thumbnail_url}`);
      console.log(`is_standard: ${p.is_standard}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhotos();
