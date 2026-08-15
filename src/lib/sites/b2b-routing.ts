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
    '/b2b/dron': 'https://aeroanaliza.pl/dron',
    '/b2b/termowizja': 'https://aeroanaliza.pl/termowizja',
    '/b2b/monitoring': 'https://aeroanaliza.pl/monitoring',
    '/dron': 'https://aeroanaliza.pl/dron',
    '/termowizja': 'https://aeroanaliza.pl/termowizja',
    '/monitoring': 'https://aeroanaliza.pl/monitoring',
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
