import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Znajdź uczestnika KK-1434
const participant = await prisma.galleryParticipant.findFirst({
  where: { parent_identifier: 'KK-1434' },
  select: { id: true, gallery_id: true, parent_name: true, parent_identifier: true },
});
console.log('Uczestnik:', participant);

if (participant) {
  const orders = await prisma.photoOrder.findMany({
    where: { participant_id: participant.id },
    select: { id: true, gallery_id: true, payment_status: true, total_amount: true, photo_count: true, product_ids: true, created_at: true, payment_id: true },
    orderBy: { id: 'asc' },
  });
  console.log(`\nZamówienia uczestnika ${participant.id}:`);
  for (const o of orders) {
    let kind = '';
    try { kind = JSON.parse(o.product_ids || '{}').kind || ''; } catch {}
    console.log(`  #${o.id} status=${o.payment_status} kwota=${o.total_amount} zdjęć=${o.photo_count} kind=${kind} payId=${o.payment_id || '-'} data=${o.created_at.toISOString()}`);
  }
  console.log(`\nRAZEM: ${orders.length}`);
}
await prisma.$disconnect();
