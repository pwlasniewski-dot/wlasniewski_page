import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const gals = await prisma.clientGallery.findMany({
  select: { id: true, client_name: true, client_email: true, group_access_code: true, description: true, _count: { select: { photos: true, participants: true } } },
  orderBy: { id: 'asc' },
});
for (const g of gals) {
  console.log(`#${g.id} code=${g.group_access_code} photos=${g._count.photos} participants=${g._count.participants} client="${g.client_name}" email=${g.client_email} desc="${g.description || ''}"`);
}
await prisma.$disconnect();
