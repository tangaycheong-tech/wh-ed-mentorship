/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@neondatabase/serverless"],
  webpack: (config, { isServer }) => {
    // Force resolution of @ alias in server components (fixes Render Node 24 bundling)
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/lib/auth": require.resolve("./lib/auth.ts"),
      "@/lib/db": require.resolve("./lib/db.ts"),
      "@/lib/mentorship": require.resolve("./lib/mentorship.ts"),
      "@/lib/query": require.resolve("./lib/query.ts"),
      "@/lib/utils": require.resolve("./lib/utils.ts"),
      "@/lib/validators": require.resolve("./lib/validators.ts"),
    };
    return config;
  },
};

module.exports = nextConfig;