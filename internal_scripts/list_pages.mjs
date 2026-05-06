import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const r = await p.page.findMany({ where: { is_published: true }, select: { slug: true, title: true }, orderBy: { slug: 'asc' } });
console.log(r.map(x => x.slug + ' | ' + x.title).join('\n'));
await p.$disconnect();
