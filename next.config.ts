import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporary host: GitHub Pages. Final: https://investor.customer.org.tr
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: "/investor-web-prototype",
  assetPrefix: "/investor-web-prototype",
};

export default nextConfig;
