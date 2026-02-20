const nextConfig = {
    reactStrictMode: true,
    distDir: ".next",
    transpilePackages: ["@repo/prisma", "@repo/shared"],
    serverExternalPackages: ["ioredis", "bullmq"],
    typedRoutes: true,
};
export default nextConfig;
