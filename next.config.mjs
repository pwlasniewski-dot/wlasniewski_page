/** @type {import('next').NextConfig} */
const privateNoIndexRoutes = [
    '/admin/:path*',
    '/api/:path*',
    '/galeria/:path*',
    '/strefa-klienta/:path*',
    '/konto/:path*',
    '/panel-fotografa/:path*',
    '/logowanie/:path*',
    '/rejestracja/:path*',
    '/checkout/:path*',
    '/invite/:path*',
    '/foto-wyzwanie/invite/:path*',
    '/foto-match/profil/:path*',
    '/foto-match/onboarding/:path*',
    '/foto-match/:path*',
    '/historia',
    '/karta-podarunkowa/dostep/:path*',
];

const nextConfig = {
    poweredByHeader: false,
    // Keep standalone tracing inside this project even when a parent folder
    // contains an unrelated lockfile.
    outputFileTracingRoot: process.cwd(),
    async redirects() {
        return [
            { source: '/start', destination: '/', permanent: true },
            { source: '/strona-glowna', destination: '/', permanent: true },
            { source: '/kontakt-', destination: '/kontakt', permanent: true },
            { source: '/foto-wyzwania', destination: '/foto-wyzwanie', permanent: true },
            { source: '/sklep', destination: '/karta-podarunkowa', permanent: true },
            { source: '/sklep-karty-podarunkowe', destination: '/karta-podarunkowa', permanent: true },
        ];
    },
    async headers() {
        const noIndexHeaders = privateNoIndexRoutes.map(source => ({
            source,
            headers: [
                { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
            ],
        }));

        return [
            ...noIndexHeaders,
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                ],
            },
        ];
    },
    // CRITICAL: Mark pdfkit as external so Webpack doesn't bundle it and break font file paths
    serverExternalPackages: ['pdfkit', '@aws-sdk/client-s3', '@aws-sdk/lib-storage'],
    
    images: {
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 86400,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    
    // Ensure pdfkit data files (Helvetica.afm, etc.) are available in Netlify functions
    outputFileTracingIncludes: {
        '/api/admin/offers/[id]/save-s3': ['./node_modules/pdfkit/js/data/**/*'],
        '/api/offers/[id]/pdf': ['./node_modules/pdfkit/js/data/**/*'],
    },
    
    // Dla statycznego eksportu (jeśli chcesz wrzucić na zwykły hosting)
    // output: 'export',
    output: 'standalone',
    compress: true,

    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },

    webpack: (config) => {
        return config;
    },
};

export default nextConfig;
