// READ-ONLY: podglad wyborow Iwony Zalewskiej
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.galleryParticipant.findMany({
    where: {
      OR: [
        { parent_name: { contains: 'Zalewsk', mode: 'insensitive' } },
        { parent_name: { contains: 'Iwona', mode: 'insensitive' } },
      ],
    },
    include: {
      selections: {
        include: { photo: { select: { id: true, file_url: true, gallery_id: true } } },
        orderBy: { selected_at: 'asc' },
      },
    },
  });

  if (parts.length === 0) {
    console.log('Nie znaleziono uczestnika pasujacego do "Zalewsk"/"Iwona".');
    return;
  }

  for (const p of parts) {
    console.log('\n=====================================================');
    console.log(`Uczestnik ID=${p.id} | gallery_id=${p.gallery_id}`);
    console.log(`  parent_name: ${p.parent_name}`);
    console.log(`  parent_identifier: ${p.parent_identifier}`);
    console.log(`  parent_email: ${p.parent_email}`);
    console.log(`  liczba wyborow: ${p.selections.length}`);
    p.selections.forEach((s, i) => {
      const fname = (s.photo?.file_url || '').split('?')[0].split('/').pop();
      const foreign = s.photo?.gallery_id !== p.gallery_id ? '  <<< INNA GALERIA!' : '';
      console.log(`   ${i + 1}. photo_id=${s.photo?.id} | photo.gallery_id=${s.photo?.gallery_id}${foreign} | ${fname} | selected_at=${s.selected_at?.toISOString?.() || s.selected_at}`);
      console.log(`       url: ${s.photo?.file_url}`);
    });
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
