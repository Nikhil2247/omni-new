import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Static export for fast serving with 'serve' or nginx
  output: 'export',

  // Static export requires unoptimized images (use external CDN/MinIO for optimization)
  images: {
    unoptimized: true,
  },

  // Enable compression for better performance
  compress: true,

  // Optimize production builds
  productionBrowserSourceMaps: false,

  // Power optimizations
  poweredByHeader: false, // Remove X-Powered-By header for security

  // Trailing slash - helps with static hosting
  trailingSlash: true,

  // Generate ETags for caching
  generateEtags: true,

  // Note: rewrites() and headers() don't work with static export
  // Configure these in nginx/caddy instead
};

export default nextConfig;
