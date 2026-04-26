import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import prisma from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const headersList = await headers();
    const host = headersList.get('host') || 'wlasniewski.pl';
    const isB2B = host.includes('aeroanaliza');

    // ─── B2B Sitemap ───
    if (isB2B) {
        const b2bBase = 'https://aeroanaliza.pl';
        const b2bStaticPages = ['', '/dron', '/termowizja', '/monitoring'];

        let dbPages: Array<{ slug: string; updated_at: Date }> = [];
        try {
            dbPages = await prisma.page.findMany({
                where: { is_published: true, slug: { startsWith: 'b2b' } },
                select: { slug: true, updated_at: true }
            });
        } catch (error) {
            console.error('[sitemap-b2b] Failed to load dynamic entries:', error);
        }

        return [
            ...b2bStaticPages.map(route => ({
                url: `${b2bBase}${route}`,
                lastModified: new Date(),
                changeFrequency: 'monthly' as const,
                priority: route === '' ? 1.0 : 0.8,
            })),
            ...dbPages.map(page => ({
                url: `${b2bBase}/${page.slug.replace(/^b2b\/?/, '')}`,
                lastModified: page.updated_at,
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            })),
        ];
    }

    // ─── B2C Sitemap ───
    const b2cBase = 'https://wlasniewski.pl';

    // B2C Static pages
    const staticPages = [
        '',
        '/o-mnie',
        '/jak-sie-ubrac',
        '/rezerwacja',
        '/portfolio',
        '/blog',
        '/foto-wyzwanie',
        '/regulamin',
        '/polityka-prywatnosci',
        '/reklamacje',
    ];

    // City SEO landing pages — priority 1.0 for local SEO
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

    let dbPages: Array<{ slug: string; updated_at: Date }> = [];
    let portfolioSessions: Array<{ slug: string; category: string; updated_at: Date }> = [];
    let blogPosts: Array<{ slug: string; updated_at: Date }> = [];
    let nphotoAlbums: Array<{ slug: string; updated_at: Date }> = [];

    try {
        dbPages = await prisma.page.findMany({
            where: { is_published: true, NOT: { slug: { startsWith: 'b2b' } } },
            select: { slug: true, updated_at: true }
        });

        portfolioSessions = await prisma.portfolioSession.findMany({
            where: { is_published: true },
            select: { slug: true, category: true, updated_at: true }
        });

        blogPosts = await prisma.blogPost.findMany({
            select: { slug: true, updated_at: true }
        });

        nphotoAlbums = await prisma.nphotoAlbum.findMany({
            where: { is_active: true },
            select: { slug: true, updated_at: true }
        });
    } catch (error) {
        console.error('[sitemap] Failed to load dynamic entries:', error);
    }

    const sitemap: MetadataRoute.Sitemap = [
        // ─── B2C: Static pages ───
        ...staticPages.map(route => ({
            url: `${b2cBase}${route}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: route === '' ? 1.0 : 0.8,
        })),

        // ─── B2C: City SEO Landing Pages (highest priority for local SEO) ───
        ...cityPages.map(route => ({
            url: `${b2cBase}${route}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.95,
        })),

        // ─── B2C: Dynamic pages from database ───
        ...dbPages.filter(page => !page.slug.startsWith('fotograf-')).map(page => ({
            url: `${b2cBase}/${page.slug}`,
            lastModified: page.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),

        // ─── B2C: Portfolio sessions ───
        ...portfolioSessions.map(session => ({
            url: `${b2cBase}/portfolio/${session.category}/${session.slug}`,
            lastModified: session.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),

        // ─── B2C: Blog posts ───
        ...blogPosts.map(post => ({
            url: `${b2cBase}/blog/${post.slug}`,
            lastModified: post.updated_at,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        })),

        // ─── B2C: Albums catalog (SEO boost via product pages) ───
        {
            url: `${b2cBase}/sklep/albumy`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.85,
        },
        ...nphotoAlbums.map(album => ({
            url: `${b2cBase}/sklep/albumy/${album.slug}`,
            lastModified: album.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.75,
        })),
    ];

    return sitemap;
}
