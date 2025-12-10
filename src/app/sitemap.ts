import { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://wlasniewski.pl';

    // Static pages
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

    // City pages
    const cityPages = [
        '/fotograf-torun',
        '/fotograf-grudziadz',
        '/fotograf-lisewo',
        '/fotograf-pluznica',
        '/fotograf-wabrzezno',
        '/fotograf-powiat-torunski',
        '/fotograf-powiat-wabrzeski',
    ];

    let dbPages: Array<{ slug: string; updated_at: Date }> = [];
    let portfolioSessions: Array<{ slug: string; category: string; updated_at: Date }> = [];
    let blogPosts: Array<{ slug: string; updated_at: Date }> = [];

    try {
        dbPages = await prisma.page.findMany({
            where: { is_published: true },
            select: { slug: true, updated_at: true }
        });

        portfolioSessions = await prisma.portfolioSession.findMany({
            where: { is_published: true },
            select: { slug: true, category: true, updated_at: true }
        });

        blogPosts = await prisma.blogPost.findMany({
            select: { slug: true, updated_at: true }
        });
    } catch (error) {
        console.error('[sitemap] Failed to load dynamic entries, returning static fallback:', error);
    }

    const sitemap: MetadataRoute.Sitemap = [
        // Static pages - highest priority
        ...staticPages.map(route => ({
            url: `${baseUrl}${route}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: route === '' ? 1.0 : 0.8,
        })),

        // City pages - high priority for local SEO
        ...cityPages.map(route => ({
            url: `${baseUrl}${route}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.9,
        })),

        // Dynamic pages from database
        ...dbPages.map(page => ({
            url: `${baseUrl}/${page.slug}`,
            lastModified: page.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),

        // Portfolio sessions
        ...portfolioSessions.map(session => ({
            url: `${baseUrl}/portfolio/${session.category}/${session.slug}`,
            lastModified: session.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        })),

        // Blog posts
        ...blogPosts.map(post => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.updated_at,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        })),
    ];

    return sitemap;
}
