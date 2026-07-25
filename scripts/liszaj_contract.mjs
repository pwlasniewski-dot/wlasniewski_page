import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // znajdź klienta Oskara
  const client = await prisma.client.findFirst({
    where: { OR: [{ lastName: { contains: 'liszaj', mode: 'insensitive' } }, { email: { contains: 'liszaj', mode: 'insensitive' } }] },
    select: { id: true, firstName: true, lastName: true, email: true },
  });
  console.log('Klient:', client);
  if (!client) return;

  const contracts = await prisma.clientContract.findMany({
    where: { clientId: client.id },
  });
  console.log(`\nUmów: ${contracts.length}`);
  if (contracts.length) {
    const fields = Object.keys(contracts[0]);
    console.log('Pola umowy:', fields.join(', '));
    for (const c of contracts) {
      console.log('\n---');
      for (const k of fields) {
        const v = c[k];
        if (v !== null && v !== undefined && String(v).length < 300) console.log(`  ${k}: ${v}`);
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
