// READ-ONLY: skan calej bazy pod katem wsadowo wpisanych wyborow (recznie z maila).
// Sygnal: >=2 wybory tego samego uczestnika z IDENTYCZNYM selected_at (co do ms)
// = wpis wsadowy (nie klikanie po kolei). Zwraca liste osob do sprawdzenia w poczcie.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const participants = await prisma.galleryParticipant.findMany({
    include: {
      selections: { select: { id: true, selected_at: true }, orderBy: { selected_at: 'asc' } },
    },
    orderBy: { id: 'asc' },
  });

  const flagged = [];
  for (const p of participants) {
    if (p.selections.length < 2) continue;
    // grupuj po timestampie (ms)
    const byTs = new Map();
    for (const s of p.selections) {
      const key = new Date(s.selected_at).toISOString();
      byTs.set(key, (byTs.get(key) || 0) + 1);
    }
    // najwiekszy klaster identycznych timestampow
    let maxCluster = 0, clusterTs = null;
    for (const [ts, n] of byTs.entries()) {
      if (n > maxCluster) { maxCluster = n; clusterTs = ts; }
    }
    const distinctTs = byTs.size;
    const total = p.selections.length;
    // FLAG: wiekszosc wyborow ma ten sam ms LUB wszystkie w 1 klastrze
    const suspicious = maxCluster >= 2 && (maxCluster === total || distinctTs <= Math.ceil(total / 2));
    if (suspicious) {
      flagged.push({
        id: p.id,
        gallery_id: p.gallery_id,
        name: p.parent_name,
        ident: p.parent_identifier,
        email: p.parent_email,
        total,
        cluster: maxCluster,
        distinctTs,
        clusterTs,
      });
    }
  }

  console.log(`\nUczestnicy z wyborami wpisanymi WSADOWO (podejrzenie: podane mailem):\n`);
  if (flagged.length === 0) {
    console.log('  Brak — wszyscy klikali normalnie.');
  } else {
    flagged.forEach((f) => {
      console.log(`  gal=${f.gallery_id} ID=${f.id} ${f.name} (${f.ident})`);
      console.log(`     email=${f.email || 'BRAK'}`);
      console.log(`     wyborow=${f.total}, w jednym klastrze=${f.cluster}, roznych timestampow=${f.distinctTs}, ts=${f.clusterTs}`);
    });
  }
  console.log(`\nRazem oznaczonych: ${flagged.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
