import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const home = await p.page.findUnique({
  where: { slug: 'strona-glowna' },
  select: { title: true, sections: true, home_sections: true },
});
const parse = (s) => { try { return JSON.parse(s); } catch { return null; } };
const sec = parse(home?.sections) || parse(home?.home_sections)?.sections || [];
console.log('Total sections:', Array.isArray(sec) ? sec.length : 'not array');
if (Array.isArray(sec)) {
  for (const s of sec.slice(0, 5)) {
    console.log('-', s.type, '| title=', (s.title || s.data?.title || '').slice(0, 60), '| image?', !!(s.image || s.data?.image));
  }
}
await p.$disconnect();
