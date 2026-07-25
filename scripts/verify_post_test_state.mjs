import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const recentLogs = await prisma.systemLog.findMany({
  where: {
    module: { in: ['BASKET', 'PAYMENT'] },
    created_at: { gte: new Date(Date.now() - 10 * 60 * 1000) },
    OR: [
      { message: 'GROUP_EXTRA_PURCHASE_ORDER_CREATED' },
      { message: 'GROUP_EXTRA_PURCHASE_PAYU_INIT' },
    ],
  },
  orderBy: { created_at: 'desc' },
  take: 8,
  select: { created_at: true, message: true, metadata: true },
});

console.log('Recent purchase logs:');
for (const l of recentLogs) {
  let m = null;
  try { m = l.metadata ? JSON.parse(l.metadata) : null; } catch {}
  console.log(new Date(l.created_at).toLocaleTimeString('pl-PL'), l.message, {
    participant_id: m?.participant_id,
    order_id: m?.order_id,
    photo_count: m?.photo_count,
    total_amount: m?.total_amount,
  });
}

const leftovers = await prisma.photoOrder.findMany({
  where: {
    participant_id: 71,
    payment_status: { in: ['pending', 'failed', 'cancelled'] },
    created_at: { gte: new Date(Date.now() - 60 * 60 * 1000) },
  },
  select: { id: true, payment_status: true, total_amount: true, created_at: true },
  orderBy: { created_at: 'desc' },
});

console.log('\nLeftover non-paid recent orders for participant 71:', leftovers.length);
for (const o of leftovers) {
  console.log(`#${o.id} ${o.payment_status} ${(o.total_amount / 100).toFixed(2)}zl ${new Date(o.created_at).toLocaleTimeString('pl-PL')}`);
}

await prisma.$disconnect();
