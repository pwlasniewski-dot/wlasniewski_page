/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [{
            source: '/:path*',
            headers: [
                { key: 'X-Content-Type-Options', value: 'nosniff' },
                { key: 'X-Frame-Options', value: 'DENY' },
                { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
            ],
        }];
    },
    // transpilePackages: ['swiper', 'ssr-window', 'dom7'], // CDN Fallback used
    
    // CRITICAL: Mark pdfkit as external so Webpack doesn't bundle it and break font file paths
    serverExternalPackages: ['pdfkit', '@aws-sdk/client-s3', '@aws-sdk/lib-storage'],
    
    images: {
        unoptimized: true,
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
    
    // Skip database dependency during build
    experimental: {
        serverActions: {
            bodySizeLimit: '50mb',
        },
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
