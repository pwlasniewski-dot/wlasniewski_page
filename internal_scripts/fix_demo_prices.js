const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  await p.challengePackage.update({
    where: { id: 1 },
    data: { base_price: 1200, challenge_price: 790 },
  });
  await p.photoChallenge.update({
    where: { id: 1 },
    data: { paid_amount: 790, discount_amount: 410 },
  });
  console.log('FIXED');
  await p.$disconnect();
})();
