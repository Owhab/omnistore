import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  transpilePackages: ["@omnistore/ui", "@omnistore/types"],
};

export default nextConfig;
