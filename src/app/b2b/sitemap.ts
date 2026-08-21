import type { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';
import { AERO_SITE, getAeroPageDefinition } from '@/lib/aeroanaliza/content';
import { getAeroCmsLastModified, getSitemapAeroSlugs, type AeroCmsPublicationState } from '@/lib/aeroanaliza/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const releaseDate = new Date('2026-08-21T00:00:00.000Z');
    let cmsPages: AeroCmsPublicationState[] | null = null;
    try {
        cmsPages = await prisma.page.findMany({
            where: { page_type: 'b2b' },
            select: { slug: true, updated_at: true, is_published: true },
        });
    } catch (error) {
        console.error('[aeroanaliza] Sitemap uses release dates because CMS is unavailable', error);
    }

    return getSitemapAeroSlugs(cmsPages).map(slug => {
        const definition = getAeroPageDefinition(slug)!;
        return {
            url: `${AERO_SITE.url}${slug ? `/${slug}` : ''}`,
            lastModified: cmsPages ? getAeroCmsLastModified(slug, cmsPages) || releaseDate : releaseDate,
            changeFrequency: definition.changeFrequency,
            priority: definition.priority,
        };
    });
}
