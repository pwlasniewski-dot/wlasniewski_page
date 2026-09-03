export const PHOTOGRAPHY_SITE_ORIGIN = 'https://wlasniewski.pl';

/**
 * Build an absolute canonical URL for the photography sitemap.
 * URL normalisation percent-encodes unsafe characters and always keeps
 * the canonical HTTPS apex host.
 */
export function photographySitemapUrl(path = '/'): string {
    const normalisedPath = path === ''
        ? '/'
        : path.startsWith('/')
            ? path
            : `/${path}`;

    return new URL(normalisedPath, `${PHOTOGRAPHY_SITE_ORIGIN}/`).toString();
}

/**
 * Dynamic database values are path segments, not complete paths.
 * Encoding each segment prevents spaces, slashes and reserved characters
 * from creating malformed or ambiguous sitemap entries.
 */
export function sitemapPathSegment(value: string): string {
    return encodeURIComponent(value.trim());
}

export function portfolioSessionSitemapUrl(category: string, slug: string): string {
    return photographySitemapUrl(
        `/portfolio/${sitemapPathSegment(category)}/${sitemapPathSegment(slug)}`,
    );
}
