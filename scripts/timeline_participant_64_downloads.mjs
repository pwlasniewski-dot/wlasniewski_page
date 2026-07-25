import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const start = new Date('2026-07-09T00:00:00+02:00');
const end = new Date('2026-07-10T00:00:00+02:00');

const logs = await prisma.systemLog.findMany({
  where: {
    module: 'BASKET',
    message: { in: ['GROUP_DOWNLOAD_ALL_SUCCESS', 'GROUP_DOWNLOAD_SINGLE_SUCCESS'] },
    created_at: { gte: start, lt: end },
    metadata: { contains: '"participant_id":64' },
  },
  orderBy: { created_at: 'asc' },
  select: { created_at: true, message: true, metadata: true },
});

let prev = null;
for (const l of logs) {
  let m = null;
  try { m = l.metadata ? JSON.parse(l.metadata) : null; } catch {}
  const ts = new Date(l.created_at);
  const t = ts.toLocaleTimeString('pl-PL');
  const delta = prev ? `${Math.round((ts - prev) / 1000)}s` : '-';
  const added = m?.added_photo_count ?? (l.message.includes('SINGLE') ? 1 : '-');
  const failed = m?.failed_photo_count ?? '-';
  const zip = m?.zip_name ?? '';
  console.log(`${t} | +${delta.padStart(4)} | ${l.message} | added=${added} failed=${failed} ${zip}`);
  prev = ts;
}

await prisma.$disconnect();
