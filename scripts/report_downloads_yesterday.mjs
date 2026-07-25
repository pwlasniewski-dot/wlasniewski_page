import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const start = new Date('2026-07-09T00:00:00+02:00');
const end = new Date('2026-07-10T00:00:00+02:00');

const logs = await prisma.systemLog.findMany({
  where: {
    module: 'BASKET',
    message: { contains: 'DOWNLOAD' },
    created_at: { gte: start, lt: end },
  },
  orderBy: { created_at: 'asc' },
  select: {
    created_at: true,
    message: true,
    metadata: true,
  },
});

const counters = new Map();
const byParticipant = new Map();
const problematic = [];

for (const l of logs) {
  counters.set(l.message, (counters.get(l.message) || 0) + 1);

  let meta = null;
  try { meta = l.metadata ? JSON.parse(l.metadata) : null; } catch {}

  const pid = meta?.participant_id ?? 'n/a';
  byParticipant.set(pid, (byParticipant.get(pid) || 0) + 1);

  const looksProblem =
    l.message.includes('BLOCKED') ||
    l.message.includes('FORBIDDEN') ||
    l.message.includes('INVALID') ||
    l.message.includes('NO_TOKEN') ||
    l.message.includes('EXPIRED') ||
    l.message.includes('EMPTY') ||
    (typeof meta?.failed_photo_count === 'number' && meta.failed_photo_count > 0);

  if (looksProblem) {
    problematic.push({ created_at: l.created_at, message: l.message, meta });
  }
}

console.log(`Zakres: ${start.toISOString()} -> ${end.toISOString()}`);
console.log(`Wszystkie logi DOWNLOAD: ${logs.length}`);
console.log('\nLiczniki zdarzen:');
for (const [msg, n] of [...counters.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`- ${msg}: ${n}`);
}

console.log('\nAktywnosc per participant_id:');
for (const [pid, n] of [...byParticipant.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12)) {
  console.log(`- participant ${pid}: ${n}`);
}

console.log(`\nWykryte potencjalne problemy: ${problematic.length}`);
for (const p of problematic.slice(0, 30)) {
  const t = new Date(p.created_at).toLocaleString('pl-PL');
  const gal = p.meta?.gallery_id ?? 'n/a';
  const pid = p.meta?.participant_id ?? 'n/a';
  const failed = p.meta?.failed_photo_count;
  const added = p.meta?.added_photo_count;
  console.log(`- ${t} | ${p.message} | gal=${gal} pid=${pid} added=${added ?? '-'} failed=${failed ?? '-'}`);
}

// Dodatkowo: sukcesy full-download i ewentualne failed_photo_count
const fullSuccess = logs
  .map((l) => {
    let meta = null;
    try { meta = l.metadata ? JSON.parse(l.metadata) : null; } catch {}
    return { message: l.message, meta, created_at: l.created_at };
  })
  .filter((x) => x.message === 'GROUP_DOWNLOAD_ALL_SUCCESS');

const fullWithFails = fullSuccess.filter((x) => (x.meta?.failed_photo_count || 0) > 0);
console.log(`\nGROUP_DOWNLOAD_ALL_SUCCESS: ${fullSuccess.length}`);
console.log(`GROUP_DOWNLOAD_ALL_SUCCESS z failed_photo_count>0: ${fullWithFails.length}`);

await prisma.$disconnect();
