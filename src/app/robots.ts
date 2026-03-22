import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin/', '/api/', '/galeria/*/'],
            },
        ],
        sitemap: [
            'https://wlasniewski.pl/sitemap.xml',
            'https://aeroanaliza.pl/sitemap.xml',
        ],
    };
}
