// READ-ONLY: mapuje wybory uczestnikow na NUMERY KADRU (order_index+1),
// tak jak widzi je rodzic, i porownuje z tym co przyszlo mailem.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const EMAIL_EXPECTED = {
  42: [52, 190, 279, 280, 82], // Maciej Afanasjew (mail 22.06)
  29: [37, 38, 198, 255, 264], // Iwona Zalewska (mail 23.06)
};

async function main() {
  for (const pid of [42, 29]) {
    const p = await prisma.galleryParticipant.findUnique({
      where: { id: pid },
      include: { selections: { include: { photo: { select: { id: true, file_url: true } } }, orderBy: { selected_at: 'asc' } } },
    });
    if (!p) { console.log(`ID=${pid} brak`); continue; }

    // mapa numeru kadru dla calej galerii
    const ordered = await prisma.galleryPhoto.findMany({
      where: { gallery_id: p.gallery_id },
      orderBy: { order_index: 'asc' },
      select: { id: true },
    });
    const frameMap = new Map();
    ordered.forEach((ph, idx) => frameMap.set(ph.id, idx + 1));

    const frames = p.selections.map((s) => frameMap.get(s.photo.id) ?? null);

    console.log(`\n=== ID=${pid} ${p.parent_name} (${p.parent_identifier}) gal=${p.gallery_id} — zdjec w galerii=${ordered.length}`);
    p.selections.forEach((s, i) => {
      const f = (s.photo?.file_url || '').split('/').pop();
      console.log(`  photo_id=${s.photo.id} => KADR #${frameMap.get(s.photo.id) ?? '?'}  | ${f}`);
    });

    const got = frames.filter((x) => x != null).sort((a, b) => a - b);
    console.log(`  Numery kadrow w bazie: [${got.join(', ')}]`);

    const expected = EMAIL_EXPECTED[pid];
    if (expected) {
      const exp = [...expected].sort((a, b) => a - b);
      console.log(`  Numery z MAILA:        [${exp.join(', ')}]`);
      const match = JSON.stringify(exp) === JSON.stringify(got);
      const missing = exp.filter((n) => !got.includes(n));
      const extra = got.filter((n) => !exp.includes(n));
      console.log(`  ZGODNE: ${match ? 'TAK ✅' : 'NIE ❌'}`);
      if (!match) {
        if (missing.length) console.log(`     brakuje z maila: [${missing.join(', ')}]`);
        if (extra.length) console.log(`     nadmiarowe w bazie: [${extra.join(', ')}]`);
      }
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
