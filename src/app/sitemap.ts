import { MetadataRoute } from 'next';
import prisma from '@/lib/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const b2cBase = 'https://wlasniewski.pl';
    const b2bBase = 'https://aeroanaliza.pl';

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

    // B2B Static pages — URL-e z perspektywy aeroanaliza.pl (bez prefiksu /b2b/)
    // Middleware Next.js automatycznie przepisuje aeroanaliza.pl/* -> /b2b/* wewnętrznie
    const b2bStaticPages = [
        '',          // aeroanaliza.pl/
        '/dron',     // aeroanaliza.pl/dron
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
        console.error('[sitemap] Failed to load dynamic entries:', error);
    }

    // Separate B2B pages from B2C
    const b2cDbPages = dbPages.filter(p => !p.slug.startsWith('b2b'));
    const b2bDbPages = dbPages.filter(p => p.slug.startsWith('b2b'));

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
        ...b2cDbPages.filter(page => !page.slug.startsWith('fotograf-')).map(page => ({
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

        // ─── B2B: Static pages (aeroanaliza.pl) ───
        ...b2bStaticPages.map(route => ({
            url: `${b2bBase}${route}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: route === '' ? 1.0 : 0.8,
        })),

        // ─── B2B: Dynamic pages from database ───
        // Usuwamy prefiks 'b2b/' bo aeroanaliza.pl widzi strony bez tego prefiksu
        ...b2bDbPages.map(page => ({
            url: `${b2bBase}/${page.slug.replace(/^b2b\/?/, '')}`,
            lastModified: page.updated_at,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ];

    return sitemap;
}
