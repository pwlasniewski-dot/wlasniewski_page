const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function testClientGalleryAPI() {
  try {
    const gallery = await prisma.clientGallery.findFirst({
      where: { access_code: '5f5882db456417c4defa6ddec231837f' },
      include: {
        photos: {
          orderBy: { order_index: 'asc' }
        }
      }
    });

    if (!gallery) {
      console.log('Gallery not found');
      return;
    }

    const standard_photos = gallery.photos.filter(p => p.is_standard);
    const premium_photos = gallery.photos.filter(p => !p.is_standard);

    console.log('Gallery:', gallery.id, gallery.client_name);
    console.log('Total photos:', gallery.photos.length);
    console.log('Standard photos:', standard_photos.length);
    console.log('Premium photos:', premium_photos.length);
    
    console.log('\nFirst standard photo:');
    if (standard_photos[0]) {
      console.log(JSON.stringify({
        id: standard_photos[0].id,
        file_url: standard_photos[0].file_url,
        thumbnail_url: standard_photos[0].thumbnail_url
      }, null, 2));
    }

    console.log('\nHero photos array (standard + premium):');
    const hero_photos = [...standard_photos, ...premium_photos].map(p => ({
      id: p.id,
      file_url: p.file_url,
      thumbnail_url: p.thumbnail_url
    }));
    console.log('Hero photos count:', hero_photos.length);
    console.log('First hero photo:', JSON.stringify(hero_photos[0], null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testClientGalleryAPI();
