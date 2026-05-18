const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function findGallery() {
  try {
    // Find user first
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'gnadworny@wp.pl' },
          { name: { contains: 'Grzegorz Nadworny', mode: 'insensitive' } }
        ]
      }
    });

    console.log('User found:', user ? `${user.name} (${user.email})` : 'NOT FOUND');
    
    if (!user) {
      console.log('No user found');
      process.exit(0);
    }

    // Find galleries for this user
    const galleries = await prisma.clientGallery.findMany({
      where: {
        OR: [
          { client_name: { contains: 'Grzegorz', mode: 'insensitive' } },
          { client_name: { contains: 'Nadworny', mode: 'insensitive' } },
          { client_email: 'gnadworny@wp.pl' }
        ]
      },
      select: {
        id: true,
        access_code: true,
        client_name: true,
        client_email: true,
        photographer_id: true,
        is_active: true,
        created_at: true
      }
    });

    console.log('\nGalleries found:', galleries.length);
    galleries.forEach(g => {
      console.log(`\nGallery ID: ${g.id}`);
      console.log(`Access Code: ${g.access_code}`);
      console.log(`Client: ${g.client_name} (${g.client_email})`);
      console.log(`Created: ${g.created_at}`);
      console.log(`Active: ${g.is_active}`);
      console.log(`URL: https://wlasniewski.pl/galeria/${g.access_code}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findGallery();
