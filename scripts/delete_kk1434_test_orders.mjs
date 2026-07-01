import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// BEZPIECZEŃSTWO: usuwamy tylko NIEOPŁACONE zamówienia uczestnika 71 (KK-1434).
const participantId = 71;
const toDelete = await prisma.photoOrder.findMany({
  where: {
    participant_id: participantId,
    payment_status: { in: ['pending', 'failed', 'cancelled'] },
  },
  select: { id: true, payment_status: true, total_amount: true },
  orderBy: { id: 'asc' },
});

console.log('Do usunięcia (nieopłacone):');
toDelete.forEach(o => console.log(`  #${o.id} status=${o.payment_status} kwota=${o.total_amount}`));

// Dodatkowe zabezpieczenie: NIE dotykamy niczego opłaconego.
const paid = await prisma.photoOrder.count({
  where: { participant_id: participantId, payment_status: { in: ['paid', 'completed'] } },
});
console.log(`Opłaconych (zachowane): ${paid}`);

const ids = toDelete.map(o => o.id);
if (ids.length > 0) {
  const result = await prisma.photoOrder.deleteMany({
    where: { id: { in: ids }, participant_id: participantId, payment_status: { in: ['pending', 'failed', 'cancelled'] } },
  });
  console.log(`\nUSUNIĘTO: ${result.count} zamówień.`);
} else {
  console.log('\nBrak zamówień do usunięcia.');
}

await prisma.$disconnect();
