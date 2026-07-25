// READ-ONLY: logi i analityka dla magdalenakierys@onet.pl / galerii 20
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const EMAIL = 'magdalenakierys@onet.pl';
const GID = 20;

async function main() {
  // systemLog
  try {
    const logs = await prisma.systemLog.findMany({
      where: { OR: [
        { message: { contains: 'kierys', mode: 'insensitive' } },
        { message: { contains: String(GID), mode: 'insensitive' } },
        { context: { string_contains: 'kierys' } },
      ] },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    console.log(`systemLog (pasujące): ${logs.length}`);
    for (const l of logs) console.log(` [${l.created_at?.toISOString?.()}] ${l.level} | ${l.message} | ctx=${JSON.stringify(l.context)?.slice(0,200)}`);
  } catch (e) { console.log('systemLog error:', e.message); }

  // analyticsEvent
  try {
    const evts = await prisma.analyticsEvent.findMany({
      where: { OR: [
        { email: { contains: 'kierys', mode: 'insensitive' } },
        { page: { contains: 'kierys', mode: 'insensitive' } },
        { metadata: { string_contains: 'kierys' } },
      ] },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    console.log(`\nanalyticsEvent (pasujące): ${evts.length}`);
    for (const e of evts) console.log(` [${e.created_at?.toISOString?.()}] ${e.event_type} | ${e.page} | email=${e.email} | meta=${JSON.stringify(e.metadata)?.slice(0,200)}`);
  } catch (e) { console.log('analyticsEvent error:', e.message); }

  // errorNote
  try {
    const notes = await prisma.errorNote.findMany({
      where: { OR: [
        { description: { contains: 'kierys', mode: 'insensitive' } },
        { description: { contains: 'galeri', mode: 'insensitive' } },
      ] },
      orderBy: { created_at: 'desc' },
      take: 20,
    });
    console.log(`\nerrorNote (pasujące): ${notes.length}`);
  } catch (e) { console.log('errorNote error:', e.message); }

  // raw SQL na historii/logu — historyPhoto
  try {
    const hp = await prisma.historyPhoto.findMany({
      where: { OR: [
        { user_email: { contains: 'kierys', mode: 'insensitive' } },
        { action: { contains: 'select', mode: 'insensitive' } },
      ] },
      take: 20,
      orderBy: { created_at: 'desc' },
    });
    console.log(`\nhistoryPhoto (select/kierys): ${hp.length}`);
    for (const h of hp) console.log(` [${h.created_at?.toISOString?.()}] ${h.action} | email=${h.user_email} | meta=${JSON.stringify(h)?.slice(0,200)}`);
  } catch (e) { console.log('historyPhoto error:', e.message); }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
