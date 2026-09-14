/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    // ESLint runs as a dedicated zero-warning CI gate before the production build.
    eslint: { ignoreDuringBuilds: true },
    transpilePackages: ['@typerift/ai', '@typerift/contracts', '@typerift/domain', '@typerift/ui'],
    async rewrites() {
        // In development Next.js proxies /api to the API service. A deployed build gets the same
        // routing from the edge instead (see vercel.json), so production stays rewrite-free by
        // default. The performance gate opts in with TYPERIFT_API_ORIGIN so it exercises the real
        // request path; without it the API calls would 404 and every start-up number would be
        // flattering rather than honest.
        const origin = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : process.env.TYPERIFT_API_ORIGIN;

        if (!origin) {
            return [];
        }

        return [
            {
                source: '/api/:path*',
                destination: `${origin}/api/:path*`
            }
        ];
    }
};

export default nextConfig;
