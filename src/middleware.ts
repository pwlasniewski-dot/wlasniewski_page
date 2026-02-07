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
         * 4. all root files inside /public (e.g. /favicon.ico)
         */
        "/((?!api/|_next/|_static/|[\\w-]+\\.\\w+).*)",
    ],
};

export default async function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // Unified Twin-Engine Logic
    const isB2B = isB2BContext({
        hostname: hostname,
        pathname: url.pathname
    });

    if (isB2B) {
        // Rewrite traffic to /b2b folder
        // e.g. b2b.wlasniewski.pl/contact -> wlasniewski.pl/b2b/contact
        // e.g. b2b.wlasniewski.pl/ -> wlasniewski.pl/b2b

        // Prevent double stacking if the path already starts with /b2b 
        // Also skip admin/api routes (they are global/internal)
        if (url.pathname.startsWith('/b2b') ||
            url.pathname.startsWith('/admin') ||
            url.pathname.startsWith('/api')) {
            return NextResponse.next();
        }

        url.pathname = `/b2b${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // B2C (Default) - Serve standard /app/page.tsx
    return NextResponse.next();
}
