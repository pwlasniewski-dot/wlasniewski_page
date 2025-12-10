#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const page = await prisma.page.findUnique({ where: { id: 147 } });
    console.log(JSON.stringify(page, null, 2));
  } catch (e) {
    console.error('Error fetching page 147:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
