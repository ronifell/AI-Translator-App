import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        aggregateTimeout: 400,
        ignored: ["**/node_modules/**", "**/.git/**", "**/.next/cache/**"],
      };
    }
    return config;
  },
};

export default nextConfig;
