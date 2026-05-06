import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const r = await p.booking.findFirst({
  where: { stripe_session_id: 'CART_1777995757512_CZ29V' },
  select: { id: true, client_name: true, email: true, phone: true, service: true, package: true, date: true, start_time: true, end_time: true, price: true, status: true },
});
console.log(JSON.stringify(r, null, 2));
await p.$disconnect();
