// READ-ONLY: wszyscy uczestnicy galerii 20 + email, logowanie, liczba wyborów.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const GID = 20;

async function main() {
  const parts = await prisma.galleryParticipant.findMany({
    where: { gallery_id: GID },
    include: { _count: { select: { selections: true } } },
    orderBy: { id: 'asc' },
  });
  console.log(`Uczestników w galerii 20: ${parts.length}\n`);
  for (const p of parts) {
    const login = p.first_login_at ? new Date(p.first_login_at).toISOString() : '—';
    const mark = /kierys/i.test(`${p.name} ${p.parent_name} ${p.parent_email} ${p.notes}`) ? '  <<< KIERYS?' : '';
    console.log(`#${p.id} | ${p.name} | email=${p.parent_email || '—'} | wyborów=${p._count.selections} | 1sze logow.=${login} | kod=${p.participant_code || '—'}${mark}`);
  }

  console.log('\n--- Szukam po e-mailu magdalenakierys@onet.pl w CAŁEJ bazie uczestników ---');
  const byEmail = await prisma.galleryParticipant.findMany({
    where: { parent_email: { contains: 'kierys', mode: 'insensitive' } },
    select: { id: true, gallery_id: true, name: true, parent_email: true },
  });
  console.log(JSON.stringify(byEmail, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
