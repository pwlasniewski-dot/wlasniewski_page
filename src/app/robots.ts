import { MetadataRoute } from 'next';
import { headers } from 'next/headers';

const PRIVATE_B2C_PREFIXES = [
    '/admin',
    '/api',
    '/galeria',
    '/strefa-klienta',
    '/konto',
    '/panel-fotografa',
    '/logowanie',
    '/rejestracja',
    '/checkout',
    '/invite',
    '/foto-wyzwanie/invite',
    '/foto-match/profil',
    '/foto-match/onboarding',
    '/karta-podarunkowa/dostep',
];

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
                    disallow: ['/admin', '/api'],
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
                // Prefixes intentionally have no trailing slash so the exact
                // route and every nested route are covered by the same rule.
                disallow: PRIVATE_B2C_PREFIXES,
            },
        ],
        sitemap: ['https://wlasniewski.pl/sitemap.xml'],
    };
}
