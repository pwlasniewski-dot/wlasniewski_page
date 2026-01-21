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
            // On server side, allow Prisma but mark for external bundling
            // This helps when using Prisma Data Proxy (engine won't be bundled)
            config.externals = [...(config.externals || [])];
        }
        return config;
    },
};

export default nextConfig;
