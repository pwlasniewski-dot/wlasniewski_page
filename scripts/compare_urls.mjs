// READ-ONLY: dla podanych numerow z maila pokazuje URL zdjecia przy roznych
// interpretacjach numeracji, do wizualnego rozstrzygniecia.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CASES = {
  29: { name: 'Iwona Zalewska', mail: [37, 38, 198, 255, 264] },
  42: { name: 'Maciej Afanasjew', mail: [52, 190, 279, 280, 82] },
};

async function main() {
  const gid = 19;
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: gid },
    orderBy: { order_index: 'asc' },
    select: { id: true, order_index: true, file_url: true, thumbnail_url: true },
  });
  const byOrderIndex = new Map(photos.map((p) => [p.order_index, p]));

  for (const pid of Object.keys(CASES)) {
    const c = CASES[pid];
    const part = await prisma.galleryParticipant.findUnique({
      where: { id: Number(pid) },
      include: { selections: { include: { photo: { select: { id: true, order_index: true, file_url: true } } } } },
    });
    const selectedByOi = new Map(part.selections.map((s) => [s.photo.order_index, s.photo]));

    console.log(`\n================ ${c.name} (ID=${pid}) ================`);
    for (const n of [...c.mail].sort((a, b) => a - b)) {
      const literal = byOrderIndex.get(n);        // order_index == numer z maila
      const selectedPhoto = selectedByOi.get(n - 1); // to co faktycznie wybrano (n-1)
      console.log(`\n  MAIL #${n}`);
      console.log(`    [A] order_index=${n} (numer==order_index): photo_id=${literal?.id}`);
      console.log(`        ${literal?.file_url}`);
      console.log(`    [B] WYBRANE order_index=${n - 1}: photo_id=${selectedPhoto?.id}`);
      console.log(`        ${selectedPhoto?.file_url}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
