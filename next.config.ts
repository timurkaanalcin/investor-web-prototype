import type { NextConfig } from "next";

// Default: root domain (Vercel / llvadacc.customer.org.tr).
// For GitHub Pages path prefix, build with:
//   INVESTOR_BASE_PATH=/investor-web-prototype npm run build
const rawBase = process.env.INVESTOR_BASE_PATH;
const basePath =
  rawBase === undefined ? "" : rawBase.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Static export for Vercel / root domain: https://llvadacc.customer.org.tr
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(basePath
    ? { basePath, assetPrefix: basePath }
    : {}),
};

export default nextConfig;
