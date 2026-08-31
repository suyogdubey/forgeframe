import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Explicitly bypass static prerendering and edge runtime bugs
    workerThreads: false,
    cpus: 1
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};
export default nextConfig;
