// FIX: koryguje przesuniete o 1 wybory (wpisane recznie z maila).
// Kazdy wybor -> zdjecie o order_index+1 (numer klienta == order_index).
// Bezpieczenstwo: backup do JSON, twarde asercje na oczekiwane numery z maila,
// wszystko w transakcji. Uruchom: node scripts/fix_offbyone_selections.mjs
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
const prisma = new PrismaClient();

const GALLERY_ID = 19;
// participant_id -> oczekiwane numery z maila (== order_index docelowych zdjec)
const EXPECTED = {
  29: [37, 38, 198, 255, 264], // Iwona Zalewska
  42: [52, 82, 190, 279, 280], // Maciej Afanasjew
};

async function main() {
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: GALLERY_ID },
    select: { id: true, order_index: true },
  });
  const byOi = new Map(photos.map((p) => [p.order_index, p]));
  const oiById = new Map(photos.map((p) => [p.id, p.order_index]));

  const backup = { when: new Date().toISOString(), gallery_id: GALLERY_ID, participants: [] };
  const plan = [];

  for (const [pidStr, expected] of Object.entries(EXPECTED)) {
    const pid = Number(pidStr);
    const part = await prisma.galleryParticipant.findUnique({
      where: { id: pid },
      include: { selections: { include: { photo: { select: { id: true, order_index: true } } }, orderBy: { selected_at: 'asc' } } },
    });
    if (!part) throw new Error(`Uczestnik ${pid} nie istnieje`);

    const sels = [...part.selections].sort((a, b) => a.photo.order_index - b.photo.order_index);
    if (sels.length !== expected.length) {
      throw new Error(`ID=${pid}: liczba wyborow ${sels.length} != oczekiwane ${expected.length}`);
    }

    const expSorted = [...expected].sort((a, b) => a - b);
    const newSelections = sels.map((s, i) => {
      const targetOi = s.photo.order_index + 1;
      const target = byOi.get(targetOi);
      if (!target) throw new Error(`ID=${pid}: brak zdjecia order_index=${targetOi}`);
      // asercja: docelowy order_index musi rownac sie kolejnemu numerowi z maila
      if (targetOi !== expSorted[i]) {
        throw new Error(`ID=${pid}: niezgodnosc — target order_index=${targetOi} != mail #${expSorted[i]}`);
      }
      return { old_photo_id: s.photo.id, old_oi: s.photo.order_index, new_photo_id: target.id, new_oi: targetOi, selected_at: s.selected_at };
    });

    backup.participants.push({
      participant_id: pid,
      name: part.parent_name,
      old: sels.map((s) => ({ selection_id: s.id, photo_id: s.photo.id, order_index: s.photo.order_index, selected_at: s.selected_at })),
    });
    plan.push({ pid, name: part.parent_name, newSelections });
  }

  await mkdir('backups', { recursive: true });
  const backupPath = `backups/selections-offbyone-fix-${Date.now()}.json`;
  await writeFile(backupPath, JSON.stringify(backup, null, 2), 'utf8');
  console.log(`Backup starych wyborow: ${backupPath}\n`);

  // podglad planu
  for (const { pid, name, newSelections } of plan) {
    console.log(`ID=${pid} ${name}:`);
    newSelections.forEach((n) => console.log(`   ${n.old_photo_id}(oi${n.old_oi}) -> ${n.new_photo_id}(oi${n.new_oi})`));
  }

  // wykonaj w transakcji: delete + create
  await prisma.$transaction(async (tx) => {
    for (const { pid, newSelections } of plan) {
      await tx.photoSelection.deleteMany({ where: { participant_id: pid } });
      for (const n of newSelections) {
        await tx.photoSelection.create({
          data: { participant_id: pid, photo_id: n.new_photo_id, selected_at: n.selected_at },
        });
      }
    }
  });

  console.log('\n✅ Naprawione. Weryfikacja:');
  for (const pid of Object.keys(EXPECTED).map(Number)) {
    const part = await prisma.galleryParticipant.findUnique({
      where: { id: pid },
      include: { selections: { include: { photo: { select: { id: true, order_index: true } } } } },
    });
    const got = part.selections.map((s) => s.photo.order_index).sort((a, b) => a - b);
    const exp = [...EXPECTED[pid]].sort((a, b) => a - b);
    const ok = JSON.stringify(got) === JSON.stringify(exp);
    console.log(`   ID=${pid} ${part.parent_name}: order_index=[${got.join(', ')}] ${ok ? '== MAIL ✅' : '!= MAIL ❌'}`);
  }
}

main().catch((e) => { console.error('BLAD:', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
