import { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';
import { b2bPublicPath, isB2bCmsPage } from '@/lib/sites/b2b-routing';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const b2bBase = 'https://aeroanaliza.pl';

    // B2B Static pages
    const b2bStaticPages = [
        '',          // aeroanaliza.pl/
        '/dron',     // aeroanaliza.pl/dron
        '/termowizja',
        '/monitoring',
    ];

    let dbPages: Array<{ slug: string; page_type: string; updated_at: Date }> = [];

    try {
        const publishedPages = await prisma.page.findMany({
            where: { is_published: true },
            select: { slug: true, page_type: true, updated_at: true }
        });
        dbPages = publishedPages.filter(isB2bCmsPage);
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
            url: `${b2bBase}${b2bPublicPath(page.slug)}`,
            lastModified: page.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ];

    return Array.from(new Map(sitemap.map(entry => [entry.url, entry] as const)).values());
}
