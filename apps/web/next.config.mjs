/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    reactStrictMode: true,
    devIndicators: false,
    eslint: { ignoreDuringBuilds: true },
    transpilePackages: ['@typemaster/domain']
};

export default nextConfig;
