import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // też szukaj po fragmentach
  const parts = await prisma.galleryParticipant.findMany({
    where: { OR: [
      { name: { contains: 'lisz', mode: 'insensitive' } },
      { parent_name: { contains: 'lisz', mode: 'insensitive' } },
      { name: { contains: 'oskar', mode: 'insensitive' } },
      { parent_name: { contains: 'oskar', mode: 'insensitive' } },
    ]},
    include: {
      gallery: { select: { id: true, client_name: true, allow_extra_photo_purchase: true, max_photos_for_print: true, gallery_mode: true } },
      _count: { select: { selections: true } },
    },
  });
  // galerie indywidualne
  const gals = await prisma.clientGallery.findMany({
    where: { OR: [
      { client_name: { contains: 'lisz', mode: 'insensitive' } },
      { client_name: { contains: 'oskar', mode: 'insensitive' } },
    ]},
    select: { id: true, client_name: true, client_email: true, allow_extra_photo_purchase: true },
  });
  console.log(`Galerie indywidualne "lisz/oskar": ${gals.length}`);
  for (const g of gals) console.log(`  #${g.id} | ${g.client_name} | ${g.client_email} | extra_purchase=${g.allow_extra_photo_purchase}`);

  if (!parts.length) { console.log('\nBrak uczestnika grupowego "lisz" / "oskar".'); return; }
  for (const p of parts) {
    console.log(`\n=== uczestnik #${p.id} ===`);
    console.log(`  name: ${p.name}`);
    console.log(`  parent_name: ${p.parent_name}`);
    console.log(`  parent_email: ${p.parent_email}`);
    console.log(`  max_selections: ${p.max_selections}`);
    console.log(`  allow_extra_photo_purchase: ${p.allow_extra_photo_purchase}`);
    console.log(`  selections: ${p._count.selections}`);
    console.log(`  galeria #${p.gallery.id}: ${p.gallery.client_name}`);
    console.log(`    gallery.allow_extra_photo_purchase: ${p.gallery.allow_extra_photo_purchase}`);
    console.log(`    gallery.max_photos_for_print: ${p.gallery.max_photos_for_print}`);
    console.log(`    gallery.gallery_mode: ${p.gallery.gallery_mode}`);

    // zamówienia
    const orders = await prisma.photoOrder.findMany({ where: { participant_id: p.id }, orderBy: { created_at: 'asc' } });
    console.log(`  zamówień: ${orders.length}`);
    for (const o of orders) console.log(`    order #${o.id} | photo_count=${o.photo_count} | status=${o.payment_status} | total=${o.total_amount}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
