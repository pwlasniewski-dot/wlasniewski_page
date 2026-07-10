import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Aktywne galerie grupowe
const galleries = await prisma.clientGallery.findMany({
  where: { gallery_mode: 'GROUP', is_active: true },
  select: {
    id: true, client_name: true, group_access_code: true,
    allow_extra_photo_purchase: true, max_photos_for_print: true,
    _count: { select: { participants: true, photos: true } },
  },
  orderBy: { id: 'desc' },
  take: 15,
});
console.log('=== AKTYWNE GALERIE GRUPOWE ===');
for (const g of galleries) {
  console.log(`#${g.id} "${g.client_name}" kod=${g.group_access_code} | uczestnicy=${g._count.participants} zdj=${g._count.photos} | extra_purchase=${g.allow_extra_photo_purchase} max_print=${g.max_photos_for_print}`);
}

// Rozkład max_selections uczestników per galeria
console.log('\n=== max_selections uczestnikow (per galeria) ===');
for (const g of galleries) {
  const parts = await prisma.galleryParticipant.groupBy({
    by: ['max_selections'],
    where: { gallery_id: g.id },
    _count: { max_selections: true },
  });
  const summary = parts.map(p => `${p.max_selections}zdj×${p._count.max_selections}os`).join(', ');
  console.log(`#${g.id} "${g.client_name}": ${summary || 'brak uczestnikow'}`);
}

// Ostatnie zamówienia (7 dni)
console.log('\n=== OSTATNIE ZAMOWIENIA (7 dni) ===');
const orders = await prisma.photoOrder.findMany({
  where: { created_at: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } },
  select: { id: true, participant_id: true, gallery_id: true, payment_status: true, total_amount: true, created_at: true },
  orderBy: { created_at: 'desc' },
  take: 30,
});
for (const o of orders) {
  const t = new Date(o.created_at).toLocaleString('pl-PL');
  console.log(`#${o.id} gal=${o.gallery_id} uczest=${o.participant_id} status=${o.payment_status} kwota=${(o.total_amount/100).toFixed(2)}zl ${t}`);
}
console.log(`RAZEM zamowien (7 dni): ${orders.length}`);

await prisma.$disconnect();
