// AUDYT DOPASOWANIA JPG <-> webp (TYLKO ODCZYT)
// Nie zmienia bazy ani S3. Liczy perceptual hash (dHash) i paruje po treści obrazu.
//
// Uruchomienie:
//   node scripts/audit_jpg_match.mjs
//
// Konfiguracja przez zmienne (opcjonalnie):
//   GALLERY_ID   - domyślnie 19
//   JPG_DIR      - folder z lokalnymi JPG

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';

const GALLERY_ID = parseInt(process.env.GALLERY_ID || '19', 10);
const JPG_DIR = process.env.JPG_DIR ||
  'D:\\Sony A7 III\\Klasa 1 Torun\\Pierwsza Komunia Swięta Szkoła Seslezjańska Klasa C 30.05.2026';
const DOWNLOAD_CONCURRENCY = 20;
const OUT_JSON = path.join(process.cwd(), 'scripts', `audit_result_${GALLERY_ID}.json`);

const prisma = new PrismaClient();

// dHash 64-bit: resize 9x8 grayscale, porównanie sąsiednich pikseli w rzędzie.
async function dhash(buf) {
  const { data } = await sharp(buf)
    .rotate() // normalizacja orientacji wg EXIF
    .grayscale()
    .resize(9, 8, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });
  let hash = 0n;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const left = data[row * 9 + col];
      const right = data[row * 9 + col + 1];
      if (left < right) hash |= 1n << BigInt(row * 8 + col);
    }
  }
  return hash;
}

function hamming(a, b) {
  let x = a ^ b;
  let c = 0;
  while (x) { c += Number(x & 1n); x >>= 1n; }
  return c;
}

async function mapPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return results;
}

