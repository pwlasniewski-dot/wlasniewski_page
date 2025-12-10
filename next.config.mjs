/** @type {import('next').NextConfig} */
const nextConfig = {
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
    // Skip database dependency during build
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
    // Dla statycznego eksportu (jeśli chcesz wrzucić na zwykły hosting)
    // output: 'export',
    output: 'standalone',
};

export default nextConfig;
