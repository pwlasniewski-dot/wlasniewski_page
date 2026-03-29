import { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const b2bBase = 'https://aeroanaliza.pl';

    // B2B Static pages
    const b2bStaticPages = [
        '',          // aeroanaliza.pl/
        '/dron',     // aeroanaliza.pl/dron
    ];

    let dbPages: Array<{ slug: string; updated_at: Date }> = [];

    try {
        dbPages = await prisma.page.findMany({
            where: { is_published: true, slug: { startsWith: 'b2b' } },
            select: { slug: true, updated_at: true }
        });
    } catch (error) {
        console.error('[b2b-sitemap] Failed to load dynamic entries:', error);
    }

    const sitemap: MetadataRoute.Sitemap = [
        // B2B Static pages
        ...b2bStaticPages.map(route => ({
            url: `${b2bBase}${route}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: route === '' ? 1.0 : 0.8,
        })),

        // B2B Dynamic pages from database
        ...dbPages.map(page => ({
            url: `${b2bBase}/${page.slug.replace(/^b2b\/?/, '')}`,
            lastModified: page.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ];

    return sitemap;
}
