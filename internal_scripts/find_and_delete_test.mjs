import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const r = await p.booking.findMany({
  where: { email: 'test.checkout@example.com' },
  select: { id: true, client_name: true, date: true, start_time: true, end_time: true, status: true, created_at: true, stripe_session_id: true },
});
console.log('Found', r.length, 'bookings:');
console.log(JSON.stringify(r, null, 2));
const del = await p.booking.deleteMany({ where: { email: 'test.checkout@example.com' } });
console.log('Deleted:', del.count);
await p.$disconnect();
