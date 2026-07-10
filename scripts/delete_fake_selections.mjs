// USUWA fałszywe (wsadowe) selekcje sel_id 291-300 (Iwona Zalewska ID=29 + Maciej Afanasjew ID=42, galeria 19)
// Bezpieczenstwo: usuwa TYLKO rekordy o tych ID nalezace do tych uczestnikow w galerii 19.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TARGET_IDS = [291, 292, 293, 294, 295, 296, 297, 298, 299, 300];
const EXPECTED = new Map([
  [291, 29], [292, 29], [293, 29], [294, 29], [295, 29],
  [296, 42], [297, 42], [298, 42], [299, 42], [300, 42],
]);

async function main() {
  const rows = await prisma.photoSelection.findMany({
    where: { id: { in: TARGET_IDS } },
    select: { id: true, participant_id: true, photo_id: true, participant: { select: { gallery_id: true, parent_name: true } } },
  });

  console.log(`Znaleziono ${rows.length} z ${TARGET_IDS.length} rekordow do usuniecia.`);
  const safe = [];
  for (const r of rows) {
    const okOwner = EXPECTED.get(r.id) === r.participant_id;
    const okGallery = r.participant?.gallery_id === 19;
    const status = okOwner && okGallery ? 'OK' : 'POMIJAM (niezgodnosc!)';
    console.log(`  sel_id=${r.id} participant=${r.participant_id} (${r.participant?.parent_name}) photo=${r.photo_id} gallery=${r.participant?.gallery_id} -> ${status}`);
    if (okOwner && okGallery) safe.push(r.id);
  }

  if (safe.length === 0) { console.log('\nBrak bezpiecznych rekordow — nic nie usuwam.'); return; }

  const del = await prisma.photoSelection.deleteMany({ where: { id: { in: safe } } });
  console.log(`\nUSUNIETO ${del.count} rekordow: [${safe.join(', ')}]`);

  // Weryfikacja koncowa
  for (const pid of [29, 42]) {
    const cnt = await prisma.photoSelection.count({ where: { participant_id: pid } });
    console.log(`  Uczestnik ID=${pid}: pozostalo ${cnt} wyborow.`);
  }
}
main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
