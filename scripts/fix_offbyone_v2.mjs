// KOREKTA v2 — model pozycyjny: order_index = nr_z_maila (<=103) lub nr+1 (>=104),
// bo w galerii 19 usunięto zdjęcie na order_index 104 (jedyna luka).
// Weryfikacja wizualna potwierdziła: Iwona oi265 = jej rodzina, Afanasjew oi280/oi281 = jego rodzina.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
const prisma = new PrismaClient();

const GALLERY_ID = 19;
// Cele w przestrzeni order_index (już po przeliczeniu modelu pozycyjnego):
const TARGETS = {
  29: [37, 38, 199, 256, 265],   // Iwona Zalewska (IZ-9455)  maile: 37,38,198,255,264
  42: [52, 82, 191, 280, 281],   // ... Afanasjew (MA-5631)   maile: 52,82,190,279,280
};

async function main() {
  await mkdir('backups', { recursive: true });
  const stamp = Date.now();
  const backup = {};

  for (const [pidStr, orderIdxList] of Object.entries(TARGETS)) {
    const participantId = Number(pidStr);

    // 1) Rozwiąż zdjęcia po order_index
    const photos = await prisma.galleryPhoto.findMany({
      where: { gallery_id: GALLERY_ID, order_index: { in: orderIdxList } },
      select: { id: true, order_index: true },
    });
    if (photos.length !== orderIdxList.length) {
      throw new Error(`Uczestnik ${participantId}: znaleziono ${photos.length}/${orderIdxList.length} zdjęć dla order_index ${orderIdxList}`);
    }
    const byOi = new Map(photos.map((p) => [p.order_index, p.id]));
    const targetPhotoIds = orderIdxList.map((oi) => byOi.get(oi));

    // 2) Backup aktualnych zaznaczeń
    const current = await prisma.photoSelection.findMany({ where: { participant_id: participantId } });
    backup[participantId] = current;
    const selectedAt = current.length ? current[0].selected_at : new Date();

    console.log(`\n=== Uczestnik ${participantId} ===`);
    console.log('Aktualne photo_id:', current.map((c) => c.photo_id).sort((a, b) => a - b));
    console.log('Docelowe order_index:', orderIdxList);
    console.log('Docelowe photo_id:', targetPhotoIds);

    // 3) Transakcja: usuń i odtwórz
    await prisma.$transaction([
      prisma.photoSelection.deleteMany({ where: { participant_id: participantId } }),
      ...targetPhotoIds.map((photoId) =>
        prisma.photoSelection.create({
          data: { participant_id: participantId, photo_id: photoId, selected_at: selectedAt },
        })
      ),
    ]);

    // 4) Weryfikacja
    const after = await prisma.photoSelection.findMany({ where: { participant_id: participantId } });
    const afterOi = await prisma.galleryPhoto.findMany({
      where: { id: { in: after.map((a) => a.photo_id) } },
      select: { order_index: true },
    });
    console.log('Po zmianie order_index:', afterOi.map((a) => a.order_index).sort((a, b) => a - b));
  }

  const backupPath = `backups/selections-offbyone-fix-v2-${stamp}.json`;
  await writeFile(backupPath, JSON.stringify(backup, null, 2));
  console.log(`\nBackup ORYGINALNYCH (przed v2) zaznaczeń: ${backupPath}`);
  console.log('GOTOWE.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
