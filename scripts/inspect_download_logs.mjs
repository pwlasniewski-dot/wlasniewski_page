import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const logs = await prisma.systemLog.findMany({
  where: { module: 'BASKET', message: { contains: 'DOWNLOAD_ALL' } },
  orderBy: { created_at: 'desc' },
  take: 15,
  select: { created_at: true, message: true, metadata: true },
});

for (const l of logs) {
  const t = new Date(l.created_at).toLocaleTimeString('pl-PL');
  console.log(`\n${t} ${l.message}`);
  if (l.metadata) {
    try { console.log('   ', JSON.parse(l.metadata)); }
    catch { console.log('   ', l.metadata); }
  }
}
await prisma.$disconnect();
