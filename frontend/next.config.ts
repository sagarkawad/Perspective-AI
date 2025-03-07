import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Disable ESLint during builds
  },
  /* config options here */
  output: "standalone", // Enable standalone output
};

export default nextConfig;
