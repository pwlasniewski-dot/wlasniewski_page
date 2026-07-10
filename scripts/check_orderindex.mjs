// READ-ONLY: sprawdza ciaglosc order_index w galerii 19 + pozycje selekcji.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const gid = 19;
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: gid },
    orderBy: { order_index: 'asc' },
    select: { id: true, order_index: true, created_at: true },
  });
  console.log(`Galeria ${gid}: ${photos.length} zdjec`);

  // luki w order_index
  const idxs = photos.map((p) => p.order_index).filter((x) => x != null).sort((a, b) => a - b);
  const min = idxs[0], max = idxs[idxs.length - 1];
  console.log(`order_index zakres: ${min}..${max}, unikalnych=${new Set(idxs).size}`);
  const present = new Set(idxs);
  const gaps = [];
  for (let i = min; i <= max; i++) if (!present.has(i)) gaps.push(i);
  console.log(`Luki w order_index (brakujace numery): ${gaps.length ? gaps.join(', ') : 'BRAK'}`);

  // duplikaty order_index
  const seen = new Map();
  idxs.forEach((x) => seen.set(x, (seen.get(x) || 0) + 1));
  const dups = [...seen.entries()].filter(([, n]) => n > 1);
  console.log(`Duplikaty order_index: ${dups.length ? dups.map(([v, n]) => `${v}x${n}`).join(', ') : 'BRAK'}`);

  // pozycja (idx+1) vs order_index — pokaz pierwsze rozjazdy
  console.log(`\nPozycja(idx+1) vs order_index — pierwsze 5 rozbieznosci:`);
  let shown = 0;
  photos.forEach((p, i) => {
    if (p.order_index !== i + 1 && shown < 8) {
      console.log(`  pozycja ${i + 1} -> photo_id=${p.id}, order_index=${p.order_index}`);
      shown++;
    }
  });
  if (shown === 0) console.log('  brak — order_index == pozycja wszedzie');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
