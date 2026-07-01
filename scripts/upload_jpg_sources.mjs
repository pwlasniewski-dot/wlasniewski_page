// UPLOAD JPG DO S3 + ZAPIS MAPY DOPASOWANIA DO Setting (dla podstrony admina)
// - Wgrywa wszystkie JPG z folderu na S3 (additywnie, nie rusza webp ani rekordów).
// - Kategoryzuje dopasowania: correct / disputed / excess.
// - Zapisuje manifest jako JSON w Setting.setting_key = `jpg_mapping_<galleryId>`.
//
// Uruchomienie:
//   node scripts/upload_jpg_sources.mjs
//
// Zmienne opcjonalne: GALLERY_ID (19), JPG_DIR

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const GALLERY_ID = parseInt(process.env.GALLERY_ID || '19', 10);
const JPG_DIR = process.env.JPG_DIR ||
  'D:\\Sony A7 III\\Klasa 1 Torun\\Pierwsza Komunia Swięta Szkoła Seslezjańska Klasa C 30.05.2026';
const AUDIT_JSON = path.join(process.cwd(), 'scripts', `audit_result_${GALLERY_ID}.json`);
const WEAK = 12; // powyżej = sporne
const UPLOAD_CONCURRENCY = 6;
// excess (do usunięcia) TYLKO gdy jawnie włączone — dla galerii z testowymi śmieciami.
// Domyślnie duplikaty/kolizje trafiają do 'disputed' (nic nie kasujemy automatycznie).
const MARK_EXCESS = process.env.MARK_EXCESS === '1';

const BUCKET = process.env.S3_BUCKET || 'wlasniewski-photo-storage';
const REGION = process.env.S3_REGION || 'eu-north-1';
const accessKeyId = (process.env.MY_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '').trim();
const secretAccessKey = (process.env.MY_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '').trim();

const prisma = new PrismaClient();
const s3 = new S3Client({ region: REGION, credentials: { accessKeyId, secretAccessKey } });

function safeKeyName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-');
}

async function uploadJpg(localName) {
  const key = `gallery-jpg-sources/gallery-${GALLERY_ID}/${safeKeyName(localName)}`;
  const body = fs.readFileSync(path.join(JPG_DIR, localName));
  const up = new Upload({
    client: s3,
    params: { Bucket: BUCKET, Key: key, Body: body, ContentType: 'image/jpeg' },
    partSize: 5 * 1024 * 1024,
    queueSize: 4,
  });
  await up.done();
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${encodedKey}`;
}

async function mapPool(items, concurrency, worker) {
  const out = new Array(items.length);
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, run));
  return out;
}

async function main() {
  if (!accessKeyId || !secretAccessKey) {
    console.error('BŁĄD: brak AWS credentials w env.');
    process.exit(1);
  }
  if (!fs.existsSync(AUDIT_JSON)) {
    console.error(`BŁĄD: brak ${AUDIT_JSON}. Najpierw uruchom audit_jpg_match.mjs`);
    process.exit(1);
  }
  const audit = JSON.parse(fs.readFileSync(AUDIT_JSON, 'utf8'));

  // 1) Rekordy webp z bazy (do miniatur)
  const photos = await prisma.galleryPhoto.findMany({
    where: { gallery_id: GALLERY_ID },
    select: { id: true, file_url: true, thumbnail_url: true, order_index: true },
  });
  const photoById = new Map(photos.map(p => [p.id, p]));

  // 2) Upload WSZYSTKICH JPG z folderu
  const jpgFiles = fs.readdirSync(JPG_DIR).filter(f => /\.(jpe?g)$/i.test(f)).sort();
  console.log(`Wgrywam ${jpgFiles.length} plików JPG na S3...`);
  let done = 0;
  const urls = await mapPool(jpgFiles, UPLOAD_CONCURRENCY, async (name) => {
    const url = await uploadJpg(name);
    done++;
    if (done % 25 === 0) console.log(`  ...${done}/${jpgFiles.length}`);
    return { name, url };
  });
  const jpgUrlByName = new Map(urls.map(u => [u.name, u.url]));
  console.log(`Upload zakończony: ${urls.length} plików.`);

  // 3) Kategoryzacja: grupuj po best_jpg; najniższe webp_id = primary, reszta = excess.
  const byJpg = new Map();
  for (const m of audit.matches) {
    if (!byJpg.has(m.best_jpg)) byJpg.set(m.best_jpg, []);
    byJpg.get(m.best_jpg).push(m);
  }
  for (const arr of byJpg.values()) arr.sort((a, b) => a.webp_id - b.webp_id);

  const items = audit.matches.map((m) => {
    const group = byJpg.get(m.best_jpg);
    const isPrimary = group[0].webp_id === m.webp_id;
    const shared = group.length > 1;
    let category;
    if (!isPrimary) category = MARK_EXCESS ? 'excess' : 'disputed';
    else if (m.best_dist > WEAK || m.margin < 3 || shared) category = 'disputed';
    else category = 'correct';
    const ph = photoById.get(m.webp_id);
    return {
      webp_id: m.webp_id,
      order_index: ph?.order_index ?? m.order_index,
      webp_thumb: ph?.thumbnail_url || ph?.file_url || null,
      webp_full: ph?.file_url || null,
      jpg_name: m.best_jpg,
      jpg_url: jpgUrlByName.get(m.best_jpg) || null,
      dist: m.best_dist,
      margin: m.margin,
      category,
    };
  }).sort((a, b) => a.order_index - b.order_index);

  const summary = {
    correct: items.filter(i => i.category === 'correct').length,
    disputed: items.filter(i => i.category === 'disputed').length,
    excess: items.filter(i => i.category === 'excess').length,
  };

  const manifest = {
    generated_at: new Date().toISOString(),
    gallery_id: GALLERY_ID,
    jpg_dir: JPG_DIR,
    jpg_count: jpgFiles.length,
    webp_count: photos.length,
    summary,
    all_jpg_urls: Object.fromEntries(jpgUrlByName),
    items,
  };

  // 4) Zapis do Setting (upsert)
  const key = `jpg_mapping_${GALLERY_ID}`;
  await prisma.setting.upsert({
    where: { setting_key: key },
    create: { setting_key: key, setting_value: JSON.stringify(manifest) },
    update: { setting_value: JSON.stringify(manifest) },
  });

  console.log(`\n=== GOTOWE ===`);
  console.log(`Setting: ${key}`);
  console.log(`Prawidłowe: ${summary.correct}, Sporne: ${summary.disputed}, Nadmiarowe: ${summary.excess}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('BŁĄD:', e);
  try { await prisma.$disconnect(); } catch {}
  process.exit(1);
});
