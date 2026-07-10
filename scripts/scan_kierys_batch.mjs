// READ-ONLY: wykrywa wybory wpisane hurtowo (z maila) w galerii 20 i mapuje na pozycje klienta.
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
  const ois = photos.map((p) => p.order_index);
  const oiById = new Map(photos.map((p) => [p.id, p.order_index]));
  const posByOi = new Map(ois.map((oi, idx) => [oi, idx + 1])); // pozycja = numer klienta

  const participants = await prisma.galleryParticipant.findMany({
    where: { gallery_id: GALLERY_ID },
    select: { id: true, name: true, participant_code: true, parent_email: true },
    orderBy: { id: 'asc' },
  });

  for (const p of participants) {
    const sels = await prisma.photoSelection.findMany({
      where: { participant_id: p.id },
      orderBy: { id: 'asc' },
    });
    if (sels.length === 0) continue;
    // batch = wszystkie selected_at w ramach < 2s i sekwencyjne id
    const times = sels.map((s) => s.selected_at?.getTime() ?? 0);
    const span = Math.max(...times) - Math.min(...times);
    const ids = sels.map((s) => s.id);
    const seq = ids.every((v, i) => i === 0 || v === ids[i - 1] + 1);
    const isBatch = span < 2000 && seq && sels.length > 1;
    const positions = sels.map((s) => posByOi.get(oiById.get(s.photo_id))).sort((a, b) => a - b);
    const oisSel = sels.map((s) => oiById.get(s.photo_id)).sort((a, b) => a - b);
    const flag = isBatch ? '  <== BATCH (z maila?)' : '';
    console.log(`ID ${p.id} ${p.name || ''} [${p.participant_code}] n=${sels.length} span=${span}ms pozycje=[${positions.join(',')}] oi=[${oisSel.join(',')}]${flag}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
