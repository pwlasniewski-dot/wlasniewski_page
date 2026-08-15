import 'server-only';
import { Prisma } from '@prisma/client';
import { b2bPublicPath, isB2bCmsPage } from '@/lib/sites/b2b-routing';

export type RegistryExecutor = Pick<Prisma.TransactionClient, '$executeRaw'>;

export async function preserveFirstPublication(
  db: RegistryExecutor,
  input: { siteHost: 'wlasniewski.pl' | 'aeroanaliza.pl'; path: string; publishedAt?: Date },
) {
  const publishedAt = input.publishedAt || new Date();
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "page_analytics_registry" ("site_host", "path", "first_published_at", "created_at", "updated_at")
    VALUES (${input.siteHost}, ${input.path}, ${publishedAt}, NOW(), NOW())
    ON CONFLICT ("site_host", "path") DO UPDATE SET
      "first_published_at" = CASE
        WHEN "page_analytics_registry"."first_published_at" IS NULL THEN EXCLUDED."first_published_at"
        ELSE LEAST("page_analytics_registry"."first_published_at", EXCLUDED."first_published_at")
      END,
      "updated_at" = NOW()
  `);
}

export function publicationRegistryIdentity(kind: 'page' | 'blog' | 'portfolio', data: { slug: string; category?: string; page_type?: string | null }) {
  if (kind === 'portfolio') return { siteHost: 'wlasniewski.pl' as const, path: `/portfolio/${encodeURIComponent(data.category || '')}/${encodeURIComponent(data.slug)}` };
  if (kind === 'blog') return { siteHost: 'wlasniewski.pl' as const, path: `/blog/${data.slug}` };
  const siteHost = isB2bCmsPage(data) ? 'aeroanaliza.pl' as const : 'wlasniewski.pl' as const;
  const path = ['home', 'strona-glowna'].includes(data.slug) ? '/' : siteHost === 'aeroanaliza.pl' ? b2bPublicPath(data.slug) : `/${data.slug}`;
  return { siteHost, path };
}
