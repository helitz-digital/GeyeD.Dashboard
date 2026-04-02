import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  transpilePackages: ["@geyed/sdk"],
  turbopack: {
    // Resolve linked dependencies outside the project root (e.g. ../GeyeD.SDK)
    root: path.join(__dirname, ".."),
  },
};

export default nextConfig;
