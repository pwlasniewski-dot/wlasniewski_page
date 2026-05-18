import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const emailLogs = await prisma.systemLog.findMany({
    where: {
      created_at: { gte: since },
      OR: [
        { module: 'EMAIL' },
        { module: 'MARKETING_MODULE' },
        { module: 'LOCAL_SEO' },
      ],
    },
    orderBy: { created_at: 'desc' },
    take: 200,
    select: {
      id: true,
      level: true,
      module: true,
      message: true,
      metadata: true,
      created_at: true,
    },
  });

  const suspicious = emailLogs.filter((l) => {
    const msg = (l.message || '').toLowerCase();
    const md = JSON.stringify(l.metadata || {}).toLowerCase();
    return msg.includes('revolut') || msg.includes('kitchenbarstools') || md.includes('kitchenbarstools') || md.includes('revolut');
  });

  const lastMarketingActions = await prisma.marketingAction.findMany({
    orderBy: { created_at: 'desc' },
    take: 50,
    select: {
      id: true,
      client_name: true,
      action_type: true,
      notes: true,
      created_at: true,
    },
  });

  console.log('=== RECENT EMAIL/MARKETING LOGS (72h) ===');
  console.log('count:', emailLogs.length);
  for (const l of emailLogs.slice(0, 40)) {
    console.log(JSON.stringify({
      at: l.created_at,
      module: l.module,
      level: l.level,
      message: l.message,
      metadata: l.metadata,
    }));
  }

  console.log('\n=== SUSPICIOUS MATCHES ===');
  console.log('count:', suspicious.length);
  for (const l of suspicious) {
    console.log(JSON.stringify({
      at: l.created_at,
      module: l.module,
      level: l.level,
      message: l.message,
      metadata: l.metadata,
    }));
  }

  console.log('\n=== LAST MARKETING ACTIONS ===');
  for (const a of lastMarketingActions.slice(0, 20)) {
    console.log(JSON.stringify(a));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
