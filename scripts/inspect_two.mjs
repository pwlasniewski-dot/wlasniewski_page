// READ-ONLY: wybory Maciej Afanasjew (ID=42) + Iwona (ID=29) porownanie
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  for (const pid of [29, 42]) {
    const p = await prisma.galleryParticipant.findUnique({
      where: { id: pid },
      include: { selections: { include: { photo: { select: { id: true, file_url: true } } }, orderBy: { selected_at: 'asc' } } },
    });
    console.log(`\n=== ID=${pid} ${p.parent_name} (${p.parent_identifier}) email=${p.parent_email} created=${p.created_at?.toISOString?.()}`);
    p.selections.forEach((s,i)=>{
      const f=(s.photo?.file_url||'').split('/').pop();
      console.log(`  ${i+1}. photo_id=${s.photo?.id} sel_id=${s.id} at=${new Date(s.selected_at).toISOString()} | ${f}`);
    });
  }
}
main().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
