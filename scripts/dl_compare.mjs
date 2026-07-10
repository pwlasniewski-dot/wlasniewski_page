// READ-ONLY: pobiera pary zdjec (A literal, B wybrane) do tmp_compare/ do obejrzenia.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
const prisma = new PrismaClient();

const CASES = {
  IZ: { id: 29, mail: [37, 38, 198, 255, 264] },
  MA: { id: 42, mail: [52, 82, 190, 279, 280] },
};

async function dl(url, path) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  const b = Buffer.from(await r.arrayBuffer());
  await writeFile(path, b);
}

async function main() {
  await mkdir('tmp_compare', { recursive: true });
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: 19 },
    orderBy: { order_index: 'asc' },
    select: { id: true, order_index: true, file_url: true },
  });
  const byOi = new Map(photos.map((p) => [p.order_index, p]));

  for (const [tag, c] of Object.entries(CASES)) {
    for (const n of c.mail) {
      const A = byOi.get(n);       // numer == order_index
      const B = byOi.get(n - 1);   // wybrane
      if (A) await dl(A.file_url, `tmp_compare/${tag}_mail${n}_A_oi${n}_id${A.id}.webp`);
      if (B) await dl(B.file_url, `tmp_compare/${tag}_mail${n}_B_oi${n - 1}_id${B.id}.webp`);
      console.log(`${tag} #${n}: A=id${A?.id} B=id${B?.id}`);
    }
  }
  console.log('OK -> tmp_compare/');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
