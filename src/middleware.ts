import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isB2BContext } from './lib/context';

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

    // Wlasniewski.pl is the photography brand. Legacy B2B paths used to be
    // reachable on this domain too, which mixed two unrelated topics in search.
    // Keep their SEO value by permanently moving visitors to the live B2B site.
    const isPhotographyHost = ['wlasniewski.pl', 'www.wlasniewski.pl'].includes(hostname.split(':')[0].toLowerCase());
    if (isPhotographyHost) {
        const b2bDestinations: Record<string, string> = {
            '/b2b': 'https://aeroanaliza.pl/',
            '/b2b/dron': 'https://aeroanaliza.pl/dron',
            '/b2b/termowizja': 'https://aeroanaliza.pl/dron#termowizja',
            '/b2b/monitoring': 'https://aeroanaliza.pl/monitoring',
            '/dron': 'https://aeroanaliza.pl/dron',
            '/termowizja': 'https://aeroanaliza.pl/dron#termowizja',
            '/monitoring': 'https://aeroanaliza.pl/monitoring',
        };
        const destination = b2bDestinations[url.pathname];
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
        // For sitemap.xml, rewrite to /b2b/sitemap.xml
        if (url.pathname === '/sitemap.xml') {
            url.pathname = '/b2b/sitemap.xml';
            return NextResponse.rewrite(url);
        }

        // Rewrite traffic to /b2b folder
        // Prevent double stacking if the path already starts with /b2b 
        // Also skip admin/api routes (they are global/internal)
        // SKIP /galeria routes - they are B2C only
        if (url.pathname.startsWith('/b2b') ||
            url.pathname.startsWith('/admin') ||
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
