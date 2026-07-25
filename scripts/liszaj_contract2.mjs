import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // ID: 111 widoczne na screenshocie -> User.id=111
  const user = await prisma.user.findUnique({ where: { id: 111 }, select: { id: true, name: true, email: true } });
  console.log('User 111:', user);

  // kontrakt powiązany z tym userem
  const contracts = await prisma.contract.findMany({ where: { client_id: 111 } });
  console.log(`Kontrakty: ${contracts.length}`);
  for (const c of contracts) {
    const fields = Object.keys(c);
    console.log('---');
    for (const k of fields) {
      if (c[k] !== null && c[k] !== undefined && String(c[k]).length < 400) console.log(`  ${k}: ${c[k]}`);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
