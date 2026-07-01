import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Filtr: konkretny uczestnik (domyślnie 71 = Karolina KK-1434). Ustaw PID=all aby widzieć wszystkich.
const PID = process.env.PID ?? '71';
const KEEP = ['participant_id', 'gallery_id', 'order_id', 'photo_count', 'total_amount', 'print_size', 'parent_identifier'];

let lastSeen = new Date(Date.now() - 30 * 60 * 1000); // start: ostatnie 30 min

function fmtMeta(metadata) {
  if (!metadata) return '';
  try {
    const m = JSON.parse(metadata);
    const picked = KEEP.filter(k => m[k] !== undefined).map(k => `${k}=${m[k]}`).join(' ');
    return picked || JSON.stringify(m).slice(0, 120);
  } catch { return String(metadata).slice(0, 120); }
}

function matchesPid(metadata) {
  if (PID === 'all') return true;
  if (!metadata) return false;
  try { return String(JSON.parse(metadata).participant_id) === PID; } catch { return false; }
}

console.log(`\uD83D\uDD34 LIVE podglad zdarzen (uczestnik=${PID}). Ctrl+C aby zakonczyc.\n`);

async function poll() {
  try {
    const logs = await prisma.systemLog.findMany({
      where: {
        module: { in: ['BASKET', 'PAYMENT', 'CHECKOUT'] },
        created_at: { gt: lastSeen },
      },
      orderBy: { created_at: 'asc' },
      take: 50,
      select: { created_at: true, module: true, message: true, metadata: true },
    });
    for (const l of logs) {
      lastSeen = new Date(l.created_at);
      if (!matchesPid(l.metadata)) continue;
      const t = new Date(l.created_at).toLocaleTimeString('pl-PL');
      console.log(`${t} [${l.module}] ${l.message} ${fmtMeta(l.metadata)}`);
    }
  } catch (e) {
    console.error('blad odczytu:', e.message);
  }
}

await poll();
setInterval(poll, 5000);
