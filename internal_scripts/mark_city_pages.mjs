import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const result = await p.page.updateMany({
  where: { slug: { startsWith: 'fotograf-' } },
  data: { page_type: 'city_landing' },
});
console.log('Updated:', result.count);
await p.$disconnect();
