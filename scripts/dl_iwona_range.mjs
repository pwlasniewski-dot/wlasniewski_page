// READ-ONLY: pobiera zakresy order_index wokol wyborow Iwony do znalezienia rodziny.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
const prisma = new PrismaClient();

const RANGES = [196, 197, 198, 199, 200, 253, 254, 255, 256, 257, 262, 263, 264, 265, 266];

async function dl(url, path) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  await writeFile(path, Buffer.from(await r.arrayBuffer()));
}

async function main() {
  await mkdir('tmp_iwona', { recursive: true });
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: 19, order_index: { in: RANGES } },
    orderBy: { order_index: 'asc' },
    select: { id: true, order_index: true, file_url: true },
  });
  for (const p of photos) {
    await dl(p.file_url, `tmp_iwona/oi${String(p.order_index).padStart(3, '0')}_id${p.id}.webp`);
    console.log(`oi${p.order_index} id${p.id}`);
  }
  console.log('OK -> tmp_iwona/');
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
