/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
