/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: [
        '@typemaster/ai',
        '@typemaster/contracts',
        '@typemaster/domain',
        '@typemaster/ui'
    ],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:8080/api/:path*'
            }
        ];
    }
};

export default nextConfig;
