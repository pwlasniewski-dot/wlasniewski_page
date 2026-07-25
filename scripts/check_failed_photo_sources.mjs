import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ids = [1778, 1779];

const photos = await prisma.galleryPhoto.findMany({
  where: { id: { in: ids } },
  select: {
    id: true,
    gallery_id: true,
    file_url: true,
    download_source_url: true,
    thumbnail_url: true,
  },
  orderBy: { id: 'asc' },
});

for (const p of photos) {
  console.log(`\n#${p.id} gal=${p.gallery_id}`);
  console.log(`file_url: ${p.file_url}`);
  console.log(`download_source_url: ${p.download_source_url}`);
  console.log(`thumbnail_url: ${p.thumbnail_url}`);
}

await prisma.$disconnect();