async function main() {
  console.log(`\n=== AUDYT DOPASOWANIA (TYLKO ODCZYT) ===`);
  console.log(`Galeria: ${GALLERY_ID}`);
  console.log(`Folder JPG: ${JPG_DIR}\n`);

  // 1) Pobierz rekordy z bazy
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: GALLERY_ID },
    select: { id: true, file_url: true, order_index: true },
    orderBy: { order_index: 'asc' },
  });
  console.log(`Rekordów webp w bazie: ${photos.length}`);

  // 2) Lista lokalnych JPG
  if (!fs.existsSync(JPG_DIR)) {
    console.error(`BŁĄD: folder nie istnieje: ${JPG_DIR}`);
    process.exit(1);
  }
  const jpgFiles = fs.readdirSync(JPG_DIR)
    .filter(f => /\.(jpe?g)$/i.test(f))
    .sort();
  console.log(`Plików JPG na dysku: ${jpgFiles.length}\n`);

  // 3) Hash lokalnych JPG
  console.log(`Liczę hashe lokalnych JPG...`);
  const jpgHashes = await mapPool(jpgFiles, 8, async (name) => {
    try {
      const buf = fs.readFileSync(path.join(JPG_DIR, name));
      return { name, hash: await dhash(buf), ok: true };
    } catch (e) {
      return { name, ok: false, error: String(e) };
    }
  });
  const jpgOk = jpgHashes.filter(j => j.ok);
  const jpgBad = jpgHashes.filter(j => !j.ok);
  console.log(`  OK: ${jpgOk.length}, błędy: ${jpgBad.length}`);

  // 4) Hash webp (pobrane z S3)
  console.log(`\nPobieram i hashuję webp z S3...`);
  let done = 0;
  const webpHashes = await mapPool(photos, DOWNLOAD_CONCURRENCY, async (p) => {
    const url = p.file_url; // webp podglądowy
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const h = await dhash(buf);
      done++;
      if (done % 50 === 0) console.log(`  ...${done}/${photos.length}`);
      return { id: p.id, order_index: p.order_index, url, hash: h, ok: true };
    } catch (e) {
      done++;
      return { id: p.id, order_index: p.order_index, url, ok: false, error: String(e) };
    }
  });
  const webpOk = webpHashes.filter(w => w.ok);
  const webpBad = webpHashes.filter(w => !w.ok);
  console.log(`  OK: ${webpOk.length}, błędy pobierania: ${webpBad.length}`);

  // 5) Dopasowanie: dla każdego webp najbliższy JPG (i drugi najbliższy)
  console.log(`\nParuję po treści obrazu...`);
  const matches = [];
  const jpgUsedBy = new Map(); // jpgName -> [webpId,...]
  for (const w of webpOk) {
    let best = { dist: 999, name: null };
    let second = { dist: 999, name: null };
    for (const j of jpgOk) {
      const d = hamming(w.hash, j.hash);
      if (d < best.dist) { second = best; best = { dist: d, name: j.name }; }
      else if (d < second.dist) { second = { dist: d, name: j.name }; }
    }
    matches.push({
      webp_id: w.id,
      order_index: w.order_index,
      best_jpg: best.name,
      best_dist: best.dist,
      second_dist: second.dist,
      margin: second.dist - best.dist,
    });
    if (best.name) {
      if (!jpgUsedBy.has(best.name)) jpgUsedBy.set(best.name, []);
      jpgUsedBy.get(best.name).push(w.id);
    }
  }

  // 6) Kategorie
  const STRONG = 6, WEAK = 12;
  const strong = matches.filter(m => m.best_dist <= STRONG);
  const weak = matches.filter(m => m.best_dist > STRONG && m.best_dist <= WEAK);
  const none = matches.filter(m => m.best_dist > WEAK);
  const ambiguous = matches.filter(m => m.best_dist <= WEAK && m.margin < 3);
  const dupJpg = [...jpgUsedBy.entries()].filter(([, ids]) => ids.length > 1);
  const usedJpg = new Set(matches.filter(m => m.best_dist <= WEAK).map(m => m.best_jpg));
  const unusedJpg = jpgOk.filter(j => !usedJpg.has(j.name)).map(j => j.name);

  console.log(`\n================ WYNIK ================`);
  console.log(`webp w bazie:            ${photos.length}`);
  console.log(`JPG na dysku:            ${jpgFiles.length}`);
  console.log(`--------------------------------------`);
  console.log(`Silne dopasowanie (<=${STRONG}): ${strong.length}`);
  console.log(`Słabe (${STRONG + 1}-${WEAK}):          ${weak.length}`);
  console.log(`BRAK dopasowania (>${WEAK}):   ${none.length}`);
  console.log(`Niejednoznaczne (margines<3): ${ambiguous.length}`);
  console.log(`JPG użyte przez >1 webp:  ${dupJpg.length}`);
  console.log(`JPG nieużyte:            ${unusedJpg.length}`);
  console.log(`Błędy pobierania webp:   ${webpBad.length}`);
  console.log(`Błędy odczytu JPG:       ${jpgBad.length}`);
  console.log(`======================================\n`);

  if (none.length) {
    console.log(`webp BEZ dopasowania (top 20):`);
    none.slice(0, 20).forEach(m => console.log(`  webp#${m.webp_id} (order ${m.order_index}) best_dist=${m.best_dist}`));
  }
  if (dupJpg.length) {
    console.log(`\nJPG przypisane do wielu webp (top 20):`);
    dupJpg.slice(0, 20).forEach(([name, ids]) => console.log(`  ${name} <- webp ${ids.join(', ')}`));
  }
  if (ambiguous.length) {
    console.log(`\nNiejednoznaczne dopasowania (top 20):`);
    ambiguous.slice(0, 20).forEach(m => console.log(`  webp#${m.webp_id} best=${m.best_dist} second=${m.second_dist} (margines ${m.margin}) -> ${m.best_jpg}`));
  }

  const report = {
    generated_at: new Date().toISOString(),
    gallery_id: GALLERY_ID,
    jpg_dir: JPG_DIR,
    counts: {
      webp_db: photos.length,
      jpg_disk: jpgFiles.length,
      strong: strong.length,
      weak: weak.length,
      none: none.length,
      ambiguous: ambiguous.length,
      dup_jpg: dupJpg.length,
      unused_jpg: unusedJpg.length,
      webp_download_errors: webpBad.length,
      jpg_read_errors: jpgBad.length,
    },
    thresholds: { STRONG, WEAK },
    matches,
    unused_jpg: unusedJpg,
    dup_jpg: dupJpg.map(([name, ids]) => ({ jpg: name, webp_ids: ids })),
    webp_download_errors: webpBad.map(w => ({ id: w.id, url: w.url, error: w.error })),
    jpg_read_errors: jpgBad.map(j => ({ name: j.name, error: j.error })),
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nPełny raport zapisany: ${OUT_JSON}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('BŁĄD:', e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
