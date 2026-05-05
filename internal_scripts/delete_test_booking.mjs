import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const r = await prisma.booking.deleteMany({ where: { email: 'test.checkout@example.com' } });
console.log('Deleted:', r.count);
await prisma.$disconnect();
