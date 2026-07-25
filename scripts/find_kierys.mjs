// READ-ONLY: szuka Magdy Kierys w całej bazie (wszystkie galerie) + jej zaznaczenia.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1) uczestnicy pasujący do "kierys" lub "magda" w dowolnym polu
  const parts = await prisma.galleryParticipant.findMany({
    where: {
      OR: [
        { name: { contains: 'kierys', mode: 'insensitive' } },
        { parent_name: { contains: 'kierys', mode: 'insensitive' } },
        { parent_email: { contains: 'kierys', mode: 'insensitive' } },
        { parent_identifier: { contains: 'kierys', mode: 'insensitive' } },
        { participant_code: { contains: 'kierys', mode: 'insensitive' } },
        { notes: { contains: 'kierys', mode: 'insensitive' } },
      ],
    },
    include: { gallery: { select: { id: true, client_name: true, access_code: true } } },
    orderBy: { id: 'asc' },
  });

  console.log(`Znaleziono uczestników pasujących do "Kierys": ${parts.length}\n`);
  for (const p of parts) {
    console.log(`--- ID ${p.id} | galeria ${p.gallery_id} (${p.gallery?.client_name}) ---`);
    console.log(`    name=${p.name} | parent_name=${p.parent_name} | email=${p.parent_email} | code=${p.participant_code} | ident=${p.parent_identifier}`);

    const sels = await prisma.photoSelection.findMany({
      where: { participant_id: p.id },
      orderBy: { id: 'asc' },
    });
    console.log(`    zaznaczeń: ${sels.length}`);
    if (sels.length) {
      const photoIds = sels.map((s) => s.photo_id);
      const photos = await prisma.galleryPhoto.findMany({
        where: { id: { in: photoIds } },
        select: { id: true, order_index: true, file_url: true, gallery_id: true },
      });
      // pozycje wg order_index w galerii uczestnika
      const gp = await prisma.galleryPhoto.findMany({
        where: { gallery_id: p.gallery_id },
        orderBy: { order_index: 'asc' },
        select: { order_index: true },
      });
      const posByOi = new Map(gp.map((x, i) => [x.order_index, i + 1]));
      const oiById = new Map(photos.map((x) => [x.id, x.order_index]));
      for (const s of sels) {
        const oi = oiById.get(s.photo_id);
        console.log(`      photo_id=${s.photo_id} oi=${oi} poz=${posByOi.get(oi)} at=${s.selected_at?.toISOString()}`);
      }
    }
    console.log('');
  }

  // 2) galerie których nazwa/kod zawiera kierys (gdyby miała własną galerię jako opiekun)
  const gals = await prisma.clientGallery.findMany({
    where: {
      OR: [
        { client_name: { contains: 'kierys', mode: 'insensitive' } },
        { description: { contains: 'kierys', mode: 'insensitive' } },
        { access_code: { contains: 'kierys', mode: 'insensitive' } },
      ],
    },
    select: { id: true, client_name: true, access_code: true },
  });
  console.log(`Galerie pasujące do "Kierys": ${gals.length}`);
  for (const g of gals) console.log(`  galeria ${g.id} | ${g.client_name} | ${g.access_code}`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
