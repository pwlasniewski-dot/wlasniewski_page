import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const page = await p.page.findFirst({ where: { slug: 'fotograf-torun' }, select: { sections: true } });
const sec = JSON.parse(page.sections || '[]');
const hero = sec.find(s => s.type === 'hero_slider');
console.log('slides count:', hero?.data?.slides?.length);
console.log('first slide:', JSON.stringify(hero?.data?.slides?.[0], null, 2)?.slice(0, 600));
await p.$disconnect();
