import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const setting = await prisma.setting.findUnique({ where: { setting_key: 'jpg_mapping_20' } });
if (!setting?.setting_value) { console.log('Brak manifestu jpg_mapping_20'); process.exit(0); }
const manifest = JSON.parse(setting.setting_value);
const items = Array.isArray(manifest.items) ? manifest.items : [];

const photos = await prisma.galleryPhoto.findMany({
  where: { gallery_id: 20, download_source_url: null },
  select: { id: true },
});
const unmappedIds = new Set(photos.map(p => p.id));
console.log(`Niezmapowanych zdjęć: ${unmappedIds.size}`);

const byCat = {};
let mappedCorrect = 0;
for (const it of items) {
  if (!unmappedIds.has(it.webp_id)) continue;
  byCat[it.category] = (byCat[it.category] || 0) + 1;
  // BEZPIECZNIE: automatycznie mapujemy TYLKO pewne dopasowania ('correct').
  if (it.category === 'correct' && it.jpg_url) {
    await prisma.galleryPhoto.update({ where: { id: it.webp_id }, data: { download_source_url: it.jpg_url } });
    mappedCorrect++;
  }
}
console.log('Niezmapowane wg kategorii:', byCat);
console.log(`Domapowano PEWNYCH (correct): ${mappedCorrect}`);

const still = await prisma.galleryPhoto.count({ where: { gallery_id: 20, download_source_url: null } });
console.log(`Pozostaje do RĘCZNEJ akceptacji (sporne/bez pliku): ${still}`);
await prisma.$disconnect();
