const B2B_SLUG_PREFIXES = [
    'b2b',
    'dron',
    'termowizja',
    'monitoring',
    'inspekcja',
    'inspekcje',
    'ortofotomapa',
    'fotogrametria',
    'aeroanaliza',
] as const;

export const LEGACY_B2B_REDIRECTS: Readonly<Record<string, string>> = {
    '/b2b': 'https://aeroanaliza.pl/',
    '/b2b/dron': 'https://aeroanaliza.pl/',
    '/b2b/termowizja': 'https://aeroanaliza.pl/termowizja',
    '/b2b/monitoring': 'https://aeroanaliza.pl/monitoring',
    '/b2b/fotowoltaika': 'https://aeroanaliza.pl/inspekcja-fotowoltaiki-dronem',
    '/b2b/inspekcje': 'https://aeroanaliza.pl/inspekcja-dachu-dronem',
    '/dron': 'https://aeroanaliza.pl/',
    '/termowizja': 'https://aeroanaliza.pl/termowizja',
    '/monitoring': 'https://aeroanaliza.pl/monitoring',
    '/fotowoltaika': 'https://aeroanaliza.pl/inspekcja-fotowoltaiki-dronem',
    '/inspekcja-fotowoltaiki-dronem': 'https://aeroanaliza.pl/inspekcja-fotowoltaiki-dronem',
    '/inspekcja-dachu-dronem': 'https://aeroanaliza.pl/inspekcja-dachu-dronem',
};

export function isB2bCmsPage(page: { slug: string; page_type?: string | null }) {
    if (page.page_type?.toLowerCase() === 'b2b') return true;
    const slug = page.slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
    return B2B_SLUG_PREFIXES.some(prefix => (
        slug === prefix || slug.startsWith(`${prefix}-`) || slug.startsWith(`${prefix}/`)
    ));
}

export function b2bPublicPath(slug: string) {
    const normalized = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
        .replace(/^b2b(?:[/-])?/, '');
    return normalized ? `/${normalized}` : '/';
}
