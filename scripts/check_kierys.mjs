// READ-ONLY: diagnostyka galerii 20 (Kierys) — luki w order_index + wybory uczestników.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const GALLERY_ID = 20;

async function main() {
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: GALLERY_ID },
    orderBy: { order_index: 'asc' },
    select: { id: true, order_index: true },
  });
  console.log(`Galeria ${GALLERY_ID}: ${photos.length} zdjęć`);
  const ois = photos.map((p) => p.order_index);
  const min = ois[0], max = ois[ois.length - 1];
  console.log(`order_index zakres: ${min}..${max}`);
  const present = new Set(ois);
  const gaps = [];
  for (let i = min; i <= max; i++) if (!present.has(i)) gaps.push(i);
  console.log(`LUKI (usunięte order_index): ${gaps.length ? gaps.join(', ') : 'BRAK'}`);

  // Uczestnicy tej galerii
  const participants = await prisma.galleryParticipant.findMany({
    where: { gallery_id: GALLERY_ID },
    select: { id: true, name: true, participant_code: true, parent_name: true },
    orderBy: { id: 'asc' },
  });
  console.log(`\nUczestnicy: ${participants.length}`);
  const kierys = participants.filter((p) => /kierys/i.test(`${p.name || ''} ${p.parent_name || ''}`));
  console.log('Pasujący "Kierys":', kierys);

  // Wybory Kierysa (jeśli jest) — mapuj na order_index
  for (const p of kierys) {
    const sels = await prisma.photoSelection.findMany({
      where: { participant_id: p.id },
      orderBy: { id: 'asc' },
    });
    const photoIds = sels.map((s) => s.photo_id);
    const selPhotos = await prisma.galleryPhoto.findMany({
      where: { id: { in: photoIds } },
      select: { id: true, order_index: true },
    });
    const oiById = new Map(selPhotos.map((x) => [x.id, x.order_index]));
    console.log(`\n=== ${p.name} / ${p.parent_name} (ID ${p.id}, ${p.participant_code}) ===`);
    console.log(`Zaznaczeń: ${sels.length}`);
    console.log('selection ids:', sels.map((s) => s.id));
    console.log('selected_at:', sels.map((s) => s.selected_at?.toISOString()));
    console.log('photo_id → order_index:', sels.map((s) => `${s.photo_id}→oi${oiById.get(s.photo_id)}`).join(', '));
    // Pozycja (1-based) w galerii wg order_index
    const posByOi = new Map(ois.map((oi, idx) => [oi, idx + 1]));
    console.log('POZYCJE (numer widziany przez klienta):', sels.map((s) => posByOi.get(oiById.get(s.photo_id))).sort((a,b)=>a-b));
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
