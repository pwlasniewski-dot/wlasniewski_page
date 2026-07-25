import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const start = new Date('2026-07-09T00:00:00+02:00');
const end = new Date('2026-07-10T00:00:00+02:00');

const logs = await prisma.systemLog.findMany({
  where: {
    module: 'BASKET',
    message: 'GROUP_DOWNLOAD_ALL_SUCCESS',
    created_at: { gte: start, lt: end },
  },
  orderBy: { created_at: 'asc' },
  select: { created_at: true, metadata: true },
});

for (const l of logs) {
  let meta = null;
  try { meta = l.metadata ? JSON.parse(l.metadata) : null; } catch {}
  const failed = meta?.failed_photo_count || 0;
  if (failed > 0) {
    console.log('---');
    console.log(new Date(l.created_at).toLocaleString('pl-PL'));
    console.log(JSON.stringify(meta, null, 2));
  }
}

await prisma.$disconnect();
