import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// Sesja rodzinna - SEO landing page (currently has personal "Sesja rodzinna Agi")
await p.page.update({
  where: { id: 8 },
  data: {
    title: 'Sesje rodzinne Toruń',
    meta_title: 'Sesja Rodzinna Toruń | Naturalne Zdjęcia Rodzinne — Przemysław Właśniewski',
    meta_description: 'Naturalne sesje rodzinne w Toruniu i okolicach. Plener, dom, studio. Zdjęcia pełne emocji bez sztywnego pozowania. Sprawdź ofertę i zarezerwuj termin.',
    meta_keywords: 'sesja rodzinna toruń, fotograf rodzinny toruń, zdjęcia rodzinne toruń, sesja w plenerze, fotograf rodzin grudziądz',
  },
});

// Fotograf Toruń - tighten meta
await p.page.update({
  where: { id: 113 },
  data: {
    title: 'Fotograf Toruń',
    meta_title: 'Fotograf Toruń — Sesje Rodzinne, Ślubne i Biznesowe | Przemysław Właśniewski',
    meta_description: 'Fotograf z Torunia. Naturalne sesje rodzinne, ślubne, komunijne i biznesowe. Plener i studio. Reportaż bez pozowania. Sprawdź portfolio i zarezerwuj sesję.',
  },
});

const after = await p.page.findMany({
  where: { id: { in: [8, 113] } },
  select: { id: true, slug: true, title: true, meta_title: true },
});
console.log(after);
await p.$disconnect();
