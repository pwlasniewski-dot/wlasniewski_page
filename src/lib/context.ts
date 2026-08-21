/**
 * Centralized utility to determine if the current request/page is in B2B context.
 */

export const B2B_DOMAINS = [
    'b2b.wlasniewski.pl',
    'dron.wlasniewski.pl',
    'aeroanaliza.pl',
    'www.aeroanaliza.pl'
];

/**
 * Common logic to check for B2B context based on various inputs.
 * Works in both Middleware (NextRequest), Client Components (window), and Server Components.
 */
export function isB2BContext({
    hostname,
    port,
    pathname
}: {
    hostname?: string | null;
    port?: string | null;
    pathname?: string | null;
}): boolean {
    // 0. Galeria/konto routes are NEVER B2B (even on port 3001)
    if (pathname && (pathname.startsWith('/galeria') || pathname.startsWith('/konto') || pathname.startsWith('/strefa-klienta'))) {
        return false;
    }

    // 1. Check Port (local development B2B mock)
    if (port === '3001') return true;

    // 2. Check Hostname
    if (hostname) {
        const lowerHost = hostname.toLowerCase();
        const bareHost = lowerHost.split(':')[0];

        // Direct domain match
        if (B2B_DOMAINS.some(d => bareHost === d.toLowerCase())) {
            return true;
        }

        // Local testing variations
        if (lowerHost === 'localhost:3001' || lowerHost === '127.0.0.1:3001') {
            return true;
        }
    }

    // 3. Check Pathname (legacy subpath)
    if (pathname && (pathname.startsWith('/b2b') || pathname.startsWith('/dron'))) {
        return true;
    }

    return false;
}
