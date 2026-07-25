/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // ESLint runs as a dedicated zero-warning CI gate before the production build.
    eslint: { ignoreDuringBuilds: true },
    transpilePackages: ['@typerift/ai', '@typerift/contracts', '@typerift/domain', '@typerift/ui'],
    async rewrites() {
        if (process.env.NODE_ENV !== 'development') {
            return [];
        }

        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8080/api/:path*'
            }
        ];
    }
};

export default nextConfig;
