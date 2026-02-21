/** @type {import('next').NextConfig} */
const nextConfig = {
    // transpilePackages: ['swiper', 'ssr-window', 'dom7'], // CDN Fallback used
    images: {
        unoptimized: true,
        qualities: [60, 75, 85, 100],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'wlasniewski-photo-storage.s3.eu-north-1.amazonaws.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    // DO NOT mark @react-pdf/renderer as external - it MUST be bundled for Netlify serverless functions
    // serverExternalPackages: ['@react-pdf/renderer'],
    // Skip database dependency during build
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    // Dla statycznego eksportu (jeśli chcesz wrzucić na zwykły hosting)
    // output: 'export',
    output: 'standalone',
    compress: false, // Fix for controller[kState].transformAlgorithm error

    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Optimize webpack bundle for Netlify serverless deployment
    webpack: (config, { isServer }) => {
        if (isServer) {
            // On server side, do NOT mark @react-pdf/renderer as external
            // It must be bundled with the function for Netlify serverless
            // Keep only Prisma as external if needed
            // config.externals = [...(config.externals || []), '@react-pdf/renderer'];
        }
        return config;
    },
};

export default nextConfig;
