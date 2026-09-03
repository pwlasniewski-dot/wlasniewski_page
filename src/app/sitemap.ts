import { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';
import { isB2bCmsPage } from '@/lib/sites/b2b-routing';
import {
    photographySitemapUrl,
    portfolioSessionSitemapUrl,
    sitemapPathSegment,
} from '@/lib/seo/sitemapUrl';

// The photography sitemap is independent from request headers. Aeroanaliza.pl
// is rewritten by middleware to /b2b/sitemap.xml, which has its own generator.
// Keeping this route static/ISR prevents crawler entry requests from waiting on
// a fresh serverless runtime and live database connection on every request.
export const dynamic = 'force-static';
export const revalidate = 86_400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages = [
        '',
        '/o-mnie',
        '/sklep/poradnik-jak-sie-ubrac-i-pozowac',
        '/rezerwacja',
        '/portfolio',
        '/blog',
        '/kontakt',
        '/karta-podarunkowa',
        '/foto-wyzwanie',
        '/fotografia-z-drona',
    ];

    const cityPages = [
        '/fotograf-torun',
        '/fotograf-grudziadz',
        '/fotograf-chelmno',
        '/fotograf-wabrzezno',
        '/fotograf-bydgoszcz',
        '/fotograf-swiecie',
        '/fotograf-lisewo',
        '/fotograf-pluznica',
    ];

    let dbPages: Array<{ slug: string; page_type: string; updated_at: Date }> = [];
    let portfolioSessions: Array<{ slug: string; category: string; updated_at: Date }> = [];
    let blogPosts: Array<{ slug: string; updated_at: Date }> = [];
    let nphotoAlbums: Array<{ slug: string; updated_at: Date }> = [];
    let publicGuidePage: { page_type: string; is_published: boolean; updated_at: Date } | null = null;

    try {
        [dbPages, portfolioSessions, blogPosts, nphotoAlbums, publicGuidePage] = await Promise.all([
            prisma.page.findMany({
                where: {
                    is_published: true,
                    AND: [
                        { NOT: { slug: { startsWith: 'b2b' } } },
                        { NOT: { page_type: 'b2b' } },
                    ],
                },
                select: { slug: true, page_type: true, updated_at: true },
            }),
            prisma.portfolioSession.findMany({
                where: { is_published: true },
                select: { slug: true, category: true, updated_at: true },
            }),
            prisma.blogPost.findMany({
                where: {
                    status: 'published',
                    published_at: { lte: new Date() },
                },
                select: { slug: true, updated_at: true },
            }),
            prisma.nphotoAlbum.findMany({
                where: { is_active: true },
                select: { slug: true, updated_at: true },
            }),
            prisma.page.findUnique({
                where: { slug: 'jak-sie-ubrac' },
                select: { page_type: true, is_published: true, updated_at: true },
            }),
        ]);
    } catch (error) {
        // The static and city pages still produce a valid sitemap if the CMS is
        // temporarily unavailable during regeneration. A stale CDN copy remains
        // available while Next.js retries the next ISR regeneration.
        console.error('[sitemap] Failed to load dynamic entries:', error);
    }

    const excludedSlugs = new Set([
        '',
        'strona-glowna',
        'start',
        'kontakt-',
        'sklep',
        'regulamin',
        'polityka-prywatnosci',
        'reklamacje',
        'jak-sie-ubrac',
    ]);

    const entries: MetadataRoute.Sitemap = [
        ...staticPages.map(route => ({
            url: photographySitemapUrl(route),
            changeFrequency: 'monthly' as const,
            priority: route === '' ? 1.0 : 0.8,
        })),
        ...(!publicGuidePage || publicGuidePage.page_type !== 'public-guide' || publicGuidePage.is_published ? [{
            url: photographySitemapUrl('/jak-sie-ubrac'),
            lastModified: publicGuidePage?.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.85,
        }] : []),
        ...cityPages.map(route => ({
            url: photographySitemapUrl(route),
            changeFrequency: 'weekly' as const,
            priority: 0.95,
        })),
        ...dbPages
            .filter(page => (
                !isB2bCmsPage(page)
                && !page.slug.startsWith('fotograf-')
                && !excludedSlugs.has(page.slug)
            ))
            .map(page => ({
                url: photographySitemapUrl(`/${sitemapPathSegment(page.slug)}`),
                lastModified: page.updated_at,
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            })),
        ...portfolioSessions.map(session => ({
            url: portfolioSessionSitemapUrl(session.category, session.slug),
            lastModified: session.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),
        ...blogPosts.map(post => ({
            url: photographySitemapUrl(`/blog/${sitemapPathSegment(post.slug)}`),
            lastModified: post.updated_at,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        })),
        {
            url: photographySitemapUrl('/sklep/albumy'),
            changeFrequency: 'weekly' as const,
            priority: 0.85,
        },
        ...nphotoAlbums.map(album => ({
            url: photographySitemapUrl(`/sklep/albumy/${sitemapPathSegment(album.slug)}`),
            lastModified: album.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.75,
        })),
    ];

    return Array.from(
        new Map(entries.map(entry => [entry.url, entry] as const)).values(),
    );
}
