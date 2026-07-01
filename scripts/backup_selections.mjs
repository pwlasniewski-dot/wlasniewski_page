// BACKUP WYBORÓW RODZICÓW NA DYSK (JPG, folder per rodzic z nazwiskiem)
// Galerie: 19 (barna/KLASAC) i 20 (kierys/TORUNAB).
// Pobiera wybrane zdjęcia (selekcje standardowe), konwertuje do JPG,
// zapisuje: <OUT>/<code>/<Nazwisko (IDENT)>/<Nazwisko N [STANDARD].jpg>
//
// Uruchomienie:
//   node scripts/backup_selections.mjs

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const GALLERY_IDS = (process.env.GALLERY_IDS || '19,20').split(',').map(s => parseInt(s.trim(), 10));
const stamp = new Date().toISOString().slice(0, 10);
const OUT_ROOT = process.env.OUT_ROOT || path.join(process.cwd(), 'backups', `wybory-rodzicow-${stamp}`);

const prisma = new PrismaClient();

function sanitize(input, fallback) {
  const safe = (input || fallback)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return safe || fallback;
}

async function main() {
  console.log(`\n=== BACKUP WYBORÓW ===`);
  console.log(`Cel: ${OUT_ROOT}\n`);
  fs.mkdirSync(OUT_ROOT, { recursive: true });

  let totalFiles = 0;
  let totalFailed = 0;
  const report = [];

  for (const galleryId of GALLERY_IDS) {
    const gallery = await prisma.clientGallery.findUnique({
      where: { id: galleryId },
      select: { id: true, client_name: true, group_access_code: true },
    });
    if (!gallery) { console.log(`Galeria ${galleryId} nie istnieje — pomijam.`); continue; }

    const code = gallery.group_access_code || `gallery-${galleryId}`;
    const galleryDir = path.join(OUT_ROOT, sanitize(code, `gallery-${galleryId}`));
    fs.mkdirSync(galleryDir, { recursive: true });
    console.log(`\n### Galeria #${galleryId} (${code}) — ${gallery.client_name}`);

    const participants = await prisma.galleryParticipant.findMany({
      where: { gallery_id: galleryId },
      include: {
        selections: {
          include: { photo: { select: { id: true, file_url: true } } },
          orderBy: { selected_at: 'asc' },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    for (const p of participants) {
      if (p.selections.length === 0) continue;
      const displayName = sanitize(p.parent_name || p.name, `Rodzic-${p.id}`);
      const ident = p.parent_identifier ? ` (${sanitize(p.parent_identifier, '')})` : '';
      const folderName = sanitize(`${displayName}${ident}`, `Rodzic-${p.id}`);
      const parentDir = path.join(galleryDir, folderName);
      fs.mkdirSync(parentDir, { recursive: true });

      let idx = 0;
      let okCount = 0;
      for (const sel of p.selections) {
        idx += 1;
        const url = sel.photo.file_url;
        try {
          const res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const srcBuf = Buffer.from(await res.arrayBuffer());
          const jpg = await sharp(srcBuf)
            .pipelineColorspace('srgb')
            .toColorspace('srgb')
            .withMetadata({ icc: 'srgb' })
            .jpeg({ quality: 95, chromaSubsampling: '4:4:4', mozjpeg: true })
            .toBuffer();
          const fileName = `${displayName} ${idx} [STANDARD].jpg`;
          fs.writeFileSync(path.join(parentDir, fileName), jpg);
          okCount += 1;
          totalFiles += 1;
        } catch (err) {
          totalFailed += 1;
          console.error(`  BŁĄD ${displayName} #${sel.photo.id}: ${err}`);
        }
      }
      console.log(`  ${folderName}: ${okCount}/${p.selections.length} zdjęć`);
      report.push({ gallery: code, participant_id: p.id, name: displayName, identifier: p.parent_identifier, saved: okCount, selected: p.selections.length });
    }
  }

  fs.writeFileSync(path.join(OUT_ROOT, '_raport.json'), JSON.stringify({ generated_at: new Date().toISOString(), totalFiles, totalFailed, report }, null, 2), 'utf8');
  console.log(`\n=== GOTOWE ===`);
  console.log(`Zapisano plików: ${totalFiles}, błędów: ${totalFailed}`);
  console.log(`Folder: ${OUT_ROOT}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('BŁĄD:', e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
