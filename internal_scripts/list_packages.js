const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.challengePackage.findMany().then(r => {
  console.log('count', r.length);
  console.log(JSON.stringify(r, null, 2));
  return p.$disconnect();
});
