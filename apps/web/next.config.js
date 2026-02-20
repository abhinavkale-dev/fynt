const nextConfig = {
    reactStrictMode: true,
    distDir: globalThis.process?.env?.NEXT_DIST_DIR || ".next",
    transpilePackages: ["@repo/prisma", "@repo/shared"],
    serverExternalPackages: ["ioredis", "bullmq"],
    typedRoutes: true,
};
export default nextConfig;
