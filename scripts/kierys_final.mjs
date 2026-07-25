// READ-ONLY: galerie Toruń A/B + wszystko powiązane z e-mailem Magdy.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const EMAIL = 'magdalenakierys@onet.pl';

async function main() {
  console.log('=== Galerie z kodem/nazwą Toruń / klasa A/B ===');
  const gals = await prisma.clientGallery.findMany({
    where: { OR: [
      { group_access_code: { contains: 'TORUN', mode: 'insensitive' } },
      { client_name: { contains: 'klasa', mode: 'insensitive' } },
      { client_name: { contains: 'toru', mode: 'insensitive' } },
    ] },
    select: { id: true, client_name: true, client_email: true, gallery_mode: true, group_access_code: true, group_password: true, _count: { select: { photos: true, participants: true } } },
  });
  for (const g of gals) console.log(`  #${g.id} | ${g.client_name} | owner=${g.client_email} | mode=${g.gallery_mode} | kod=${g.group_access_code} | zdj=${g._count.photos} | ucz=${g._count.participants}`);

  console.log(`\n=== Galerie, których właścicielem jest ${EMAIL} ===`);
  const owned = await prisma.clientGallery.findMany({ where: { client_email: EMAIL }, select: { id: true, client_name: true, gallery_mode: true } });
  console.log(JSON.stringify(owned, null, 2));

  console.log(`\n=== Uczestnik z e-mailem ${EMAIL} (dowolna galeria) ===`);
  const p = await prisma.galleryParticipant.findMany({ where: { parent_email: EMAIL }, select: { id: true, gallery_id: true, name: true } });
  console.log(JSON.stringify(p, null, 2));

  console.log(`\n=== Zamówienia z e-mailem ${EMAIL} w payment_url (base64 payerEmail) ===`);
  // payerEmail siedzi w tokenie JWT payment_url; sprawdzimy proste "contains" nie zadziała (base64). Pomijamy.
  console.log('(pomijam — e-mail zakodowany w tokenie)');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
