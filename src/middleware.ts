import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isB2BContext } from './lib/context';
import { LEGACY_B2B_REDIRECTS } from './lib/sites/b2b-routing';

export const config = {
    matcher: [
        /*
         * Match all paths except for:
         * 1. /api routes
         * 2. /_next (Next.js internals)
         * 3. /_static (inside /public)
         * 4. all root files inside /public EXCEPT sitemap.xml and robots.txt
         */
        "/((?!api/|_next/|_static/|[\\w-]+\\.(?!xml|txt)\\w+).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";
    const bareHostname = hostname.split(':')[0].toLowerCase();

    if (bareHostname === 'www.aeroanaliza.pl') {
        const target = new URL(`https://aeroanaliza.pl${url.pathname}`);
        target.search = url.search;
        return NextResponse.redirect(target, 308);
    }

    if (['b2b.wlasniewski.pl', 'dron.wlasniewski.pl'].includes(bareHostname)) {
        const legacyPath = url.pathname === '/dron' || url.pathname === '/start'
            ? '/'
            : url.pathname.replace(/^\/b2b(?=\/|$)/, '') || '/';
        const target = new URL(`https://aeroanaliza.pl${legacyPath}`);
        target.search = url.search;
        return NextResponse.redirect(target, 308);
    }

    // These are photography/customer-zone routes. `isB2BContext` intentionally
    // excludes them, so the host boundary must run before context detection.
    if (bareHostname === 'aeroanaliza.pl' && ['/galeria', '/konto', '/koszyk', '/strefa-klienta'].some(path => url.pathname.startsWith(path))) {
        const target = new URL(`https://wlasniewski.pl${url.pathname}`);
        target.search = url.search;
        return NextResponse.redirect(target, 308);
    }

    // Wlasniewski.pl is the photography brand. Legacy B2B paths used to be
    // reachable on this domain too, which mixed two unrelated topics in search.
    // Keep their SEO value by permanently moving visitors to the live B2B site.
    const isPhotographyHost = ['wlasniewski.pl', 'www.wlasniewski.pl'].includes(bareHostname);
    if (isPhotographyHost) {
        const destination = LEGACY_B2B_REDIRECTS[url.pathname];
        if (destination) {
            const target = new URL(destination);
            target.search = url.search;
            return NextResponse.redirect(target, 308);
        }

        if (url.pathname.startsWith('/b2b/')) {
            const target = new URL(`https://aeroanaliza.pl${url.pathname.slice('/b2b'.length)}`);
            target.search = url.search;
            return NextResponse.redirect(target, 308);
        }
    }

    // Unified Twin-Engine Logic
    const isB2B = isB2BContext({
        hostname: hostname,
        pathname: url.pathname
    });

    if (isB2B) {
        if (url.pathname === '/b2b' || url.pathname.startsWith('/b2b/')) {
            const publicPath = url.pathname.slice('/b2b'.length) || '/';
            const target = new URL('https://aeroanaliza.pl');
            target.pathname = publicPath;
            target.search = url.search;
            return NextResponse.redirect(target, 308);
        }

        const aeroRedirects: Record<string, string> = {
            '/dron': '/',
            '/start': '/',
            '/kontakt': '/#wycena',
            '/kontakt-': '/#wycena',
            '/fotowoltaika': '/inspekcja-fotowoltaiki-dronem',
            '/inspekcja': '/inspekcja-dachu-dronem',
            '/inspekcje': '/inspekcja-dachu-dronem',
        };
        if (aeroRedirects[url.pathname]) {
            const target = new URL(`https://aeroanaliza.pl${aeroRedirects[url.pathname]}`);
            target.search = url.search;
            return NextResponse.redirect(target, 308);
        }

        // Root metadata route already switches its content by Host. Let it run
        // directly; rewriting it to /b2b/robots.txt produced an HTML 404.
        if (url.pathname === '/robots.txt') {
            return NextResponse.next();
        }

        // For sitemap.xml, rewrite to /b2b/sitemap.xml
        if (url.pathname === '/sitemap.xml') {
            url.pathname = '/b2b/sitemap.xml';
            return NextResponse.rewrite(url);
        }

        // Rewrite traffic to /b2b folder
        // Prevent double stacking if the path already starts with /b2b 
        // Also skip admin/api routes (they are global/internal)
        // SKIP /galeria routes - they are B2C only
        if (url.pathname.startsWith('/admin') ||
            url.pathname.startsWith('/api') ||
            url.pathname.startsWith('/galeria')) {
            return NextResponse.next();
        }

        url.pathname = `/b2b${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // B2C (Default) - Serve standard /app/page.tsx
    return NextResponse.next();
}
