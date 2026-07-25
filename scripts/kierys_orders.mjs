// READ-ONLY: pełny podgląd zamówień (PhotoOrder) galerii 20 + powiązane zdjęcia.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const GID = 20;

async function main() {
  const orders = await prisma.photoOrder.findMany({ where: { gallery_id: GID }, orderBy: { created_at: 'asc' } });
  console.log(`Zamówień: ${orders.length}\n`);
  if (orders.length) console.log('POLA zamówienia:', Object.keys(orders[0]).join(', '), '\n');

  // pozycje wg order_index → pozycja klienta
  const gp = await prisma.galleryPhoto.findMany({ where: { gallery_id: GID }, orderBy: { order_index: 'asc' }, select: { id: true, order_index: true } });
  const posByOi = new Map(gp.map((x, i) => [x.order_index, i + 1]));
  const oiById = new Map(gp.map((x) => [x.id, x.order_index]));

  for (const o of orders) {
    console.log(`===== ORDER ${o.id} =====`);
    for (const [k, v] of Object.entries(o)) {
      if (k === 'items' || k === 'photo_ids' || k === 'photos' || k === 'selected_photos' || k === 'metadata' || k === 'cart') {
        console.log(`  ${k}:`, JSON.stringify(v));
      } else {
        console.log(`  ${k}: ${typeof v === 'object' && v !== null ? JSON.stringify(v) : v}`);
      }
    }
    console.log('');
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
