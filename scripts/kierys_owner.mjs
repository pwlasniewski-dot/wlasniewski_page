// READ-ONLY: gdzie opiekun galerii 20 (Magda Kierys) zapisał wybory?
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const GID = 20;

async function main() {
  const g = await prisma.clientGallery.findUnique({ where: { id: GID } });
  console.log('=== GALERIA 20 ===');
  console.log({
    id: g.id, client_name: g.client_name, client_email: g.client_email,
    gallery_mode: g.gallery_mode, group_access_code: g.group_access_code,
    group_password: g.group_password, is_active: g.is_active,
    max_photos_for_print: g.max_photos_for_print,
  });

  // wszystkie zaznaczenia na zdjęciach tej galerii (dowolny uczestnik)
  const photoIds = (await prisma.galleryPhoto.findMany({ where: { gallery_id: GID }, select: { id: true } })).map((x) => x.id);
  const sels = await prisma.photoSelection.findMany({ where: { photo_id: { in: photoIds } } });
  console.log(`\nZaznaczeń (PhotoSelection) na zdjęciach galerii 20: ${sels.length}`);
  const byPart = {};
  for (const s of sels) byPart[s.participant_id] = (byPart[s.participant_id] || 0) + 1;
  for (const [pid, n] of Object.entries(byPart)) {
    const p = await prisma.galleryParticipant.findUnique({ where: { id: Number(pid) }, select: { id: true, name: true, parent_name: true, participant_code: true } });
    console.log(`   uczestnik ${pid} (${p?.name}/${p?.parent_name}/${p?.participant_code}): ${n} zazn.`);
  }

  // zamówienia dla tej galerii
  try {
    const orders = await prisma.photoOrder.findMany({ where: { gallery_id: GID } });
    console.log(`\nPhotoOrder dla galerii 20: ${orders.length}`);
    for (const o of orders) {
      console.log(`   order ${o.id} | status=${o.status} | created=${o.created_at?.toISOString?.() ?? o.created_at} | items?`);
    }
  } catch (e) { console.log('PhotoOrder: brak modelu/inny kształt —', e.message); }

  // lista modeli w prisma (żeby znaleźć ew. tabelę wyborów opiekuna)
  console.log('\nModele prisma:', Object.keys(prisma).filter((k) => !k.startsWith('_') && !k.startsWith('$')).join(', '));
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
