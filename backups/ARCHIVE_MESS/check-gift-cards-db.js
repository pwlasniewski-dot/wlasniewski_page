const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const cards = await prisma.giftCard.findMany({
    where: {
      status: { in: ['active', 'available', 'sent'] }
    },
    select: {
      id: true,
      code: true,
      value: true,
      amount: true,
      theme: true,
      status: true
    },
    take: 10
  });

  console.log('Gift Cards in DB:');
  console.log(JSON.stringify(cards, null, 2));
  console.log(`\nTotal: ${cards.length} cards`);
}

main().catch(console.error).finally(() => process.exit(0));
