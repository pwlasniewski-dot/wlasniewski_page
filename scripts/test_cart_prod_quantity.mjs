import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Uczestnik testowy z wcześniejszych sesji (KK-1434, galeria 19)
const PARTICIPANT_ID = 71;
const GALLERY_ID = 19;
const PARENT_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJwYXJ0aWNpcGFudF9pZCI6NzEsImdhbGxlcnlfaWQiOjE5LCJwYXJlbnRfaWRlbnRpZmllciI6IktLLTE0MzQiLCJpYXQiOjE3ODI5MjQ1NjMsImV4cCI6MTc4NTUxNjU2M30.2SHMbppH0q6jDKw8PB47Wd8hRVZ_vnMZ1q9dSUDs5gU';

const photo = await prisma.galleryPhoto.findFirst({
  where: { gallery_id: GALLERY_ID },
  select: { id: true },
  orderBy: { id: 'asc' },
});

if (!photo) {
  throw new Error('Brak zdjęć testowych w galerii 19');
}

const payload = {
  order_lines: [
    { photo_id: photo.id, print_size: '10x15', quantity: 2 },
    { photo_id: photo.id, print_size: '15x21', quantity: 1 },
  ],
};

console.log('REQUEST payload:', payload);

const res = await fetch(`https://wlasniewski.pl/api/galleries/group/participant/${PARTICIPANT_ID}/purchase-extras`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${PARENT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

const json = await res.json();
console.log('\nHTTP', res.status);
console.log('RESPONSE success:', json?.success);
console.log('RESPONSE order summary:', {
  id: json?.order?.id,
  photo_count: json?.order?.photo_count,
  total_amount: json?.order?.total_amount,
  payment_status: json?.order?.payment_status,
  has_payment_url: !!json?.paymentUrl,
});
console.log('RESPONSE lines:', json?.order?.order_lines || []);

let createdOrderId = json?.order?.id;
if (createdOrderId) {
  const row = await prisma.photoOrder.findUnique({
    where: { id: createdOrderId },
    select: { id: true, participant_id: true, gallery_id: true, photo_count: true, total_amount: true, payment_status: true, product_ids: true },
  });

  console.log('\nDB order row:', row);

  // Cleanup: usuwamy tylko nieopłacone testowe zamówienie
  if (row && ['pending', 'failed', 'cancelled'].includes(row.payment_status)) {
    const del = await prisma.photoOrder.deleteMany({
      where: { id: row.id, participant_id: PARTICIPANT_ID, payment_status: { in: ['pending', 'failed', 'cancelled'] } },
    });
    console.log('CLEANUP deleted:', del.count);
  } else {
    console.log('CLEANUP skipped (order not pending/failed/cancelled)');
  }
}

await prisma.$disconnect();
