// READ-ONLY: analiza timestampow wyborow w galerii 19
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.galleryParticipant.findMany({
    where: { gallery_id: 19 },
    include: { selections: { select: { photo_id: true, selected_at: true }, orderBy: { selected_at: 'asc' } } },
    orderBy: { id: 'asc' },
  });

  console.log(`Galeria 19: ${parts.length} uczestnikow\n`);
  for (const p of parts) {
    if (p.selections.length === 0) continue;
    const times = p.selections.map(s => new Date(s.selected_at).getTime());
    const uniq = new Set(times);
    const spanMs = Math.max(...times) - Math.min(...times);
    const flag = uniq.size === 1 && p.selections.length > 1 ? '  <<< WSZYSTKIE IDENTYCZNE' : '';
    const iso = new Date(Math.min(...times)).toISOString();
    console.log(`ID=${String(p.id).padStart(3)} | ${String(p.parent_identifier||'').padEnd(9)} | ${String(p.parent_name||'').padEnd(28)} | wyborow=${p.selections.length} | unikalnych_czasow=${uniq.size} | rozrzut=${(spanMs/1000).toFixed(1)}s | pierwszy=${iso}${flag}`);
  }
}
main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
