import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const slugs = ['fotograf-torun', 'sesja-rodzinna', 'fotograf-grudziadz', 'fotograf-bydgoszcz'];
for (const slug of slugs) {
  const r = await p.page.findFirst({
    where: { slug },
    select: { id: true, slug: true, title: true, meta_title: true, meta_description: true, is_published: true },
  });
  console.log(slug, '=>', r);
}
await p.$disconnect();
