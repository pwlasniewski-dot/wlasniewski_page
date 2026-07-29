import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

export default async function robots(): Promise<MetadataRoute.Robots> {
    const headersList = await headers();
    const host = headersList.get('host') || 'wlasniewski.pl';
    const isB2B = host.includes('aeroanaliza');

    if (isB2B) {
        return {
            rules: [
                {
                    userAgent: '*',
                    allow: '/',
                    disallow: ['/admin/', '/api/'],
                },
            ],
            sitemap: ['https://aeroanaliza.pl/sitemap.xml'],
        };
    }

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/admin/',
                    '/api/',
                    '/galeria/',
                    '/strefa-klienta/',
                    '/konto/',
                    '/logowanie/',
                    '/rejestracja/',
                    '/checkout/',
                    '/invite/',
                ],
            },
        ],
        sitemap: ['https://wlasniewski.pl/sitemap.xml'],
    };
}
